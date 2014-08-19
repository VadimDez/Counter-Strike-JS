/**
	This file contains all the code needed in order to render a textured
	.mdl version 10
**/
define(["lib/gl-matrix", "util/DataReader", "lib/createjs", "GameInfo"], function(glMatrix, DataReader, createjs, GameInfo) {
	/**
		Construct quaternion from Euler angles
	**/
	quatFromAngles = function(angles) {
		var angle0 = angles[0] * 0.5;
		var sr = Math.sin(angle0);
		var cr = Math.cos(angle0);
		
		var angle1 = angles[1] * 0.5;
		var sp = Math.sin(angle1);
		var cp = Math.cos(angle1);
		
		var angle2 = angles[2] * 0.5;
		var sy = Math.sin(angle2);
		var cy = Math.cos(angle2);

		var x = sr*cp*cy-cr*sp*sy;
		var y = cr*sp*cy+sr*cp*sy;
		var z = cr*cp*sy-sr*sp*cy;
		var w = cr*cp*cy+sr*sp*sy;
		
		return [x, y, z, w];
	};
	
	return function(gl, modelData) {
		var constants = {
			valid:			0,
			total:			1,
			STUDIO_X:		0x0001,
			STUDIO_Y:		0x0002,
			STUDIO_Z:		0x0004,
			STUDIO_XR:		0x0008,
			STUDIO_YR:		0x0010,
			STUDIO_ZR:		0x0020,
			STUDIO_TYPES: 	0x7FFF,
			STUDIO_RLOOP:	0x8000,
			EVENT_SOUND:	5004,
			EVENT_FIRE:		5001
		};
		
		var sequenceIndex = 0;
		var frame = 0;
		var customFPS = null;
		var vertexBuffer = gl.createBuffer();
		var animationQueue = [];
		var previous = new Date().getTime();
		
		var fragmentShader = 
		"	precision mediump float;" +
		"	varying vec2 vTexCoord;" +
		"	uniform sampler2D uSampler;" +

		"	void main(void) {" +
		"		gl_FragColor = texture2D(uSampler, vec2(vTexCoord.s, vTexCoord.t));" +
		"	}";
		
		var vertexShader =
		"	attribute vec3 aVertexPosition;" +
		"	attribute vec2 aTexCoord;" +

		"	varying vec2 vTexCoord;" +
			
		"	uniform mat4 uMVMatrix;" +
		"	uniform mat4 uPMatrix;" +

		"	void main(void) {" +
		"		gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);" +
		"		vTexCoord = aTexCoord;" +
		"	}"
		;
		
		function getShader(gl, shaderCode, shaderType) {
			var shader = gl.createShader(shaderType);

			gl.shaderSource(shader, shaderCode);
			gl.compileShader(shader);

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				alert(gl.getShaderInfoLog(shader));
				return null;
			}

			return shader;
		}
		
		var shaderProgram = (function() {
			var sFragmentShader = getShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
			var sVertexShader = getShader(gl, vertexShader, gl.VERTEX_SHADER);
			
			var program = gl.createProgram();
			gl.attachShader(program, sVertexShader);
			gl.attachShader(program, sFragmentShader);
			gl.linkProgram(program);
			
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				alert("Could not initialise shaders");
			}
			
			gl.useProgram(program);
			program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
			program.texCoordAttribute = gl.getAttribLocation(program, "aTexCoord");

			program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
			program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
			program.samplerUniform = gl.getUniformLocation(program, "uSampler");
			
			return program;
		})();
		
		var CalcBoneAdj = function() {
			var adj = [0, 0, 0, 0];
			var numBoneControllers = modelData.header.numBoneControllers;
			for(var j = 0; j < numBoneControllers; ++j) {
				var boneController = modelData.boneControllers[j];
				var i = boneController.index;
				
				var value;
				if(i <= 3) {
					if(boneController.type & constants.RLOOP) {
						value = boneController.start;
					}
					else {						
						value = boneController.start + value * boneController.end;
					}
				}
				else {
					value = boneController.start + value * boneController.end;
				}
				//Chrome refuses to optimize the function due to non constant switch labels
				switch(boneController.type & constants.STUDIO_TYPES)
				{
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
		
		var value = function(base, index) {
			return DataReader.readSignedShort([modelData.data[base + 2*index], modelData.data[base + 2*index + 1]], 0);
		};
		
		var valid = function(base, index) {
			return modelData.data[base + 2*index];
		};
		
		var total = function(base, index) {
			return modelData.data[base + 2*index + 1];
		};
		
		var vec3Equal = function(v1, v2, epsilon) {
			return Math.abs(v1[0] - v2[0]) < epsilon &&
				Math.abs(v1[1] - v2[1]) < epsilon &&
				Math.abs(v1[1] - v2[2]) < epsilon;
		};
		
		var concatTransforms = function(mat1, mat2) {
			var out = [
				[0, 0, 0, 0],
				[0, 0, 0, 0],
				[0, 0, 0, 0]
			];
			out[0][0] = mat1[0][0] * mat2[0][0] + mat1[0][1] * mat2[1][0] +
						mat1[0][2] * mat2[2][0];
			out[0][1] = mat1[0][0] * mat2[0][1] + mat1[0][1] * mat2[1][1] +
						mat1[0][2] * mat2[2][1];
			out[0][2] = mat1[0][0] * mat2[0][2] + mat1[0][1] * mat2[1][2] +
						mat1[0][2] * mat2[2][2];
			out[0][3] = mat1[0][0] * mat2[0][3] + mat1[0][1] * mat2[1][3] +
						mat1[0][2] * mat2[2][3] + mat1[0][3];
			out[1][0] = mat1[1][0] * mat2[0][0] + mat1[1][1] * mat2[1][0] +
						mat1[1][2] * mat2[2][0];
			out[1][1] = mat1[1][0] * mat2[0][1] + mat1[1][1] * mat2[1][1] +
						mat1[1][2] * mat2[2][1];
			out[1][2] = mat1[1][0] * mat2[0][2] + mat1[1][1] * mat2[1][2] +
						mat1[1][2] * mat2[2][2];
			out[1][3] = mat1[1][0] * mat2[0][3] + mat1[1][1] * mat2[1][3] +
						mat1[1][2] * mat2[2][3] + mat1[1][3];
			out[2][0] = mat1[2][0] * mat2[0][0] + mat1[2][1] * mat2[1][0] +
						mat1[2][2] * mat2[2][0];
			out[2][1] = mat1[2][0] * mat2[0][1] + mat1[2][1] * mat2[1][1] +
						mat1[2][2] * mat2[2][1];
			out[2][2] = mat1[2][0] * mat2[0][2] + mat1[2][1] * mat2[1][2] +
						mat1[2][2] * mat2[2][2];
			out[2][3] = mat1[2][0] * mat2[0][3] + mat1[2][1] * mat2[1][3] +
						mat1[2][2] * mat2[2][3] + mat1[2][3];

			return out;
		};
		
		var calcBoneQuaternion = function(frame, s, bone, animation, adj) {
			var angle1 = [0, 0, 0];
			var angle2 = [0, 0, 0];
			for(var j = 0; j < 3; ++j) {
				if(animation.offset[j + 3] === 0) {
					//default;
					angle1[j] = bone.value[j+3];
					angle2[j] = angle1[j];
				}
				else {
					var animIndex = animation.base + animation.offset[j+3];
					var k = Math.floor(frame);
					while(total(animIndex, 0) <= k) {
						k -= total(animIndex, 0);
						var _valid = valid(animIndex, 0);
						animIndex += 2*_valid + 2;
					}
					if(valid(animIndex, 0) > k) {
						angle1[j] = value(animIndex, k+ 1);
						
						if(valid(animIndex, 0) > k + 1) {
							angle2[j] = value(animIndex, k + 2);
						}
						else {
							if (total(animIndex, 0) > k + 1)
								angle2[j] = angle1[j];
							else
								angle2[j] = value(animIndex, valid(animIndex, 0)+2);
						}
					}
					else {
						angle1[j] = value(animIndex, valid(animIndex, 0));
						if (total(animIndex, 0) > k + 1) {
							angle2[j] = angle1[j];
						}
						else {
							angle2[j] = value(animIndex, valid(animIndex, 0)+2);
						}
					}
					angle1[j] = bone.value[j+3] + angle1[j] * bone.scale[j+3];
					angle2[j] = bone.value[j+3] + angle2[j] * bone.scale[j+3];
				}
				
				if(bone.boneController[j + 3] != -1) {
					angle1[j] += adj[bone.boneController[j + 3]];
					angle2[j] += adj[bone.boneController[j + 3]];
				}
			}
			
			//Spherical linear interpolation between the 2 angles
			if(!vec3Equal(angle1, angle2, 0.001)) {
				var q1 = quatFromAngles(angle1);
				var q2 = quatFromAngles(angle2);
				var q = glMatrix.quat.create();
				glMatrix.quat.slerp(q, q1, q2, s);
				return q;
			}
			else {
				return quatFromAngles(angle1);
			}
		};
		
		var calcBonePosition = function(frame, s, bone, animation, adj) {
			var pos = [0, 0, 0];
			
			for(var j = 0; j < 3; ++j) {
				pos[j] = bone.value[j]; //default value
				
				if(animation.offset[j] != 0) {
					var animIndex = animation.base + animation.offset[j];
					
					var k = Math.floor(frame);
					while(total(animIndex, 0) <= k) {
						k -= total(animIndex, 0);
						animIndex += 2*valid(animIndex, 0) + 2;
					}
					
					//If inside span
					if(valid(animIndex, 0) > k) {
						//Is there more data in the span?
						if(valid(animIndex, 0) > k + 1) {
							pos[j] += ((1.0 - s)*value(animIndex, k+1) + s*value(animIndex, k+2)) * bone.scale[j];
						}
						else {
							pos[j] += value(animIndex, k+1) * bone.scale[j];
						}
					}
					else {
						//We are at the end of the span.
						//Do we have another section with data?
						if(total(animIndex, 0) <= k + 1) {
							pos[j] += (value(animIndex, valid(animIndex, 0)) * (1.0 - s) +
								s * value(animIndex, valid(animIndex, 0)+2)) * bone.scale[j];
						
						}
						//No more sections
						else {
							pos[j] += value(animIndex, valid(animIndex, 0)) * bone.scale[j];
						}
					}
				}
				if(bone.boneController[j] != -1) {
					pos[j] += adj[bone.boneController[j]];
				}
			}
			return pos;
		};
		
		var calcRotations = function(frame, sequence) {
			var adj = CalcBoneAdj();
			
			var s = frame - Math.floor(frame);
			
			var quats = Array(modelData.header.numBones);
			var vecs = Array(modelData.header.numBones);
			for(var i = 0; i < modelData.header.numBones; ++i) {
				var bone = modelData.bones[i];
				var animation = getAnimation(sequence, i);
				
				var q = calcBoneQuaternion(frame, s, bone, animation, adj);
				quats[i] = q;
				var pos = calcBonePosition(frame, s, bone, animation, adj);
				vecs[i] = pos;
			}
			
			if (sequence.motionType & constants.STUDIO_X)
				pos[sequence.motionBone][0] = 0.0;
			if (sequence.motiontype & constants.STUDIO_Y)
				pos[sequence.motionBone][1] = 0.0;
			if (sequence.motiontype & constants.STUDIO_Z)
				pos[sequence.motionBone][2] = 0.0;
				
			return {
				quaternions: quats,
				vectors: vecs
			};
		};
		
		var getAnimation = function(sequence, n) {
			var seqGroup = modelData.seqGroups[sequence.seqGroup];
			var index = sequence.animIndex + seqGroup.data + n * 12;
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
		
		var setupBones = function(frame, sequence) {
			var qv = calcRotations(frame, sequence);
			
			var transformations = Array(modelData.header.numBones);
			var bones = modelData.bones;
			
			for(var i = 0; i < modelData.header.numBones; ++i) {
				var mat = glMatrix.mat3.create();
				glMatrix.mat3.fromQuat(mat, qv.quaternions[i]);
				
				var transformation = [
					[mat[0], mat[1], mat[2], qv.vectors[i][0]],
					[mat[3], mat[4], mat[5], qv.vectors[i][1]],
					[mat[6], mat[7], mat[8], qv.vectors[i][2]]
				];
				if(bones[i].parent !== -1) {
					transformation = concatTransforms(transformations[bones[i].parent], transformation);
				}
				transformations[i] = transformation;
			}
			return transformations;
		};
		
		var setupModel = function(bodyNum, n) {
			var index;
			if (n > modelData.header.numBodyParts) {
				n = 0;
			}

			var bodyPart = modelData.bodyParts[bodyNum];
			var index = bodyNum / bodyPart.base;
			index = index % bodyPart.numModels;

			return modelData.models[bodyNum][index];
		};
		
		var vectorTransform = function(vec, mat) {
			var vecOut = glMatrix.vec3.create();
			vecOut[0] = glMatrix.vec3.dot(vec, [mat[0][0], mat[0][1], mat[0][2]]) + mat[0][3];
			vecOut[1] = glMatrix.vec3.dot(vec, [mat[1][0], mat[1][1], mat[1][2]]) + mat[1][3];
			vecOut[2] = glMatrix.vec3.dot(vec, [mat[2][0], mat[2][1], mat[2][2]]) + mat[2][3];
			return vecOut;
		};

		
		var performEvent = function(event) {
			console.log(event);
			switch(event.event) {
				case constants.EVENT_SOUND:
					var path = "data/sounds/" + event.options;
					createjs.Sound.play(path, {interrupt: createjs.Sound.INTERRUPT_ANY});
					break;
				case constants.EVENT_FIRE:
					var weapon = modelData.header.name;
					var path = "data/sounds/weapons/" + weapon.substr(2, weapon.length-6) + "-1.wav";
					createjs.Sound.play(path, {interrupt: createjs.Sound.INTERRUPT_ANY});
			}
		};
		
		var resetEvents = function() {
			var events = modelData.sequences[sequenceIndex].events;
			for(var i = 0; i < events.length; ++i) {
				events[i].started = false;
			}
		}
		
		var preloadEvents = function() {
			var events = modelData.sequences[sequenceIndex].events;
			for(var i = 0; i < events.length; ++i) {
				var event = events[i];
				switch(event.type) {
					case constants.EVENT_SOUND:
						var path = "data/sounds/" + event.filename;
						createjs.Sound.registerSound(path);
						break;
					case constants.EVENT_FIRE:
						var path = "data/sounds/weapons/" + event.sound;
						createjs.Sound.registerSound(path);
				}
			}
		}
		
		var advanceFrame = function(dt, sequence, frame) {
			if(dt > 0.1) {
				dt = 0.1;
			}
			frame += dt * (customFPS || sequence.fps);
			
			var events = sequence.events;
			if(sequence.numFrames <= 1) {
				frame = 0;
			}
			else {
				var newFrame = frame - Math.floor(frame / (sequence.numFrames - 1)) * (sequence.numFrames - 1);
				
				//Check for events
				for(var i = 0; i < events.length; ++i) {
					var event = events[i];
					
					if(newFrame >= event.frame && !event.started) {
						performEvent(event);
						event.started = true;
					}
				}
				
				//Did we just restart our animation?
				if(newFrame < frame) {
					resetEvents();
					
					//Do we have an animation queued up?
					if(animationQueue.length != 0) {
						//Yep. Set index and requested fps
						newFrame = 0;
						var anim = animationQueue.shift();
						sequenceIndex = anim.index;
						customFPS = anim.fps;
						preloadEvents();
					}
				}
				frame = newFrame;
			}
			return frame;
		};
		
		var drawPoints = function(model, transformations) {
			var normBones = model.normInfoIndex;
			var mesh = model.meshIndex;
			
			var vertices = model.vertices;
			
			var transforms = Array(model.numVerts);
			var n = 0;
			for(var i = 0; n < model.numVerts; i += 3, ++n) {
				transforms[n] = vectorTransform([vertices[i], vertices[i+1], vertices[i+2]], transformations[model.transformIndices[n]]);
			}
			
			for(var i = 0; i < model.numMesh; ++i) {
				var mesh = model.mesh[i];
				var texture = modelData.textures[DataReader.readSignedShort(modelData.data, modelData.header.skinIndex + 2*mesh.skinRef)];
				
				var s = 1.0/texture.width;
				var t = 1.0/texture.height;
				
				var index = mesh.triIndex;
				
				gl.bindTexture(gl.TEXTURE_2D, texture.id);
				gl.uniform1i(shaderProgram.samplerUniform, 0);
				
				while(true) {
					var j = DataReader.readSignedShort(modelData.data, index);
					if(j === 0) {
						break;
					}
					index += 2;
					
					var fanMode = false;
					if(j < 0) {
						//Triangle fan mode
						j = -j;
						fanMode = true;
					}
					
					var buffer = [];
					
					for(; j > 0; --j) {
						var vertIndex = DataReader.readSignedShort(modelData.data, index);
						var sCoord = DataReader.readSignedShort(modelData.data, index + 4);
						var tCoord = DataReader.readSignedShort(modelData.data, index + 6);
						
						//Add vertex
						var vertex = transforms[vertIndex];
						
						buffer.push(vertex[0]);
						buffer.push(vertex[1]);
						buffer.push(vertex[2]);
						
						//Add vertex texture
						buffer.push(sCoord*s);
						buffer.push(tCoord*t);
						
						index += 8;
					}
					
					gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer), gl.STREAM_DRAW);
					gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 20, 0);
					gl.vertexAttribPointer(shaderProgram.texCoordAttribute, 2, gl.FLOAT, false, 20, 12);
					if(fanMode) {
						gl.drawArrays(gl.TRIANGLE_FAN, 0, buffer.length/5);
					}
					else {
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.length/5);
					}
				}
			}
		};
		
		this.render = function(){
			gl.useProgram(shaderProgram);
			
			gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
			gl.enableVertexAttribArray(shaderProgram.texCoordAttribute);
			
			
			glMatrix.mat4.rotateX(GameInfo.mvMatrix, GameInfo.mvMatrix, -Math.PI/2);
			glMatrix.mat4.rotateZ(GameInfo.mvMatrix, GameInfo.mvMatrix, Math.PI/2);
			gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, GameInfo.pMatrix);
			gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, GameInfo.mvMatrix);
			
			var sequence = modelData.sequences[sequenceIndex];
			var transformations = setupBones(frame, sequence);
			
			for(var i = 0; i < modelData.header.numBodyParts; ++i) {
				var model = setupModel(i);
				drawPoints(model, transformations);
			}
			
			var now = new Date().getTime();
			var delta = (now - previous)/1000.0;
			frame = advanceFrame(delta, sequence, frame);
			previous = now;
			
			gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
			gl.disableVertexAttribArray(shaderProgram.texCoordAttribute);
		};
		
		this.queueAnimation = function(id, fps) {
			//If no fps was provided, use the default
			fps = fps || modelData.sequences[id].fps;
			animationQueue.push({index: id, fps: fps});
		};
		
		this.forceAnimation = function(id, fps) {
			fps = fps || modelData.sequences[id].fps;
			
			resetEvents();
			sequenceIndex = id;
			customFPS = fps;
			preloadEvents();
			
			frame = 0;
		};
		
		this.currentSequence = function() {
			return sequenceIndex;
		};
	};
});