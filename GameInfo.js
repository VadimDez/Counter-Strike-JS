define(["lib/gl-matrix"], function(glMatrix) {
	return {
		gl: null,
		player: null,
		map: null,
		mvMatrix: glMatrix.mat4.create(),
		pMatrix: glMatrix.mat4.create()
	}
});