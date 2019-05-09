/**
  This file contains all the code needed to parse a .mdl file (Version 10)
  into a JSON datastructure.
**/
import { DataReader } from '../util/DataReader';

const constants = {
  MDL_MAGIC: 0x54534449,
  MDL_VERSION: 10
};

let data;
let gl;

let parseHeader = function() {
  const magic = DataReader.readInteger(data, 0);
  if (magic !== constants.MDL_MAGIC) {
    console.log('Invalid magic number');
    return;
  }

  const version = DataReader.readInteger(data, 4);
  if (version !== constants.MDL_VERSION) {
    console.log(
      'Invalid version number. Expected: ' +
        constants.MDL_VERSION +
        ', but was: ' +
        version
    );
    return;
  }

  let name = DataReader.readBinaryString(data, 8, 64);
  let length = DataReader.readInteger(data, 72);

  let eyePosition = [
    DataReader.readFloat(data, 76),
    DataReader.readFloat(data, 80),
    DataReader.readFloat(data, 84)
  ];
  let min = [
    DataReader.readFloat(data, 88),
    DataReader.readFloat(data, 92),
    DataReader.readFloat(data, 96)
  ];
  let max = [
    DataReader.readFloat(data, 100),
    DataReader.readFloat(data, 104),
    DataReader.readFloat(data, 108)
  ];

  let bbMin = [
    DataReader.readFloat(data, 112),
    DataReader.readFloat(data, 116),
    DataReader.readFloat(data, 120)
  ];
  let bbMax = [
    DataReader.readFloat(data, 124),
    DataReader.readFloat(data, 128),
    DataReader.readFloat(data, 132)
  ];

  let flags = DataReader.readInteger(data, 136);

  let numBones = DataReader.readInteger(data, 140);
  let boneIndex = DataReader.readInteger(data, 144);

  let numBoneControllers = DataReader.readInteger(data, 148);
  let boneControllerIndex = DataReader.readInteger(data, 152);

  let numHitBoxes = DataReader.readInteger(data, 156);
  let hitBoxIndex = DataReader.readInteger(data, 160);

  let numSeq = DataReader.readInteger(data, 164);
  let seqIndex = DataReader.readInteger(data, 168);

  let numSeqGroups = DataReader.readInteger(data, 172);
  let seqGroupIndex = DataReader.readInteger(data, 176);

  let numTextures = DataReader.readInteger(data, 180);
  let textureIndex = DataReader.readInteger(data, 184);
  let textureDataIndex = DataReader.readInteger(data, 188);

  let numSkinRef = DataReader.readInteger(data, 192);
  let numSkinFamilies = DataReader.readInteger(data, 196);
  let skinIndex = DataReader.readInteger(data, 200);

  let numBodyParts = DataReader.readInteger(data, 204);
  let bodyPartIndex = DataReader.readInteger(data, 208);

  let numAttachments = DataReader.readInteger(data, 212);
  let attachmentIndex = DataReader.readInteger(data, 216);

  const soundTable = DataReader.readInteger(data, 220);
  const soundIndex = DataReader.readInteger(data, 224);
  const soundGroups = DataReader.readInteger(data, 228);
  const soundGroupIndex = DataReader.readInteger(data, 232);

  const numTransitions = DataReader.readInteger(data, 236);
  const transitionIndex = DataReader.readInteger(data, 240);

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

let parseBones = function(offset, num) {
  let end = offset + num * 112;

  let n = 0;
  let bones = Array(num);
  for (let i = offset; i !== end; i += 112) {
    let name = DataReader.readBinaryString(data, i, 32);
    let parent = DataReader.readInteger(data, i + 32);
    let flags = DataReader.readInteger(data, i + 36);
    let boneController = [
      DataReader.readInteger(data, i + 40),
      DataReader.readInteger(data, i + 44),
      DataReader.readInteger(data, i + 48),
      DataReader.readInteger(data, i + 52),
      DataReader.readInteger(data, i + 56),
      DataReader.readInteger(data, i + 60)
    ];
    // Depth of field
    let value = [
      DataReader.readFloat(data, i + 64),
      DataReader.readFloat(data, i + 68),
      DataReader.readFloat(data, i + 72),
      DataReader.readFloat(data, i + 76),
      DataReader.readFloat(data, i + 80),
      DataReader.readFloat(data, i + 84)
    ];
    let scale = [
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

let parseBoneControllers = function(offset, num) {
  let index_end = offset + num * 24;
  let n = 0;
  let controllers = Array(num);
  for (let i = offset; i !== index_end; i += 24) {
    let bone = DataReader.readInteger(data, i);
    let type = DataReader.readInteger(data, i + 4);
    let start = DataReader.readFloat(data, i + 8);
    let end = DataReader.readFloat(data, i + 12);
    let rest = DataReader.readInteger(data, i + 16);
    let index = DataReader.readInteger(data, i + 20);

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

let parseSequences = function(offset, num, name) {
  let end = offset + num * 176;
  let n = 0;
  let sequences = Array(num);

  for (let i = offset; i !== end; i += 176) {
    let label = DataReader.readBinaryString(data, i, 32);

    let fps = DataReader.readFloat(data, i + 32);
    let flags = DataReader.readInteger(data, i + 36);

    let activity = DataReader.readInteger(data, i + 40);
    let actWeight = DataReader.readInteger(data, i + 44);

    let numEvents = DataReader.readInteger(data, i + 48);
    let eventIndex = DataReader.readInteger(data, i + 52);

    let events = Array(numEvents);
    // typedef struct mstudioevent_s
    // {
    // int     frame;
    // int    event;
    // int    type;
    // char    options[64];
    // } mstudioevent_t;
    let m = 0;
    for (let j = eventIndex; m < numEvents; j += 76) {
      let frame = DataReader.readInteger(data, j);
      let event = DataReader.readInteger(data, j + 4);
      let type = DataReader.readInteger(data, j + 8);
      let options = DataReader.readBinaryString(data, j + 12, 64);
      events[m++] = {
        frame: frame,
        event: event,
        type: type,
        options: options
      };
    }

    let numFrames = DataReader.readInteger(data, i + 56);

    let numPivotes = DataReader.readInteger(data, i + 60);
    let pivotIndex = DataReader.readInteger(data, i + 64);

    let motionType = DataReader.readInteger(data, i + 68);
    let motionBone = DataReader.readInteger(data, i + 72);
    let linearMovement = [
      DataReader.readFloat(data, i + 76),
      DataReader.readFloat(data, i + 80),
      DataReader.readFloat(data, i + 84)
    ];
    let autoMovePosIndex = DataReader.readInteger(data, i + 88);
    let autoMoveAngleIndex = DataReader.readInteger(data, i + 92);

    let bbMin = [
      DataReader.readFloat(data, i + 96),
      DataReader.readFloat(data, i + 100),
      DataReader.readFloat(data, i + 104)
    ];
    let bbMax = [
      DataReader.readFloat(data, i + 108),
      DataReader.readFloat(data, i + 112),
      DataReader.readFloat(data, i + 116)
    ];

    let numBlends = DataReader.readInteger(data, i + 120);
    let animIndex = DataReader.readInteger(data, i + 124);

    let blendType = [
      DataReader.readInteger(data, i + 128),
      DataReader.readInteger(data, i + 132)
    ];
    let blendStart = [
      DataReader.readFloat(data, i + 136),
      DataReader.readFloat(data, i + 140)
    ];
    let blendEnd = [
      DataReader.readFloat(data, i + 144),
      DataReader.readFloat(data, i + 148)
    ];
    let blendParent = DataReader.readInteger(data, i + 152);

    let seqGroup = DataReader.readInteger(data, i + 156);

    let entryNode = DataReader.readInteger(data, i + 160);
    let exitNode = DataReader.readInteger(data, i + 164);
    let nodeFlags = DataReader.readInteger(data, i + 168);

    let nextSeq = DataReader.readInteger(data, i + 172);

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

let parseSequenceGroups = function(offset, num) {
  let end = offset + num * 104;
  let n = 0;
  let groups = Array(num);

  for (let i = offset; i !== end; i += 104) {
    let label = DataReader.readBinaryString(data, i, 32);
    let name = DataReader.readBinaryString(data, i + 32, 64);
    let dummy = DataReader.readBinaryString(data, i + 96, 4);
    let _data = DataReader.readInteger(data, 100);

    groups[n++] = {
      label: label,
      name: name,
      dummy: dummy,
      data: _data
    };
  }

  return groups;
};

let uploadTextures = function(texture) {
  // Base 2 logarithm using base conversion formula
  const lg = n => {
    return Math.log(n) / Math.LN2;
  };

  // Convert size to power of 2 using formula:
  // f(x) = 2^(ceil(lg(x))). Maximum size is 512 according to specs
  let width = Math.min(Math.pow(2, Math.ceil(lg(texture.width))), 512);
  let height = Math.min(Math.pow(2, Math.ceil(lg(texture.height))), 512);

  let tex = new Uint8Array(width * height * 4);
  let row1 = Array(512);
  let row2 = Array(512);
  let col1 = Array(512);
  let col2 = Array(512);

  for (let i = 0; i < width; i++) {
    col1[i] = Math.floor(((i + 0.25) * texture.width) / width);
    col2[i] = Math.floor(((i + 0.75) * texture.width) / width);
  }

  for (let i = 0; i < height; i++) {
    row1[i] =
      Math.floor((i + 0.25) * (texture.height / height)) * texture.width;
    row2[i] =
      Math.floor((i + 0.75) * (texture.height / height)) * texture.width;
  }

  let pal = texture.index + texture.width * texture.height;

  let n = 0;
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      let pix1 = [
        data[pal + data[texture.index + row1[i] + col1[j]] * 3],
        data[pal + data[texture.index + row1[i] + col1[j]] * 3 + 1],
        data[pal + data[texture.index + row1[i] + col1[j]] * 3 + 2]
      ];
      let pix2 = [
        data[pal + data[texture.index + row1[i] + col2[j]] * 3],
        data[pal + data[texture.index + row1[i] + col2[j]] * 3 + 1],
        data[pal + data[texture.index + row1[i] + col2[j]] * 3 + 2]
      ];
      let pix3 = [
        data[pal + data[texture.index + row2[i] + col1[j]] * 3],
        data[pal + data[texture.index + row2[i] + col1[j]] * 3 + 1],
        data[pal + data[texture.index + row2[i] + col1[j]] * 3 + 2]
      ];
      let pix4 = [
        data[pal + data[texture.index + row2[i] + col2[j]] * 3],
        data[pal + data[texture.index + row2[i] + col2[j]] * 3 + 1],
        data[pal + data[texture.index + row2[i] + col2[j]] * 3 + 2]
      ];

      tex[n++] = (pix1[0] + pix2[0] + pix3[0] + pix4[0]) / 4;
      tex[n++] = (pix1[1] + pix2[1] + pix3[1] + pix4[1]) / 4;
      tex[n++] = (pix1[2] + pix2[2] + pix3[2] + pix4[2]) / 4;
      tex[n++] = 0xff;
    }
  }

  gl.bindTexture(gl.TEXTURE_2D, texture.id);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    tex
  );
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
};

let parseTextures = function(offset, num) {
  const end = offset + num * 80;
  let n = 0;
  const textures = Array(num);

  for (let i = offset; i !== end; i += 80) {
    const name = DataReader.readBinaryString(data, i, 64);
    const flags = DataReader.readInteger(data, i + 64);
    const width = DataReader.readInteger(data, i + 68);
    const height = DataReader.readInteger(data, i + 72);
    const index = DataReader.readInteger(data, i + 76);
    const id = gl.createTexture();

    const texture = {
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

let parseBodyParts = function(offset, num) {
  let end = offset + num * 76;
  let n = 0;
  let bodyParts = Array(num);

  for (let i = offset; i !== end; i += 76) {
    const name = DataReader.readBinaryString(data, i, 64);
    const numModels = DataReader.readInteger(data, i + 64);
    const base = DataReader.readInteger(data, i + 68);
    const modelIndex = DataReader.readInteger(data, i + 72);

    bodyParts[n++] = {
      name,
      numModels,
      base,
      modelIndex
    };
  }

  return bodyParts;
};

let parseModels = function(offset, num) {
  let end = offset + num * 112;
  let n = 0;
  let models = Array(num);

  let parseVec3s = function(offset, count) {
    let vecs = new Float32Array(count);
    const end = offset + 12 * count;
    let n = 0;
    for (let i = offset; i !== end; i += 12) {
      vecs[n++] = DataReader.readFloat(data, i);
      vecs[n++] = DataReader.readFloat(data, i + 4);
      vecs[n++] = DataReader.readFloat(data, i + 8);
    }
    return vecs;
  };

  let parseMesh = function(offset, count) {
    const end = offset + 20 * count;
    let mesh = Array(count);
    let n = 0;

    for (let i = offset; i !== end; i += 20) {
      let numTris = DataReader.readInteger(data, i);
      let triIndex = DataReader.readInteger(data, i + 4);
      let skinRef = DataReader.readInteger(data, i + 8);
      let numNorms = DataReader.readInteger(data, i + 12);
      let normIndex = DataReader.readInteger(data, i + 16);

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

  for (let i = offset; i !== end; i += 112) {
    let name = DataReader.readBinaryString(data, i, 64);
    let type = DataReader.readInteger(data, i + 64);
    let bRadius = DataReader.readFloat(data, i + 68);
    let numMesh = DataReader.readInteger(data, i + 72);
    let meshIndex = DataReader.readInteger(data, i + 76);
    let numVerts = DataReader.readInteger(data, i + 80);
    let vertInfoIndex = DataReader.readInteger(data, i + 84);
    let vertIndex = DataReader.readInteger(data, i + 88);
    let numNorms = DataReader.readInteger(data, i + 92);
    let normInfoIndex = DataReader.readInteger(data, i + 96);
    let normIndex = DataReader.readInteger(data, i + 100);

    let numGroups = DataReader.readInteger(data, i + 104);
    let groupIndex = DataReader.readInteger(data, i + 108);

    let vertices = parseVec3s(vertIndex, 3 * numVerts);
    let norms = parseVec3s(normIndex, 3 * numNorms);

    let transformIndices = data.subarray(
      vertInfoIndex,
      vertInfoIndex + numVerts
    );
    let mesh = parseMesh(meshIndex, numMesh);

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
};

export const ModelParser = {
  parse: function(context, input) {
    data = input;
    gl = context;

    let header = parseHeader();
    let bones = parseBones(header.boneIndex, header.numBones);
    let boneControllers = parseBoneControllers(
      header.boneControllerIndex,
      header.numBoneControllers
    );
    let sequences = parseSequences(
      header.seqIndex,
      header.numSeq,
      header.name.substr(2, header.name.lastIndexOf('.') - 2)
    );
    let seqGroups = parseSequenceGroups(
      header.seqGroupIndex,
      header.numSeqGroups
    );
    let textures = parseTextures(header.textureIndex, header.numTextures);
    let bodyParts = parseBodyParts(header.bodyPartIndex, header.numBodyParts);
    let models = Array(header.numBodyParts);

    for (let i = 0; i < header.numBodyParts; ++i) {
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
