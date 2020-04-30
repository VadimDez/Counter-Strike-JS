/**
	This file contains all the code needed in order to render a textured
	.mdl version 10
**/
import { quat, vec3, mat3, mat4 } from 'gl-matrix';

import { DataReader } from '../util/DataReader';
import { GameInfo } from '../GameInfo';
import { Sound } from './../Sound';

/**
 * Construct quaternion from Euler angles
 * @param angles
 */
let quatFromAngles = function(angles) {
  let angle0 = angles[0] * 0.5;
  let sr = Math.sin(angle0);
  let cr = Math.cos(angle0);

  let angle1 = angles[1] * 0.5;
  let sp = Math.sin(angle1);
  let cp = Math.cos(angle1);

  let angle2 = angles[2] * 0.5;
  let sy = Math.sin(angle2);
  let cy = Math.cos(angle2);

  let x = sr * cp * cy - cr * sp * sy;
  let y = cr * sp * cy + sr * cp * sy;
  let z = cr * cp * sy - sr * sp * cy;
  let w = cr * cp * cy + sr * sp * sy;

  return quat.fromValues(x, y, z, w);
};
const constants = {
  valid: 0,
  total: 1,
  STUDIO_X: 0x0001,
  STUDIO_Y: 0x0002,
  STUDIO_Z: 0x0004,
  STUDIO_XR: 0x0008,
  STUDIO_YR: 0x0010,
  STUDIO_ZR: 0x0020,
  STUDIO_TYPES: 0x7fff,
  STUDIO_RLOOP: 0x8000,
  EVENT_SOUND: 5004,
  EVENT_FIRE: 5001,
  EVENT_FIRE_SINGLE: 5021
};

export const CONSTANTS = constants;

