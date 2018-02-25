/**
	This file contains all the code needed to parse a .mdl file (Version 10)
	into a JSON datastructure.
**/
import { DataReader } from './util/DataReader';

var constants = {
	MDL_MAGIC: 0x54534449,
	MDL_VERSION: 10
};

var data;
var gl;

var parseHeader = function() {
	var magic = DataReader.readInteger(data, 0);
	if (magic != constants.MDL_MAGIC) {
		console.log("Invalid magic number");
		return;
	}

	var version = DataReader.readInteger(data, 4);
	if(version != constants.MDL_VERSION) {
		console.log("Invalid version number. Expected: " + constants.MDL_VERSION + ", but was: " + version);
		return;
	}

	var name = DataReader.readBinaryString(data, 8, 64);
	var length = DataReader.readInteger(data, 72);

	var eyePosition = [
		DataReader.readFloat(data, 76),
		DataReader.readFloat(data, 80),
		DataReader.readFloat(data, 84)
	];
	var min = [
		DataReader.readFloat(data, 88),
		DataReader.readFloat(data, 92),
		DataReader.readFloat(data, 96)
	];
	var max = [
		DataReader.readFloat(data, 100),
		DataReader.readFloat(data, 104),
		DataReader.readFloat(data, 108)
	];

	var bbMin = [
		DataReader.readFloat(data, 112),
		DataReader.readFloat(data, 116),
		DataReader.readFloat(data, 120)
	];
	var bbMax = [
		DataReader.readFloat(data, 124),
		DataReader.readFloat(data, 128),
		DataReader.readFloat(data, 132)
	];

	var flags = DataReader.readInteger(data, 136);

	var numBones = DataReader.readInteger(data, 140);
	var boneIndex = DataReader.readInteger(data, 144);

	var numBoneControllers = DataReader.readInteger(data, 148);
	var boneControllerIndex = DataReader.readInteger(data, 152);

	var numHitBoxes = DataReader.readInteger(data, 156);
	var hitBoxIndex = DataReader.readInteger(data, 160);

	var numSeq = DataReader.readInteger(data, 164);
	var seqIndex = DataReader.readInteger(data, 168);

	var numSeqGroups = DataReader.readInteger(data, 172);
	var seqGroupIndex = DataReader.readInteger(data, 176);

	var numTextures = DataReader.readInteger(data, 180);
	var textureIndex = DataReader.readInteger(data, 184);
	var textureDataIndex = DataReader.readInteger(data, 188);

	var numSkinRef = DataReader.readInteger(data, 192);
	var numSkinFamilies = DataReader.readInteger(data, 196);
	var skinIndex = DataReader.readInteger(data, 200);

	var numBodyParts = DataReader.readInteger(data, 204);
	var bodyPartIndex = DataReader.readInteger(data, 208);

	var numAttachments = DataReader.readInteger(data, 212);
	var attachmentIndex = DataReader.readInteger(data, 216);

	var soundTable = DataReader.readInteger(data, 220);
	var soundIndex = DataReader.readInteger(data, 224);
	var soundGroups = DataReader.readInteger(data, 228);
	var soundGroupIndex = DataReader.readInteger(data, 232);

	var numTransitions = DataReader.readInteger(data, 236);
	var transitionIndex = DataReader.readInteger(data, 240);

	return {
		name: name,

		eyePosition: eyePosition,
		min: min,
		max: max,
		bbMin: bbMin,
		bbMax: bbMax,

		flags: flags,

		numBones: numBones,
		boneIndex: boneIndex,

		numBoneControllers: numBoneControllers,
		boneControllerIndex: boneControllerIndex,

		numHitBoxes: numHitBoxes,
		hitBoxIndex: hitBoxIndex,

		numSeq: numSeq,
		seqIndex: seqIndex,

		numSeqGroups: numSeqGroups,
		seqGroupIndex: seqGroupIndex,

		numTextures: numTextures,
		textureIndex: textureIndex,
		textureDataIndex: textureDataIndex,

		numSkinRef: numSkinRef,
		numSkinFamilies: numSkinFamilies,
		skinIndex: skinIndex,

		numBodyParts: numBodyParts,
		bodyPartIndex: bodyPartIndex,

		numAttachments: numAttachments,
		attachmentIndex: attachmentIndex,

		soundTable: soundTable,
		soundIndex: soundIndex,
		soundGroups: soundGroups,
		soundGroupIndex: soundGroupIndex,

		numTransitions: numTransitions,
		transitionIndex: transitionIndex
	};
};

