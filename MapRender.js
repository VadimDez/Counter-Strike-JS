/**
	This file contains all the code needed in order to render a bsp version 30
	map.
	
	TODO: Render WAD textures and textures defined in the bsp file
**/

define(["GameInfo", "lib/gl-matrix"], function(GameInfo, glMatrix) {
	return function(gl, map) {
		//Shaders
		var fragmentShader =
		"	precision mediump float;" +
		"	varying vec3 forFragColor;" +

		"	void main(void) {" +
		"		gl_FragColor = vec4(forFragColor, 1.0);" +
		"	}";
			
		var vertexShader =
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
			program.vertexColorAttribute = gl.getAttribLocation(program, "aVertexColor");

			program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
			program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
			
			return program;
		})();
		
		//Create buffers
		var indexBuffer = gl.createBuffer();
		var vertexBuffer = gl.createBuffer();
		var colorBuffer = gl.createBuffer();
		
		//Array of already drawn faces
		var renderedFaces = [];
		
		//Check if point lies within min and max
		var pointInBox = function(point, min, max) {
			var x = point[0],
				y = point[1],
				z = point[2];
				
			return (min[0] <= x && x <= max[0] &&
					min[1] <= y && y <= max[1] &&
					min[2] <= z && z <= max[2]);
		}
		
		//Search for which leaf the vector "pos" is in. i is the i'th
		//child of the parent node.
		var getLeafForPositionHelper = function(pos, iNode, i) {
			var node = map.nodes[iNode];
			//If the child index is positive it's an index into the node array
			//Otherwise it's an index into the leaf array
			if(node.iChildren[i] >= 0) {
				var min = map.nodes[node.iChildren[i]].nMins;
				var max = map.nodes[node.iChildren[i]].nMaxs;
				if(pointInBox(pos, min, max)) {
					return getLeafForPosition(pos, node.iChildren[i]);
				}
			}
			else if(~node.iChildren[i] != 0) {
				var min = map.leaves[~node.iChildren[i]].nMins;
				var max = map.leaves[~node.iChildren[i]].nMaxs;
				if(pointInBox(pos, min, max)) {
					//Bitwise inversion according to the specification
					return ~node.iChildren[i];
				}
			}
			return -1;
		}
		
		//Search for which leaf the vector "pos" is in.
		var getLeafForPosition = function(pos, iNode) {
			var first = getLeafForPositionHelper(pos, iNode, 0);
			//Was it in the first one?
			if(first != -1) {
				//Yep! Return that leaf
				return first;
			}
			else {
				//Nope. Check the other child
				return getLeafForPositionHelper(pos, iNode, 1);
			}
		};
		
		var getIndex = function(i, face) {
			var iEdge = map.surfedges[face.iFirstEdge + i];
			var index;
			if(iEdge > 0) {
				var edge = map.edges[iEdge];
				index = edge[0];
			}
			else {
				var edge = map.edges[-iEdge];
				index = edge[1];
			}
			return index;
		}
		
		var renderFace = function(iFace, index_array) {
			//If this face has already been drawn just return
			if(!!renderedFaces[iFace]) {
				return;
			}
			//Remember that we have drawn this face
			renderedFaces[iFace] = true;
			var face = map.faces[iFace];
			
			//No need to render it if it has no light
			if(face.nStyles[0] == 0xFF) return;
			
			//We need to convert from triangle fans to triangles to allow
			//for a single draw call
			//Thus a sequence of indices describing a triangle fan:
			//0 1 2 3 4 5 6
			//Should be converted to triangles, which in this example is:
			//0 1 2 0 2 3 0 3 4 0 4 5 0 5 6
			
			//Hardcode the first triangle since we need to reuse this vertex
			var index = getIndex(0, face);
			var center = index;
			index_array.push(index);
			
			index = getIndex(1, face);
			index_array.push(index);
			var previous = index;
				
			index = getIndex(2, face);
			index_array.push(index);
			previous = index;
			
			for(var i = 3; i < face.nEdges; ++i) {			
				index = getIndex(i, face);
				
				index_array.push(center);
				index_array.push(previous);
				index_array.push(index);
				previous = index;
			}
		}
		
		var renderLeaf = function(iLeaf, index_array) {
			var leaf = map.leaves[iLeaf];
			var n = leaf.nMarkSurfaces;
			for(var i = 0; i < n; ++i) {
				renderFace(map.markSurfaces[leaf.iFirstMarkSurface + i], index_array);
			}
		}
		
		var render = function(iNode, iLeaf, pos, index_array) {
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
		
			var location;
			
			var plane_index = map.nodes[iNode].iPlane;
			var plane = map.planes.planes[plane_index];
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
			}
			else {
				render(map.nodes[iNode].iChildren[0], iLeaf, pos, index_array);
				render(map.nodes[iNode].iChildren[1], iLeaf, pos, index_array);
			}
		};
		
		this.render = function(pos) {
			gl.useProgram(shaderProgram);
			
			gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
			gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

			//Rotate the map
			glMatrix.mat4.rotateX(GameInfo.mvMatrix, GameInfo.mvMatrix, -Math.PI/2);
			glMatrix.mat4.rotateZ(GameInfo.mvMatrix, GameInfo.mvMatrix, Math.PI/2);
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
			var iLeaf = getLeafForPosition(pos, 0);
			
			//Get indices of the required vertices
			var index_array = [];
			render(0, iLeaf, pos, index_array);
			
			//Bind index buffer
			var buffer = new Uint16Array(index_array);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
			//Finally draw the map!
			gl.drawElements(gl.TRIANGLES, buffer.length, gl.UNSIGNED_SHORT, 0);
			
			gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
			gl.disableVertexAttribArray(shaderProgram.vertexColorAttribute);
		};	
	};
});