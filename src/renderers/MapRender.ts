/**
  This file contains all the code needed in order to render a bsp version 30
  map.

  TODO: Render WAD textures and textures defined in the bsp file
**/

import { mat4 } from 'gl-matrix';
import { GameInfo } from '../GameInfo';

export class MapRender {
  // Shaders
  fragmentShader =
    '	precision mediump float;' +
    '	varying vec3 forFragColor;' +
    '	void main(void) {' +
    '		gl_FragColor = vec4(forFragColor, 1.0);' +
    '	}';

  vertexShader =
    '	attribute vec3 aVertexPosition;' +
    '	attribute vec3 aVertexColor;' +
    '	varying vec3 forFragColor;' +
    '	uniform mat4 uMVMatrix;' +
    '	uniform mat4 uPMatrix;' +
    '	void main(void) {' +
    '		gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);' +
    '		forFragColor = aVertexColor;' +
    '	}';

  map: any;
  gl: any;

  // Create buffers
  indexBuffer: any;
  vertexBuffer: any;
  colorBuffer: any;

  // Array of already drawn faces
  renderedFaces = [];

  shaderProgram: any;

  textures: any[] = [];

  constructor(gl: any, map: any) {
    this.map = map;
    this.gl = gl;

    // Create buffers
    this.indexBuffer = this.gl.createBuffer();
    this.vertexBuffer = this.gl.createBuffer();
    this.colorBuffer = this.gl.createBuffer();

    this.shaderProgram = this.getShaderProgram();
  }