var parseBones = function(offset, num) {
	var end = offset + num*112;

	var n = 0;
	var bones = Array(num);
	for(var i = offset; i != end; i += 112) {
		var name = DataReader.readBinaryString(data, i, 32);
		var parent = DataReader.readInteger(data, i + 32);
		var flags = DataReader.readInteger(data, i + 36);
		var boneController = [
			DataReader.readInteger(data, i + 40),
			DataReader.readInteger(data, i + 44),
			DataReader.readInteger(data, i + 48),
			DataReader.readInteger(data, i + 52),
			DataReader.readInteger(data, i + 56),
			DataReader.readInteger(data, i + 60)
		];
		//Depth of field
		var value = [
			DataReader.readFloat(data, i + 64),
			DataReader.readFloat(data, i + 68),
			DataReader.readFloat(data, i + 72),
			DataReader.readFloat(data, i + 76),
			DataReader.readFloat(data, i + 80),
			DataReader.readFloat(data, i + 84)
		];
		var scale = [
			DataReader.readFloat(data, i + 88),
			DataReader.readFloat(data, i + 92),
			DataReader.readFloat(data, i + 96),
			DataReader.readFloat(data, i + 100),
			DataReader.readFloat(data, i + 104),
			DataReader.readFloat(data, i + 108)
		];

		bones[n++] = {
			name: name,
			parent: parent,
			flags: flags,
			boneController: boneController,
			value: value,
			scale: scale
		};
	}
	return bones;
};

var parseBoneControllers = function(offset, num) {
	var index_end = offset + num*24;
	var n = 0;
	var controllers = Array(num);
	for(var i = offset; i != index_end; i += 24) {
		var bone = DataReader.readInteger(data, i);
		var type = DataReader.readInteger(data, i + 4);
		var start = DataReader.readFloat(data, i + 8);
		var end = DataReader.readFloat(data, i + 12);
		var rest = DataReader.readInteger(data, i + 16);
		var index = DataReader.readInteger(data, i + 20);

		controllers[n++] = {
			bone: bone,
			type: type,
			start: start,
			end: end,
			rest: rest,
			index: index
		};
	}
	return controllers;
};

