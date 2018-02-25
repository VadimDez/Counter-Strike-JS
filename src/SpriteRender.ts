/**
	This file contains all the code needed to render a .spr file (Version 2)
	by converting the sprite into a texture.
**/
import { GameInfo } from './GameInfo';

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

export const SpriteRender = function(gl, sprite) {
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
    program.vertexPositionAttribute = gl.getAttribLocation(program, 'aVertexPosition');
    program.texCoordAttribute = gl.getAttribLocation(program, 'aTexCoord');

    program.pMatrixUniform = gl.getUniformLocation(program, 'uPMatrix');
    program.mvMatrixUniform = gl.getUniformLocation(program, 'uMVMatrix');
    program.samplerUniform = gl.getUniformLocation(program, 'uSampler');

    return program;
  })();

  let buffer = gl.createBuffer();

  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sprite.frames[0].width, sprite.frames[0].height, 0, gl.RGBA, gl.UNSIGNED_BYTE, sprite.frames[0].imageData);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Subsprites are not guaranteed to be of size 2^n for some n,
  // so we disable this restriction
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  this.render = function() {
    gl.useProgram(shaderProgram);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.texCoordAttribute);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    let vertices = [
      1.0,  1.0,  0.0,  1.0, 0.0,
      -1.0,  1.0,  0.0,  0.0, 0.0,
      1.0, -1.0,  0.0,  1.0, 1.0,
      -1.0, -1.0,  0.0,  0.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(shaderProgram.texCoordAttribute, 2, gl.FLOAT, false, 20, 12);

    // mat4.scale(cs.mvMatrix, cs.mvMatrix, [1/sprite.header.maxWidth, 1/sprite.header.maxHeight, 1]);

    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, GameInfo.pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, GameInfo.mvMatrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  };
};