  getShaderProgram() {
    let sFragmentShader = this.getShader(
      this.gl,
      this.fragmentShader,
      this.gl.FRAGMENT_SHADER
    );
    let sVertexShader = this.getShader(
      this.gl,
      this.vertexShader,
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
    program.vertexColorAttribute = this.gl.getAttribLocation(
      program,
      'aVertexColor'
    );

    program.pMatrixUniform = this.gl.getUniformLocation(program, 'uPMatrix');
    program.mvMatrixUniform = this.gl.getUniformLocation(program, 'uMVMatrix');

    return program;
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

  // Check if point lies within min and max
  pointInBox(point, min, max) {
    let x = point[0];
    let y = point[1];
    let z = point[2];

    return (
      min[0] <= x &&
      x <= max[0] &&
      min[1] <= y &&
      y <= max[1] &&
      min[2] <= z &&
      z <= max[2]
    );
  }

  // Search for which leaf the vector "pos" is in. i is the i'th
  // child of the parent node.
  getLeafForPositionHelper(pos, iNode, i) {
    let node = this.map.nodes[iNode];
    // If the child index is positive it's an index into the node array
    // Otherwise it's an index into the leaf array
    if (node.iChildren[i] >= 0) {
      let min = this.map.nodes[node.iChildren[i]].nMins;
      let max = this.map.nodes[node.iChildren[i]].nMaxs;
      if (this.pointInBox(pos, min, max)) {
        return this.getLeafForPosition(pos, node.iChildren[i]);
      }
    } else if (~node.iChildren[i] !== 0) {
      let min = this.map.leaves[~node.iChildren[i]].nMins;
      let max = this.map.leaves[~node.iChildren[i]].nMaxs;
      if (this.pointInBox(pos, min, max)) {
        // Bitwise inversion according to the specification
        return ~node.iChildren[i];
      }
    }
    return -1;
  }

  // Search for which leaf the vector "pos" is in.
  getLeafForPosition(pos, iNode) {
    let first = this.getLeafForPositionHelper(pos, iNode, 0);
    // Was it in the first one?
    if (first !== -1) {
      // Yep! Return that leaf
      return first;
    }

    // Nope. Check the other child
    return this.getLeafForPositionHelper(pos, iNode, 1);
  }

  getIndex(i, face) {
    let iEdge = this.map.surfedges[face.iFirstEdge + i];
    let index;
    if (iEdge > 0) {
      let edge = this.map.edges[iEdge];
      index = edge[0];
    } else {
      let edge = this.map.edges[-iEdge];
      index = edge[1];
    }
    return index;
  }

  renderFace(iFace, index_array) {
    // If this face has already been drawn just return
    if (!!this.renderedFaces[iFace]) {
      return;
    }
    // Remember that we have drawn this face
    this.renderedFaces[iFace] = true;
    let face = this.map.faces[iFace];

    // No need to render it if it has no light
    if (face.nStyles[0] == 0xff) {
      return;
    }

    // We need to convert from triangle fans to triangles to allow
    // for a single draw call
    // Thus a sequence of indices describing a triangle fan:
    // 0 1 2 3 4 5 6
    // Should be converted to triangles, which in this example is:
    // 0 1 2 0 2 3 0 3 4 0 4 5 0 5 6

    // Hardcode the first triangle since we need to reuse this vertex
    let index = this.getIndex(0, face);
    let center = index;
    index_array.push(index);

    index = this.getIndex(1, face);
    index_array.push(index);
    let previous = index;

    index = this.getIndex(2, face);
    index_array.push(index);
    previous = index;

    for (let i = 3; i < face.nEdges; ++i) {
      index = this.getIndex(i, face);

      index_array.push(center);
      index_array.push(previous);
      index_array.push(index);
      previous = index;
    }
  }

  renderLeaf(iLeaf, index_array) {
    const leaf = this.map.leaves[iLeaf];
    const n = leaf.nMarkSurfaces;

    for (let i = 0; i < n; ++i) {
      this.renderFace(
        this.map.markSurfaces[leaf.iFirstMarkSurface + i],
        index_array
      );
    }
  }

  renderInternal(iNode, iLeaf, pos, index_array) {
    // If iNode points to a leaf
    if (iNode < 0) {
      if (iNode === -1) {
        return;
      }

      // If this node is not visible, don't draw it
      if (
        iLeaf > 0 &&
        (this.map.visibility[iLeaf - 1] &&
          !this.map.visibility[iLeaf - 1][~iNode - 1])
      ) {
        return;
      }

      return this.renderLeaf(~iNode, index_array);
    }

    let location;

    let plane_index = this.map.nodes[iNode].iPlane;
    let plane = this.map.planes.planes[plane_index];
    // If the plane is perpendicular to an axis it's either 0, 1 or 2
    switch (plane.nType) {
      case 0:
        location = pos[0] - plane.distance;
      case 1:
        location = pos[1] - plane.distance;
      case 2:
        location = pos[2] - plane.distance;
      default:
        // Not perpendicular. Calculate the location the hard way using:
        // location = dot(normal, pos) - distance
        // (from http://en.wikipedia.org/wiki/Hesse_normal_form)
        location =
          this.map.planes.normals[3 * plane_index] * pos[0] +
          this.map.planes.normals[3 * plane_index + 1] * pos[1] +
          this.map.planes.normals[3 * plane_index + 2] * pos[2] -
          plane.distance;
    }

    // Is the player behind this node or in front?
    // In front: Render the leaves furthest behind first
    const array = location > 0.0 ? [1, 0] : [0, 1];
    array.forEach(v => {
      this.renderInternal(
        this.map.nodes[iNode].iChildren[v],
        iLeaf,
        pos,
        index_array
      );
    });
  }

  render(pos) {
    this.gl.useProgram(this.shaderProgram);

    this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
    this.gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);

    // Rotate the map
    mat4.rotateX(GameInfo.mvMatrix, GameInfo.mvMatrix, -Math.PI / 2);
    mat4.rotateZ(GameInfo.mvMatrix, GameInfo.mvMatrix, Math.PI / 2);
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

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.map.vertices,
      this.gl.STATIC_DRAW
    );
    this.gl.vertexAttribPointer(
      this.shaderProgram.vertexPositionAttribute,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.map.lighting,
      this.gl.STATIC_DRAW
    );
    this.gl.vertexAttribPointer(
      this.shaderProgram.vertexColorAttribute,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    // Clear the array that tells us which faces we've already drawn
    this.renderedFaces.length = 0;

    // Find the leaf that the vector "pos" is locate in
    let iLeaf = this.getLeafForPosition(pos, 0);

    // Get indices of the required vertices
    let index_array = [];
    this.renderInternal(0, iLeaf, pos, index_array);

    // this.loadTextures();
    // this.textures.forEach(texture => {
    //   this.gl.bindTexture(this.gl.TEXTURE_2D, texture.handle);
    // });
    // // Bind index buffer
    let buffer = new Uint16Array(index_array);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      buffer,
      this.gl.STATIC_DRAW
    );

    // Finally draw the map!
    this.gl.drawElements(
      this.gl.TRIANGLES,
      buffer.length,
      this.gl.UNSIGNED_SHORT,
      0
    );

    this.gl.disableVertexAttribArray(
      this.shaderProgram.vertexPositionAttribute
    );
    this.gl.disableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
  }

  loadTextures() {
    for (let i = 0; i < this.map.textures.length; ++i) {
      const glTexture = this.gl.createTexture();
      const texture = this.map.textures[i];

      this.gl.bindTexture(this.gl.TEXTURE_2D, glTexture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        texture.width,
        texture.height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        texture.data
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MAG_FILTER,
        this.gl.LINEAR
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MIN_FILTER,
        this.gl.LINEAR_MIPMAP_LINEAR
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_S,
        this.gl.REPEAT
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_T,
        this.gl.REPEAT
      );
      this.gl.generateMipmap(this.gl.TEXTURE_2D);

      this.textures.push({
        name: texture.name,
        width: texture.width,
        height: texture.height,
        data: texture.data,
        handle: glTexture
      });
    }
  }
}