var parseSequences = function(offset, num, name) {
	var end = offset + num*176;
	var n = 0;
	var sequences = Array(num);

	for(var i = offset; i != end; i += 176) {
		var label = DataReader.readBinaryString(data, i, 32);

		var fps = DataReader.readFloat(data, i + 32);
		var flags = DataReader.readInteger(data, i + 36);

		var activity = DataReader.readInteger(data, i + 40);
		var actWeight = DataReader.readInteger(data, i + 44);

		var numEvents = DataReader.readInteger(data, i + 48);
		var eventIndex = DataReader.readInteger(data, i + 52);

		var events = Array(numEvents);
		// typedef struct mstudioevent_s
		// {
		// int 		frame;
		// int		event;
		// int		type;
		// char		options[64];
		// } mstudioevent_t;
		var m = 0;
		for(var j = eventIndex; m < numEvents; j += 76) {
			var frame = DataReader.readInteger(data, j);
			var event = DataReader.readInteger(data, j + 4);
			var type = DataReader.readInteger(data, j + 8);
			var options = DataReader.readBinaryString(data, j + 12, 64);
			events[m++] = {
				frame: frame,
				event: event,
				type: type,
				options: options
			};
		}

		var numFrames = DataReader.readInteger(data, i + 56);

		var numPivotes = DataReader.readInteger(data, i + 60);
		var pivotIndex = DataReader.readInteger(data, i + 64);

		var motionType = DataReader.readInteger(data, i + 68);
		var motionBone = DataReader.readInteger(data, i + 72);
		var linearMovement = [
			DataReader.readFloat(data, i + 76),
			DataReader.readFloat(data, i + 80),
			DataReader.readFloat(data, i + 84)
		];
		var autoMovePosIndex = DataReader.readInteger(data, i + 88);
		var autoMoveAngleIndex = DataReader.readInteger(data, i + 92);

		var bbMin = [
			DataReader.readFloat(data, i + 96),
			DataReader.readFloat(data, i + 100),
			DataReader.readFloat(data, i + 104)
		];
		var bbMax = [
			DataReader.readFloat(data, i + 108),
			DataReader.readFloat(data, i + 112),
			DataReader.readFloat(data, i + 116)
		];

		var numBlends = DataReader.readInteger(data, i + 120);
		var animIndex = DataReader.readInteger(data, i + 124);

		var blendType = [
			DataReader.readInteger(data, i + 128),
			DataReader.readInteger(data, i + 132)
		];
		var blendStart = [
			DataReader.readFloat(data, i + 136),
			DataReader.readFloat(data, i + 140)
		];
		var blendEnd = [
			DataReader.readFloat(data, i + 144),
			DataReader.readFloat(data, i + 148)
		];
		var blendParent = DataReader.readInteger(data, i + 152);

		var seqGroup = DataReader.readInteger(data, i + 156);

		var entryNode = DataReader.readInteger(data, i + 160);
		var exitNode = DataReader.readInteger(data, i + 164);
		var nodeFlags = DataReader.readInteger(data, i + 168);

		var nextSeq = DataReader.readInteger(data, i + 172);

		sequences[n++] = {
			 label: label,

			 fps: fps,
			 flags: flags,

			 activity: activity,
			 actWeight: actWeight,

			 events: events,

			 numFrames: numFrames,

			 numPivotes: numPivotes,
			 pivotIndex: pivotIndex,

			 motionType: motionType,
			 motionBone: motionBone,
			 linearMovement: linearMovement,
			 autoMovePosIndex: autoMovePosIndex,
			 autoMoveAngleIndex: autoMoveAngleIndex,

			 bbMin: bbMin,
			 bbMax: bbMax,

			 numBlends: numBlends,
			 animIndex: animIndex,

			 blendType: blendType,
			 blendStart: blendStart,
			 blendEnd: blendEnd,
			 blendParent: blendParent,

			 seqGroup: seqGroup,

			 entryNode: entryNode,
			 exitNode: exitNode,
			 nodeFlags: nodeFlags,

			 nextSeq: nextSeq
		};
	}
	return sequences;
};

var parseSequenceGroups = function(offset, num) {
	var end = offset + num*104;
	var n = 0;
	var groups = Array(num);

	for(var i = offset; i != end; i += 104) {
		var label = DataReader.readBinaryString(data, i, 32);
		var name = DataReader.readBinaryString(data, i + 32, 64);
		var dummy = DataReader.readBinaryString(data, i + 96, 4);
		var _data = DataReader.readInteger(data, 100);

		groups[n++] = {
			label: label,
			name: name,
			dummy: dummy,
			data: _data
		};
	}

	return groups;
};