export const ModelRender = function(gl, modelData) {
  let sequenceIndex = 0;
  let frame = 0;
  let customFPS = null;
  let vertexBuffer = gl.createBuffer();
  let animationQueue = [];
  let previous = new Date().getTime();

  let fragmentShader =
    '	precision mediump float;' +
    '	varying vec2 vTexCoord;' +
    '	uniform sampler2D uSampler;' +
    '	void main(void) {' +
    '		gl_FragColor = texture2D(uSampler, vec2(vTexCoord.s, vTexCoord.t));' +
    '	}';

  let vertexShader =
    '	attribute vec3 aVertexPosition;' +
    '	attribute vec2 aTexCoord;' +
    '	varying vec2 vTexCoord;' +
    '	uniform mat4 uMVMatrix;' +
    '	uniform mat4 uPMatrix;' +
    '	void main(void) {' +
    '		gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);' +
    '		vTexCoord = aTexCoord;' +
    '	}';

  // preload sounds
  Sound.preloadSounds(modelData);

  function getShader(gl, shaderCode, shaderType) {
    let shader = gl.createShader(shaderType);

    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  let shaderProgram = (function() {
    let sFragmentShader = getShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
    let sVertexShader = getShader(gl, vertexShader, gl.VERTEX_SHADER);

    let program = gl.createProgram();
    gl.attachShader(program, sVertexShader);
    gl.attachShader(program, sFragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      alert('Could not initialise shaders');
    }

    gl.useProgram(program);
    program.vertexPositionAttribute = gl.getAttribLocation(
      program,
      'aVertexPosition'
    );
    program.texCoordAttribute = gl.getAttribLocation(program, 'aTexCoord');

    program.pMatrixUniform = gl.getUniformLocation(program, 'uPMatrix');
    program.mvMatrixUniform = gl.getUniformLocation(program, 'uMVMatrix');
    program.samplerUniform = gl.getUniformLocation(program, 'uSampler');

    return program;
  })();

  let CalcBoneAdj = function() {
    let adj = [0, 0, 0, 0];
    let numBoneControllers = modelData.header.numBoneControllers;
    for (let j = 0; j < numBoneControllers; ++j) {
      let boneController = modelData.boneControllers[j];
      let i = boneController.index;

      let value;
      if (i <= 3) {
        // if(boneController.type & constants.RLOOP) {
        if (boneController.type & (constants as any).RLOOP) {
          // if(boneController.type & constants.STUDIO_RLOOP) {
          value = boneController.start;
        } else {
          value = boneController.start + value * boneController.end;
        }
      } else {
        value = boneController.start + value * boneController.end;
      }
      // Chrome refuses to optimize the function due to non constant switch labels
      switch (boneController.type & constants.STUDIO_TYPES) {
        case constants.STUDIO_XR:
        case constants.STUDIO_YR:
        case constants.STUDIO_ZR:
          adj[j] = value * (Math.PI / 180.0);
          break;
        case constants.STUDIO_X:
        case constants.STUDIO_Y:
        case constants.STUDIO_Z:
          adj[j] = value;
          break;
      }
    }
    return adj;
  };

  let value = function(base, index) {
    return DataReader.readSignedShort(
      [modelData.data[base + 2 * index], modelData.data[base + 2 * index + 1]],
      0
    );
  };

  let valid = function(base, index) {
    return modelData.data[base + 2 * index];
  };

  let total = function(base, index) {
    return modelData.data[base + 2 * index + 1];
  };

  let vec3Equal = function(v1, v2, epsilon) {
    return (
      Math.abs(v1[0] - v2[0]) < epsilon &&
      Math.abs(v1[1] - v2[1]) < epsilon &&
      Math.abs(v1[1] - v2[2]) < epsilon
    );
  };

  let concatTransforms = function(mat1, mat2) {
    let out = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    out[0][0] =
      mat1[0][0] * mat2[0][0] +
      mat1[0][1] * mat2[1][0] +
      mat1[0][2] * mat2[2][0];
    out[0][1] =
      mat1[0][0] * mat2[0][1] +
      mat1[0][1] * mat2[1][1] +
      mat1[0][2] * mat2[2][1];
    out[0][2] =
      mat1[0][0] * mat2[0][2] +
      mat1[0][1] * mat2[1][2] +
      mat1[0][2] * mat2[2][2];
    out[0][3] =
      mat1[0][0] * mat2[0][3] +
      mat1[0][1] * mat2[1][3] +
      mat1[0][2] * mat2[2][3] +
      mat1[0][3];
    out[1][0] =
      mat1[1][0] * mat2[0][0] +
      mat1[1][1] * mat2[1][0] +
      mat1[1][2] * mat2[2][0];
    out[1][1] =
      mat1[1][0] * mat2[0][1] +
      mat1[1][1] * mat2[1][1] +
      mat1[1][2] * mat2[2][1];
    out[1][2] =
      mat1[1][0] * mat2[0][2] +
      mat1[1][1] * mat2[1][2] +
      mat1[1][2] * mat2[2][2];
    out[1][3] =
      mat1[1][0] * mat2[0][3] +
      mat1[1][1] * mat2[1][3] +
      mat1[1][2] * mat2[2][3] +
      mat1[1][3];
    out[2][0] =
      mat1[2][0] * mat2[0][0] +
      mat1[2][1] * mat2[1][0] +
      mat1[2][2] * mat2[2][0];
    out[2][1] =
      mat1[2][0] * mat2[0][1] +
      mat1[2][1] * mat2[1][1] +
      mat1[2][2] * mat2[2][1];
    out[2][2] =
      mat1[2][0] * mat2[0][2] +
      mat1[2][1] * mat2[1][2] +
      mat1[2][2] * mat2[2][2];
    out[2][3] =
      mat1[2][0] * mat2[0][3] +
      mat1[2][1] * mat2[1][3] +
      mat1[2][2] * mat2[2][3] +
      mat1[2][3];

    return out;
  };

  let calcBoneQuaternion = function(frame, s, bone, animation, adj) {
    let angle1 = vec3.fromValues(0, 0, 0);
    let angle2 = vec3.fromValues(0, 0, 0);

    for (let j = 0; j < 3; ++j) {
      if (animation.offset[j + 3] === 0) {
        // default;
        angle1[j] = bone.value[j + 3];
        angle2[j] = angle1[j];
      } else {
        let animIndex = animation.base + animation.offset[j + 3];
        let k = Math.floor(frame);

        while (total(animIndex, 0) <= k) {
          k -= total(animIndex, 0);
          let _valid = valid(animIndex, 0);
          animIndex += 2 * _valid + 2;
        }

        if (valid(animIndex, 0) > k) {
          angle1[j] = value(animIndex, k + 1);

          if (valid(animIndex, 0) > k + 1) {
            angle2[j] = value(animIndex, k + 2);
          } else {
            if (total(animIndex, 0) > k + 1) {
              angle2[j] = angle1[j];
            } else {
              angle2[j] = value(animIndex, valid(animIndex, 0) + 2);
            }
          }
        } else {
          angle1[j] = value(animIndex, valid(animIndex, 0));

          if (total(animIndex, 0) > k + 1) {
            angle2[j] = angle1[j];
          } else {
            angle2[j] = value(animIndex, valid(animIndex, 0) + 2);
          }
        }
        angle1[j] = bone.value[j + 3] + angle1[j] * bone.scale[j + 3];
        angle2[j] = bone.value[j + 3] + angle2[j] * bone.scale[j + 3];
      }

      if (bone.boneController[j + 3] !== -1) {
        angle1[j] += adj[bone.boneController[j + 3]];
        angle2[j] += adj[bone.boneController[j + 3]];
      }
    }

    // Spherical linear interpolation between the 2 angles
    if (!vec3Equal(angle1, angle2, 0.001)) {
      let q1 = quatFromAngles(angle1);
      let q2 = quatFromAngles(angle2);
      let q = quat.create();
      quat.slerp(q, q1, q2, s);
      return q;
    }

    return quatFromAngles(angle1);
  };

  let calcBonePosition = function(frame, s, bone, animation, adj) {
    let pos = [0, 0, 0];

    for (let j = 0; j < 3; ++j) {
      pos[j] = bone.value[j]; // default value

      if (animation.offset[j] !== 0) {
        let animIndex = animation.base + animation.offset[j];

        let k = Math.floor(frame);
        while (total(animIndex, 0) <= k) {
          k -= total(animIndex, 0);
          animIndex += 2 * valid(animIndex, 0) + 2;
        }

        // If inside span
        if (valid(animIndex, 0) > k) {
          // Is there more data in the span?
          if (valid(animIndex, 0) > k + 1) {
            pos[j] +=
              ((1.0 - s) * value(animIndex, k + 1) +
                s * value(animIndex, k + 2)) *
              bone.scale[j];
          } else {
            pos[j] += value(animIndex, k + 1) * bone.scale[j];
          }
        } else {
          // We are at the end of the span.
          // Do we have another section with data?
          if (total(animIndex, 0) <= k + 1) {
            pos[j] +=
              (value(animIndex, valid(animIndex, 0)) * (1.0 - s) +
                s * value(animIndex, valid(animIndex, 0) + 2)) *
              bone.scale[j];
          } else {
            // No more sections
            pos[j] += value(animIndex, valid(animIndex, 0)) * bone.scale[j];
          }
        }
      }

      if (bone.boneController[j] !== -1) {
        pos[j] += adj[bone.boneController[j]];
      }
    }
    return pos;
  };

  let calcRotations = function(frame, sequence) {
    let pos;
    let q;
    let adj = CalcBoneAdj();

    let s = frame - Math.floor(frame);

    let quats = Array(modelData.header.numBones);
    let vecs = Array(modelData.header.numBones);

    for (let i = 0; i < modelData.header.numBones; ++i) {
      let bone = modelData.bones[i];
      let animation = getAnimation(sequence, i);

      q = calcBoneQuaternion(frame, s, bone, animation, adj);
      quats[i] = q;
      pos = calcBonePosition(frame, s, bone, animation, adj);
      vecs[i] = pos;
    }

    if (sequence.motionType & constants.STUDIO_X) {
      pos[sequence.motionBone][0] = 0.0;
    }

    if (sequence.motiontype & constants.STUDIO_Y) {
      pos[sequence.motionBone][1] = 0.0;
    }

    if (sequence.motiontype & constants.STUDIO_Z) {
      pos[sequence.motionBone][2] = 0.0;
    }

    return {
      quaternions: quats,
      vectors: vecs
    };
  };

  let getAnimation = function(sequence, n) {
    let seqGroup = modelData.seqGroups[sequence.seqGroup];
    let index = sequence.animIndex + seqGroup.data + n * 12;
    return {
      base: index,
      offset: [
        modelData.data[index] + (modelData.data[index + 1] << 8),
        modelData.data[index + 2] + (modelData.data[index + 3] << 8),
        modelData.data[index + 4] + (modelData.data[index + 5] << 8),
        modelData.data[index + 6] + (modelData.data[index + 7] << 8),
        modelData.data[index + 8] + (modelData.data[index + 9] << 8),
        modelData.data[index + 10] + (modelData.data[index + 11] << 8)
      ]
    };
  };

  let setupBones = function(frame, sequence) {
    let qv = calcRotations(frame, sequence);
    let transformations = Array(modelData.header.numBones);
    let bones = modelData.bones;

    for (let i = 0; i < modelData.header.numBones; ++i) {
      let mat = mat3.create();

      mat3.fromQuat(
        mat,
        quat.fromValues(
          qv.quaternions[i][0] * -1,
          qv.quaternions[i][1] * -1,
          qv.quaternions[i][2] * -1,
          qv.quaternions[i][3]
        )
      );

      let transformation = [
        [mat[0], mat[1], mat[2], qv.vectors[i][0]],
        [mat[3], mat[4], mat[5], qv.vectors[i][1]],
        [mat[6], mat[7], mat[8], qv.vectors[i][2]]
      ];
      if (bones[i].parent !== -1) {
        transformation = concatTransforms(
          transformations[bones[i].parent],
          transformation
        );
      }
      transformations[i] = transformation;
    }
    return transformations;
  };

  let setupModel = function(bodyNum: number, n?: number) {
    if (n > modelData.header.numBodyParts) {
      n = 0;
    }

    let bodyPart = modelData.bodyParts[bodyNum];
    let index = bodyNum / bodyPart.base;
    index = index % bodyPart.numModels;

    return modelData.models[bodyNum][index];
  };

  let vectorTransform = function(vec, mat) {
    return vec3.fromValues(
      vec3.dot(vec, [mat[0][0], mat[0][1], mat[0][2]]) + mat[0][3],
      vec3.dot(vec, [mat[1][0], mat[1][1], mat[1][2]]) + mat[1][3],
      vec3.dot(vec, [mat[2][0], mat[2][1], mat[2][2]]) + mat[2][3]
    );
  };

  let performEvent = function(event) {
    const path = Sound.getSoundPath(event, modelData);

    if (path) {
      // createjs.Sound.registerSound(path, path);
      createjs.Sound.play(path, {
        interrupt: createjs.Sound.INTERRUPT_ANY,
        volume: 0.1
      });
    }
  };

  let resetEvents = function() {
    let events = modelData.sequences[sequenceIndex].events;
    for (let i = 0; i < events.length; ++i) {
      events[i].started = false;
    }
  };

  let advanceFrame = function(dt, sequence, frame) {
    if (dt > 0.1) {
      dt = 0.1;
    }
    frame += dt * (customFPS || sequence.fps);

    let events = sequence.events;

    if (sequence.numFrames <= 1) {
      return 0;
    }

    let newFrame =
      frame -
      Math.floor(frame / (sequence.numFrames - 1)) * (sequence.numFrames - 1);

    // Check for events
    for (let i = 0; i < events.length; ++i) {
      const event = events[i];

      if (newFrame >= event.frame && !event.started) {
        performEvent(event);
        event.started = true;
      }
    }

    // Did we just restart our animation?
    if (newFrame < frame) {
      resetEvents();

      // Do we have an animation queued up?
      if (animationQueue.length) {
        // Yep. Set index and requested fps
        newFrame = 0;
        const anim = animationQueue.shift();
        sequenceIndex = anim.index;
        customFPS = anim.fps;
        // Sound.preloadSounds();
      }
    }
    return newFrame;
  };

  let drawPoints = function(model, transformations) {
    const normBones = model.normInfoIndex;
    const mesh = model.meshIndex;
    const vertices = model.vertices;

    let transforms = Array(model.numVerts);
    let n = 0;
    for (let i = 0; n < model.numVerts; i += 3, ++n) {
      transforms[n] = vectorTransform(
        [vertices[i], vertices[i + 1], vertices[i + 2]],
        transformations[model.transformIndices[n]]
      );
    }

    for (let i = 0; i < model.numMesh; ++i) {
      let mesh = model.mesh[i];
      let texture =
        modelData.textures[
          DataReader.readSignedShort(
            modelData.data,
            modelData.header.skinIndex + 2 * mesh.skinRef
          )
        ];

      let s = 1.0 / texture.width;
      let t = 1.0 / texture.height;

      let index = mesh.triIndex;

      gl.bindTexture(gl.TEXTURE_2D, texture.id);
      gl.uniform1i(shaderProgram.samplerUniform, 0);

      while (true) {
        let j = DataReader.readSignedShort(modelData.data, index);
        if (j === 0) {
          break;
        }
        index += 2;

        let fanMode = false;
        if (j < 0) {
          // Triangle fan mode
          j = -j;
          fanMode = true;
        }

        let buffer = [];

        for (; j > 0; --j) {
          let vertIndex = DataReader.readSignedShort(modelData.data, index);
          let sCoord = DataReader.readSignedShort(modelData.data, index + 4);
          let tCoord = DataReader.readSignedShort(modelData.data, index + 6);

          // Add vertex
          let vertex = transforms[vertIndex];

          buffer.push(vertex[0]);
          buffer.push(vertex[1]);
          buffer.push(vertex[2]);

          // Add vertex texture
          buffer.push(sCoord * s);
          buffer.push(tCoord * t);

          index += 8;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(buffer),
          gl.STREAM_DRAW
        );
        gl.vertexAttribPointer(
          shaderProgram.vertexPositionAttribute,
          3,
          gl.FLOAT,
          false,
          20,
          0
        );
        gl.vertexAttribPointer(
          shaderProgram.texCoordAttribute,
          2,
          gl.FLOAT,
          false,
          20,
          12
        );

        if (fanMode) {
          gl.drawArrays(gl.TRIANGLE_FAN, 0, buffer.length / 5);
        } else {
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.length / 5);
        }
      }
    }
  };

  this.render = function() {
    gl.useProgram(shaderProgram);

    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.texCoordAttribute);

    mat4.rotateX(GameInfo.mvMatrix, GameInfo.mvMatrix, -Math.PI / 2);
    mat4.rotateZ(GameInfo.mvMatrix, GameInfo.mvMatrix, Math.PI / 2);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, GameInfo.pMatrix);
    gl.uniformMatrix4fv(
      shaderProgram.mvMatrixUniform,
      false,
      GameInfo.mvMatrix
    );

    let sequence = modelData.sequences[sequenceIndex];
    let transformations = setupBones(frame, sequence);

    for (let i = 0; i < modelData.header.numBodyParts; ++i) {
      let model = setupModel(i);
      drawPoints(model, transformations);
    }

    const now = new Date().getTime();
    const delta = (now - previous) / 1000.0;
    frame = advanceFrame(delta, sequence, frame);
    previous = now;

    gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(shaderProgram.texCoordAttribute);
  };

  this.queueAnimation = function(id, fps) {
    // If no fps was provided, use the default
    fps = fps || modelData.sequences[id].fps;
    animationQueue.push({ index: id, fps: fps });
  };

  this.forceAnimation = function(id, fps) {
    fps = fps || modelData.sequences[id].fps;

    resetEvents();
    sequenceIndex = id;
    customFPS = fps;
    // Sound.preloadSounds();

    frame = 0;
  };

  this.currentSequence = function() {
    return sequenceIndex;
  };
};
