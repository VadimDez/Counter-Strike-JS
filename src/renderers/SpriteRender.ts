/**
	This file contains all the code needed to render a .spr file (Version 2)
	by converting the sprite into a texture.
**/
import { GameInfo } from '../GameInfo';

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

export class SpriteRender {
  shaderProgram: any;
  gl: any;
  buffer: any;
  texture: any;

  constructor(gl, sprite) {
    this.gl = gl;
    this.shaderProgram = this.getShaderProgram();

    this.buffer = this.gl.createBuffer();
    this.texture = this.gl.createTexture();

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      sprite.frames[0].width,
      sprite.frames[0].height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      sprite.frames[0].imageData
    );
    this.gl.texParameterf(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameterf(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR
    );
    // Subsprites are not guaranteed to be of size 2^n for some n,
    // so we disable this restriction
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
  }

  getShader(gl, shaderCode, shaderType) {
    let shader = gl.createShader(shaderType);

    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  getShaderProgram() {
    let sFragmentShader = this.getShader(
      this.gl,
      fragmentShader,
      this.gl.FRAGMENT_SHADER
    );
    let sVertexShader = this.getShader(
      this.gl,
      vertexShader,
      this.gl.VERTEX_SHADER
    );

    let program = this.gl.createProgram();
    this.gl.attachShader(program, sVertexShader);
    this.gl.attachShader(program, sFragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      alert('Could not initialise shaders');
    }

    this.gl.useProgram(program);
    program.vertexPositionAttribute = this.gl.getAttribLocation(
      program,
      'aVertexPosition'
    );
    program.texCoordAttribute = this.gl.getAttribLocation(program, 'aTexCoord');

    program.pMatrixUniform = this.gl.getUniformLocation(program, 'uPMatrix');
    program.mvMatrixUniform = this.gl.getUniformLocation(program, 'uMVMatrix');
    program.samplerUniform = this.gl.getUniformLocation(program, 'uSampler');

    return program;
  }

  render() {
    this.gl.useProgram(this.shaderProgram);
    this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
    this.gl.enableVertexAttribArray(this.shaderProgram.texCoordAttribute);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.disable(this.gl.DEPTH_TEST);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    let vertices = [
      1.0,
      1.0,
      0.0,
      1.0,

      0.0,
      -1.0,
      1.0,
      0.0,

      0.0,
      0.0,
      1.0,
      -1.0,

      0.0,
      1.0,
      1.0,
      -1.0,

      -1.0,
      0.0,
      0.0,
      1.0
    ];
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
    );

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(this.shaderProgram.samplerUniform, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.vertexAttribPointer(
      this.shaderProgram.vertexPositionAttribute,
      3,
      this.gl.FLOAT,
      false,
      20,
      0
    );
    this.gl.vertexAttribPointer(
      this.shaderProgram.texCoordAttribute,
      2,
      this.gl.FLOAT,
      false,
      20,
      12
    );

    // mat4.scale(GameInfo.mvMatrix, GameInfo.mvMatrix, [1/sprite.header.maxWidth, 1/sprite.header.maxHeight, 1]);

    this.gl.uniformMatrix4fv(
      this.shaderProgram.pMatrixUniform,
      false,
      GameInfo.pMatrix
    );
    this.gl.uniformMatrix4fv(
      this.shaderProgram.mvMatrixUniform,
      false,
      GameInfo.mvMatrix
    );
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);
  }
}