var uploadTextures = function(texture) {
	//Base 2 logarithm using base conversion formula
	var lg = function(n) {
		return Math.log(n)/Math.LN2;
	}

	//Convert size to power of 2 using formula:
	//f(x) = 2^(ceil(lg(x))). Maximum size is 512 according to specs
	var width = Math.min(Math.pow(2, Math.ceil(lg(texture.width))), 512);
	var height = Math.min(Math.pow(2, Math.ceil(lg(texture.height))), 512);

	var tex = new Uint8Array(width * height * 4);
	var row1 = Array(512);
	var row2 = Array(512);
	var col1 = Array(512);
	var col2 = Array(512);

	for (var i = 0; i < width; i++) {
		col1[i] = Math.floor((i + 0.25) * texture.width / width);
		col2[i] = Math.floor((i + 0.75) * texture.width / width);
	}

	for (var i = 0; i < height; i++) {
		row1[i] = Math.floor((i + 0.25) * (texture.height / height)) * texture.width;
		row2[i] = Math.floor((i + 0.75) * (texture.height / height)) * texture.width;
	}

	var pal = texture.index + texture.width * texture.height;

	var n = 0;
	for (var i = 0; i < height; i++) {
		for (var j = 0; j < width; j++) {
			var pix1 = [
				data[pal + data[texture.index + row1[i] + col1[j]] * 3],
				data[pal + data[texture.index + row1[i] + col1[j]] * 3 + 1],
				data[pal + data[texture.index + row1[i] + col1[j]] * 3 + 2]
			];
			var pix2 = [
				data[pal + data[texture.index + row1[i] + col2[j]] * 3],
				data[pal + data[texture.index + row1[i] + col2[j]] * 3 + 1],
				data[pal + data[texture.index + row1[i] + col2[j]] * 3 + 2]
			];
			var pix3 = [
				data[pal + data[texture.index + row2[i] + col1[j]] * 3],
				data[pal + data[texture.index + row2[i] + col1[j]] * 3 + 1],
				data[pal + data[texture.index + row2[i] + col1[j]] * 3 + 2]
			];
			var pix4 = [
				data[pal + data[texture.index + row2[i] + col2[j]] * 3],
				data[pal + data[texture.index + row2[i] + col2[j]] * 3 + 1],
				data[pal + data[texture.index + row2[i] + col2[j]] * 3 + 2]
			];

			tex[n++] = (pix1[0] + pix2[0] + pix3[0] + pix4[0]) / 4;
			tex[n++] = (pix1[1] + pix2[1] + pix3[1] + pix4[1]) / 4;
			tex[n++] = (pix1[2] + pix2[2] + pix3[2] + pix4[2]) / 4;
			tex[n++] = 0xFF;
		}
	}

	gl.bindTexture(gl.TEXTURE_2D, texture.id);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, tex);
	gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
};

var parseTextures = function(offset, num) {
	var end = offset + num*80;
	var n = 0;
	var textures = Array(num);

	for(var i = offset; i != end; i += 80) {
		var name = DataReader.readBinaryString(data, i, 64);
		var flags = DataReader.readInteger(data, i + 64);
		var width = DataReader.readInteger(data, i + 68);
		var height = DataReader.readInteger(data, i + 72);
		var index = DataReader.readInteger(data, i + 76);
		var id = gl.createTexture();

		var texture = {
			name: name,
			flags: flags,
			width: width,
			height: height,
			index: index,
			id: id
		};

		uploadTextures(texture);
		textures[n++] = texture;
	}

	return textures;
};

var parseBodyParts = function(offset, num) {
	var end = offset + num*76;
	var n = 0;
	var bodyParts = Array(num);

	for(var i = offset; i != end; i += 76) {
		var name = DataReader.readBinaryString(data, i, 64);
		var numModels = DataReader.readInteger(data, i + 64);
		var base = DataReader.readInteger(data, i + 68);
		var modelIndex = DataReader.readInteger(data, i + 72);

		bodyParts[n++] = {
			name: name,
			numModels: numModels,
			base: base,
			modelIndex: modelIndex
		};
	}
	return bodyParts;
};

