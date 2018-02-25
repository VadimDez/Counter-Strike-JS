/**
	This file contains all the code needed in order to render a bsp version 30
	map.
	
	TODO: Render WAD textures and textures defined in the bsp file
**/

import { mat4 } from 'gl-matrix';
// import * as glMatrix from '../lib/gl-matrix';
// const mat4 = glMatrix.mat4;
import { GameInfo } from './GameInfo';

export const MapRender = function(gl, map) {
	//Shaders
	let fragmentShader =
	"	precision mediump float;" +
	"	varying vec3 forFragColor;" +

	"	void main(void) {" +
	"		gl_FragColor = vec4(forFragColor, 1.0);" +
	"	}";

	let vertexShader =
	"	attribute vec3 aVertexPosition;" +
	"	attribute vec3 aVertexColor;" +

	"	varying vec3 forFragColor;" +

	"	uniform mat4 uMVMatrix;" +
	"	uniform mat4 uPMatrix;" +

	"	void main(void) {" +
	"		gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);" +
	"		forFragColor = aVertexColor;" +
	"	}";

	this.map = map;
	this.gl = gl;

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
			alert("Could not initialise shaders");
		}

		gl.useProgram(program);
		program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
		program.vertexColorAttribute = gl.getAttribLocation(program, "aVertexColor");

		program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
		program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");

		return program;
	})();

	//Create buffers
	let indexBuffer = gl.createBuffer();
	let vertexBuffer = gl.createBuffer();
	let colorBuffer = gl.createBuffer();

	//Array of already drawn faces
	let renderedFaces = [];

	//Check if point lies within min and max
	let pointInBox = function(point, min, max) {
		let x = point[0],
			y = point[1],
			z = point[2];

		return (min[0] <= x && x <= max[0] &&
				min[1] <= y && y <= max[1] &&
				min[2] <= z && z <= max[2]);
	};

	//Search for which leaf the vector "pos" is in. i is the i'th
	//child of the parent node.
	let getLeafForPositionHelper = function(pos, iNode, i) {
		let node = map.nodes[iNode];
		//If the child index is positive it's an index into the node array
		//Otherwise it's an index into the leaf array
		if (node.iChildren[i] >= 0) {
			let min = map.nodes[node.iChildren[i]].nMins;
			let max = map.nodes[node.iChildren[i]].nMaxs;
			if(pointInBox(pos, min, max)) {
				return getLeafForPosition(pos, node.iChildren[i]);
			}
		} else if(~node.iChildren[i] != 0) {
			let min = map.leaves[~node.iChildren[i]].nMins;
			let max = map.leaves[~node.iChildren[i]].nMaxs;
			if(pointInBox(pos, min, max)) {
				//Bitwise inversion according to the specification
				return ~node.iChildren[i];
			}
		}
		return -1;
	};

	//Search for which leaf the vector "pos" is in.
	let getLeafForPosition = function(pos, iNode) {
		let first = getLeafForPositionHelper(pos, iNode, 0);
		//Was it in the first one?
		if(first != -1) {
			//Yep! Return that leaf
			return first;
		} else {
			//Nope. Check the other child
			return getLeafForPositionHelper(pos, iNode, 1);
		}
	};

	let getIndex = function(i, face) {
		let iEdge = map.surfedges[face.iFirstEdge + i];
		let index;
		if(iEdge > 0) {
			let edge = map.edges[iEdge];
			index = edge[0];
		} else {
			let edge = map.edges[-iEdge];
			index = edge[1];
		}
		return index;
	};

	let renderFace = function(iFace, index_array) {
		//If this face has already been drawn just return
		if(!!renderedFaces[iFace]) {
			return;
		}
		//Remember that we have drawn this face
		renderedFaces[iFace] = true;
		let face = map.faces[iFace];

		//No need to render it if it has no light
		if(face.nStyles[0] == 0xFF) return;

		//We need to convert from triangle fans to triangles to allow
		//for a single draw call
		//Thus a sequence of indices describing a triangle fan:
		//0 1 2 3 4 5 6
		//Should be converted to triangles, which in this example is:
		//0 1 2 0 2 3 0 3 4 0 4 5 0 5 6

		//Hardcode the first triangle since we need to reuse this vertex
		let index = getIndex(0, face);
		let center = index;
		index_array.push(index);

		index = getIndex(1, face);
		index_array.push(index);
		let previous = index;

		index = getIndex(2, face);
		index_array.push(index);
		previous = index;

		for(let i = 3; i < face.nEdges; ++i) {
			index = getIndex(i, face);

			index_array.push(center);
			index_array.push(previous);
			index_array.push(index);
			previous = index;
		}
	};

	let renderLeaf = function(iLeaf, index_array) {
		let leaf = map.leaves[iLeaf];
		let n = leaf.nMarkSurfaces;
		for(let i = 0; i < n; ++i) {
			renderFace(map.markSurfaces[leaf.iFirstMarkSurface + i], index_array);
		}
	};

	let render = function(iNode, iLeaf, pos, index_array) {
		//If iNode points to a leaf
		if(iNode < 0) {
			if(iNode == -1) return;

			//If this node is not visible, don't draw it
			if(iLeaf > 0 && (map.visibility[iLeaf-1] &&
				!map.visibility[iLeaf-1][~iNode - 1])) {
				return;
			}

			return renderLeaf(~iNode, index_array);
		}

		let location;

		let plane_index = map.nodes[iNode].iPlane;
		let plane = map.planes.planes[plane_index];
		//If the plane is perpendicular to an axis it's either 0, 1 or 2
		switch (plane.nType) {
			case 0:
				location = pos[0] - plane.distance;
			case 1:
				location = pos[1] - plane.distance;
			case 2:
				location = pos[2] - plane.distance;
			default:
				//Not perpendicular. Calculate the location the hard way using:
				//location = dot(normal, pos) - distance
				//(from http://en.wikipedia.org/wiki/Hesse_normal_form)
				location = (map.planes.normals[3*plane_index] * pos[0] +
					map.planes.normals[3*plane_index+1] * pos[1] +
					map.planes.normals[3*plane_index+2] * pos[2]) - plane.distance;
		}

		//Is the player behind this node or in front?
		if (location > 0.0) {
			//In front: Render the leaves furthest behind first
			render(map.nodes[iNode].iChildren[1], iLeaf, pos, index_array);
			render(map.nodes[iNode].iChildren[0], iLeaf, pos, index_array);
		} else {
			render(map.nodes[iNode].iChildren[0], iLeaf, pos, index_array);
			render(map.nodes[iNode].iChildren[1], iLeaf, pos, index_array);
		}
	};

	this.render = function(pos) {
		gl.useProgram(shaderProgram);

		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
		gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

		//Rotate the map
		mat4.rotateX(GameInfo.mvMatrix, GameInfo.mvMatrix, -Math.PI/2);
		mat4.rotateZ(GameInfo.mvMatrix, GameInfo.mvMatrix, Math.PI/2);
		gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, GameInfo.pMatrix);
		gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, GameInfo.mvMatrix);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, map.vertices, gl.STATIC_DRAW);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3,
			gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, map.lighting, gl.STATIC_DRAW);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 3,
			gl.FLOAT, false, 0, 0);

		//Clear the array that tells us which faces we've already drawn
		renderedFaces.length = 0;

		//Find the leaf that the vector "pos" is locate in
		let iLeaf = getLeafForPosition(pos, 0);

		//Get indices of the required vertices
		let index_array = [];
		render(0, iLeaf, pos, index_array);

		//Bind index buffer
		let buffer = new Uint16Array(index_array);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
		//Finally draw the map!
		gl.drawElements(gl.TRIANGLES, buffer.length, gl.UNSIGNED_SHORT, 0);

		gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
		gl.disableVertexAttribArray(shaderProgram.vertexColorAttribute);
	};
};