var parseModels = function(offset, num) {
	var end = offset + num*112;
	var n = 0;
	var models = Array(num);

	var parseVec3s = function(offset, count) {
		var vecs = new Float32Array(count);
		var end = offset + 12*count;
		var n = 0;
		for(var i = offset; i != end; i += 12) {
			vecs[n++] = DataReader.readFloat(data, i);
			vecs[n++] = DataReader.readFloat(data, i + 4);
			vecs[n++] = DataReader.readFloat(data, i + 8);
		}
		return vecs;
	}

	var parseMesh = function(offset, count) {
		var end = offset + 20*count;
		var mesh = Array(count);
		var n = 0;

		for(var i = offset; i != end; i += 20) {
			var numTris = DataReader.readInteger(data, i);
			var triIndex = DataReader.readInteger(data, i + 4);
			var skinRef = DataReader.readInteger(data, i + 8);
			var numNorms = DataReader.readInteger(data, i + 12);
			var normIndex = DataReader.readInteger(data, i + 16);

			mesh[n++] = {
				numTris: numTris,
				triIndex: triIndex,
				skinRef: skinRef,
				numNorms: numNorms,
				normIndex: normIndex
			};
		}

		return mesh;
	};

	for(var i = offset; i != end; i += 112) {
		var name = DataReader.readBinaryString(data, i, 64);
		var type = DataReader.readInteger(data, i + 64);
		var bRadius = DataReader.readFloat(data, i + 68);
		var numMesh = DataReader.readInteger(data, i + 72);
		var meshIndex = DataReader.readInteger(data, i + 76);
		var numVerts = DataReader.readInteger(data, i + 80);
		var vertInfoIndex = DataReader.readInteger(data, i + 84);
		var vertIndex = DataReader.readInteger(data, i + 88);
		var numNorms = DataReader.readInteger(data, i + 92);
		var normInfoIndex = DataReader.readInteger(data, i + 96);
		var normIndex = DataReader.readInteger(data, i + 100);

		var numGroups = DataReader.readInteger(data, i + 104);
		var groupIndex = DataReader.readInteger(data, i + 108);

		var vertices = parseVec3s(vertIndex, 3*numVerts);
		var norms = parseVec3s(normIndex, 3*numNorms);

		var transformIndices = data.subarray(vertInfoIndex, vertInfoIndex+numVerts);
		var mesh = parseMesh(meshIndex, numMesh);

		models[n++] = {
			name: name,
			type: type,
			bRadius: bRadius,
			numMesh: numMesh,
			meshIndex: meshIndex,
			numVerts: numVerts,
			vertInfoIndex: vertInfoIndex,
			vertIndex: vertIndex,
			numNorms: numNorms,
			normInfoIndex: normInfoIndex,
			normIndex: normIndex,

			numGroups: numGroups,
			groupIndex: groupIndex,

			vertices: vertices,
			norms: norms,
			transformIndices: transformIndices,
			mesh: mesh
		};
	}
	return models;
}

export const ModelParser = {
	parse: function(context, input) {
		data = input;
		gl = context;

		var header = parseHeader();
		var bones = parseBones(header.boneIndex, header.numBones);
		var boneControllers = parseBoneControllers(header.boneControllerIndex, header.numBoneControllers);
		var sequences = parseSequences(header.seqIndex, header.numSeq,
			header.name.substr(2, header.name.lastIndexOf(".")-2));
		var seqGroups = parseSequenceGroups(header.seqGroupIndex, header.numSeqGroups);
		var textures = parseTextures(header.textureIndex, header.numTextures);
		var bodyParts = parseBodyParts(header.bodyPartIndex, header.numBodyParts);
		var models = Array(header.numBodyParts);
		for(var i = 0; i < header.numBodyParts; ++i) {
			models[i] = parseModels(bodyParts[i].modelIndex, bodyParts[i].numModels);
		}

		return {
			header: header,
			bones: bones,
			boneControllers: boneControllers,
			sequences: sequences,
			seqGroups: seqGroups,
			textures: textures,
			bodyParts: bodyParts,
			models: models,
			data: input
		};
	}
};