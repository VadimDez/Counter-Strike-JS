/**
 * Created by Vadym Yatsyuk on 25.02.18
 */

/**
 This file contains all the code needed to parse a .bsp file (Version 30)
 into a JSON datastructure.
 Unofficial specification for version 30 can be found here:
 http://hlbsp.sourceforge.net/index.php?content=bspdef
 Additional information not exclusive to 30:
 https://developer.valvesoftware.com/wiki/Source_BSP_File_Format
 A few changes has been made to the JSON layout for performance reasons
 **/

import { DataReader } from './util/DataReader';

/**
 Provides easy-to-use functions for reading binary data
 **/

var constants = {
  BSP_VERSION: 30,

  PLANE_X: 0,
  PLANE_Y: 1,
  PLANE_Z: 2,
  PLANE_ANY_X: 3,
  PLANE_ANY_Y: 4,
  PLANE_ANY_Z: 5,

  CONTENTS_SOLID: -2
};

//Raw data array of the .blp file format version 30
var data: any;

var parseHeader = function () {
  var magic = DataReader.readInteger(data, 0);
  if (magic != constants.BSP_VERSION) {
    console.log("Invalid magic number. Expected: 30, but was: " + magic);
    return;
  }
  return parseLumps();
};

var parseLumps = function () {
  //Read the 15 predefined lumps
  return {
    entities: [DataReader.readInteger(data, 4), DataReader.readInteger(data, 8)],
    planes: [DataReader.readInteger(data, 12), DataReader.readInteger(data, 16)],
    textures: [DataReader.readInteger(data, 20), DataReader.readInteger(data, 24)],
    vertices: [DataReader.readInteger(data, 28), DataReader.readInteger(data, 32)],
    visibility: [DataReader.readInteger(data, 36), DataReader.readInteger(data, 40)],
    nodes: [DataReader.readInteger(data, 44), DataReader.readInteger(data, 48)],
    texinfo: [DataReader.readInteger(data, 52), DataReader.readInteger(data, 56)],
    faces: [DataReader.readInteger(data, 60), DataReader.readInteger(data, 64)],
    lighting: [DataReader.readInteger(data, 68), DataReader.readInteger(data, 72)],
    clipnodes: [DataReader.readInteger(data, 76), DataReader.readInteger(data, 80)],
    leaves: [DataReader.readInteger(data, 84), DataReader.readInteger(data, 88)],
    marksurfaces: [DataReader.readInteger(data, 92), DataReader.readInteger(data, 96)],
    edges: [DataReader.readInteger(data, 100), DataReader.readInteger(data, 104)],
    surfedges: [DataReader.readInteger(data, 108), DataReader.readInteger(data, 112)],
    models: [DataReader.readInteger(data, 116), DataReader.readInteger(data, 120)]
  }
};

var uintToString = function(uintArray: any) {
  var encodedString = String.fromCharCode.apply(null, uintArray),
    decodedString = decodeURIComponent(escape(encodedString));
  return decodedString;
};

var parseEntity = function (entityHeader: any) {
  //Skip past first "
  var offset = entityHeader[0] + 1;
  //Remove last }
  var length = entityHeader[1] - 5;

  //Create subarray containing only the data of this lump
  var entities = data.subarray(offset, offset + length);
  //Convert to string
  var sEntities = uintToString(entities);
  //Split into an array of entities
  var entitiesArray = sEntities.split("}\n{");

  //Helper formatters
  var identity = function(x: any) { return x; };
  var parseList = function(formatter: any) {
    return function(x) {
      var list = [];
      for(var o in x.split(" ")) {
        list.push(formatter(o));
      }
      return list;
    };
  };
  //A map from key to value formatters.
  var formatters = {
    MaxRange: parseInt,
    classname: identity,
    light: parseInt,
    message: identity,
    skyname: identity,
    sounds: parseInt,
    wad: function(x) { return x.split(";"); },
    model: function(x) {
      //Most entities have a value of the form *N where N is an integer
      //But some entities have a string value instead,
      //(i.e path to models in case of hostages)
      if(x[0] === "*")
        return parseInt(x.substr(1));
      return identity;
    },
    renderamt: parseInt,
    rendercolor: parseList(parseInt),
    rendermode: parseInt,
    skin: parseInt,
    angles: parseList(parseInt),
    delay: parseInt,
    distance: parseInt,
    dmg: parseInt,
    health: parseInt,
    lip: parseInt,
    locked_sentence: parseInt,
    locked_sound: parseInt,
    movesnd: parseInt,
    origin: parseList(parseInt),
    renderfx: parseInt,
    speed: parseInt,
    stopsnd: parseInt,
    unlocked_sentence: parseInt,
    unlocked_sound: parseInt,
    wait: parseInt,
    _light: parseList(parseInt),
    pitch: parseInt,
    angle: parseInt,
    spawnflags: parseInt,
    target: identity,
    deceleration: parseInt,
    targetname: identity,
    explodemagnitude: parseInt,
    explosion: parseInt,
    material: parseInt,
    spawnobject: parseInt,
    texture: identity,
    acceleration: parseInt,
    killtarget: identity,
    triggerstate: parseInt,
    _fade: parseFloat
  };

  var entityLump = Array(entitiesArray.length);
  for(var i = 0; i < entitiesArray.length; ++i) {
    //Get key
    var sKeyVal = entitiesArray[i].split("\"");
    var map = {};
    //Create a mapping from key => value
    for(var j = 1; j < sKeyVal.length; j += 4) {
      var key = sKeyVal[j];
      var value = sKeyVal[j+2];
      var formatter = formatters[key];
      if(!formatter) console.log("Unknown entity name: " + key);
      else map[key] = formatter(value);
    }
    entityLump[i] = map;
  }
  return entityLump;
}

var parsePlanes = function(planeHeader) {
  var offset = planeHeader[0];
  var length = planeHeader[1];

  var planesLump = Array(length/20);
  var normals = new Float32Array((length / 20) * 3);

  var end = offset + length;
  var n = 0;
  var k = 0;
  for(var i = offset; i < end; i += 20) {
    //Read normal
    var xNorm = DataReader.readFloat(data, i);
    var yNorm = DataReader.readFloat(data, i+4);
    var zNorm = DataReader.readFloat(data, i+8);

    //Store normals in seperate array for performance reasons
    normals[n++] = xNorm;
    normals[n++] = yNorm;
    normals[n++] = zNorm;

    //Read distance and type
    var dist = DataReader.readFloat(data, i+12);
    var type = DataReader.readInteger(data, i+16);

    planesLump[k++] = {
      distance: dist,
      type: type
    };
  }
  return {
    normals: normals,
    planes: planesLump
  };
}

var parseTextures = function(textureHeader) {
  var offset = textureHeader[0];
  var length = textureHeader[1];

  //Read number of upcoming structures
  var count = DataReader.readInteger(data, offset);

  //Read offsets
  var offsets = Array(n);
  var endOfOffsets = (offset + 4) + (count * 4);
  var n = 0;
  for(var i = offset+4; i < endOfOffsets; i += 4) {
    offsets[n++] = DataReader.readInteger(data, i);
  }

  n = 0;
  var textureLumps = Array(count);
  var numTextures = count*40;
  //Read actual structures with texture info
  for(let i = 0; i < numTextures; i += 40) {
    var addr = offset + offsets[n];

    var name = DataReader.readBinaryString(data, addr, 16);
    var width = DataReader.readInteger(data, addr + 16);
    var height = DataReader.readInteger(data, addr + 20);

    var offset1 = DataReader.readInteger(data, addr + 24);
    var offset2 = DataReader.readInteger(data, addr + 28);
    var offset3 = DataReader.readInteger(data, addr + 32);
    var offset4 = DataReader.readInteger(data, addr + 36);

    textureLumps[n++] = {
      name: name,
      width: width,
      height: height,
      offsets: [offset1, offset2, offset3, offset4]
    };
  }
  return textureLumps;
}

var parseVertices = function(vertexHeader) {
  var offset = vertexHeader[0];
  var length = vertexHeader[1];

  var end = offset + length;
  var verticesLump = Array(length/4);

  var n = 0;
  for(var i = offset; i < end; i += 12) {
    verticesLump[n++] = DataReader.readFloat(data, i);
    verticesLump[n++] = DataReader.readFloat(data, i+4);
    verticesLump[n++] = DataReader.readFloat(data, i+8);
  }
  return verticesLump;
}

var getVisibilityList = function(offset, nLeafs, nVisLeaves) {
  var visibilityList = Array(nLeafs - 1);

  var iVis = 0;
  //Loop through each leaf and perform run-length decompression
  for(var i = 0; iVis < nVisLeaves; ++i) {
    var byt = data[offset+i];
    //If the byte is 0 it means that the next 8 leaves are not shown
    if(byt === 0) {
      ++i;
      iVis += 8 * data[offset+i];
    }
    else {
      //Loop through each bit in the byte
      for(var bit = 1; bit < 256; ++iVis, bit <<= 1) {
        //If the bit is 1 and we're still in a valid leaf
        if(((byt & bit) > 0) && (iVis < nLeafs)) {
          visibilityList[iVis] = true;
        }
      }
    }
  }

  return visibilityList;
}

var parseVisibility = function(visibilityHeader, nodes, leaves) {
  var offset = visibilityHeader[0];
  var length = visibilityHeader[1];
  var end = offset + length;

  //Count the number of visibility leaves
  //A visivility leaf is a non solid leaf that has a valid offset
  //into the visibility lump
  var count = leaves.filter(function(leaf) {
    //Not a solid and has visibility
    return leaf.nContents != constants.CONTENTS_SOLID && leaf.nVisOffset >= 0;
  }).length - 1;

  var visibility = Array(count);
  for(var i = 0; i < count; ++i) {
    if(leaves[i+1].nVisOffset >= 0) {
      visibility[i] = getVisibilityList(offset + leaves[i+1].nVisOffset, leaves.length, count);
    }
  }
  return visibility;
}

var parseNodes = function(nodeHeader) {
  var offset = nodeHeader[0];
  var length = nodeHeader[1];
  var end = offset + length;

  var nodesLump = Array(length/24);
  var n = 0;
  for(var i = offset; i < end; i += 24) {
    var iPlane = DataReader.readInteger(data, i);
    var iChildren = [
      DataReader.readSignedShort(data, i + 4),
      DataReader.readSignedShort(data, i + 6)
    ];
    var nMins = [
      DataReader.readSignedShort(data, i + 8),
      DataReader.readSignedShort(data, i + 10),
      DataReader.readSignedShort(data, i + 12)
    ];
    var nMaxs = [
      DataReader.readSignedShort(data, i + 14),
      DataReader.readSignedShort(data, i + 16),
      DataReader.readSignedShort(data, i + 18)
    ];
    var firstFace = DataReader.readShort(data, i + 20);
    var nFaces = DataReader.readShort(data, i + 22);

    nodesLump[n++] = {
      iPlane: iPlane,
      iChildren: iChildren,
      nMins: nMins,
      nMaxs: nMaxs,
      firstFace: firstFace,
      nFaces: nFaces
    };
  }
  return nodesLump;

}

var parseTextureInfo = function(texinfoHeader) {
  var offset = texinfoHeader[0];
  var length = texinfoHeader[1];
  var end = offset + length;

  var textureInfoLump = Array(length / 40);
  var n = 0;
  for(var i = offset; i < end; i += 40) {
    var vS = [
      DataReader.readFloat(data, i),
      DataReader.readFloat(data, i + 4),
      DataReader.readFloat(data, i + 8)
    ];
    var fSShift = DataReader.readFloat(data, i + 12);
    var vT = [
      DataReader.readFloat(data, i + 16),
      DataReader.readFloat(data, i + 20),
      DataReader.readFloat(data, i + 24)
    ];
    var fTShift = DataReader.readFloat(data, i + 28);
    var iMiptex = DataReader.readInteger(data, i + 32);
    var nFlags = DataReader.readInteger(data, i + 36);

    textureInfoLump[n++] = {
      vS: vS,
      fSShift: fSShift,
      vT: vT,
      fTShift: fTShift,
      iMiptex: iMiptex,
      nFlags: nFlags
    };
  }
  return textureInfoLump;
}

var parseFaces = function(faceHeader) {
  var offset = faceHeader[0];
  var length = faceHeader[1];
  var end = offset + length;

  var faceLump = Array(length / 20);
  var n = 0;
  for(var i = offset; i < end; i += 20) {
    var iPlane = DataReader.readShort(data, i);
    var nPlanSide = DataReader.readShort(data, i + 2);
    var iFirstEdge = DataReader.readInteger(data, i + 4);
    var nEdges = DataReader.readShort(data, i + 8);
    var iTextureInfo = DataReader.readShort(data, i + 10);
    var nStyles = [
      data[i + 12],
      data[i + 13],
      data[i + 14],
      data[i + 15]
    ];
    var nLightmapoffset = DataReader.readInteger(data, i + 16);

    faceLump[n++] = {
      iPlane: iPlane,
      nPlanSide: nPlanSide,
      iFirstEdge: iFirstEdge,
      nEdges: nEdges,
      iTextureInfo: iTextureInfo,
      nStyles: nStyles,
      nLightmapoffset: nLightmapoffset
    };
  }
  return faceLump;
}

var parseLighting = function(lightingHeader, faces, surfedges, edges, vertices) {
  var offset = lightingHeader[0];
  var length = lightingHeader[1];
  var end = offset + length;

  var buffer = [];

  //Loop through all faces
  for(var i = 0; i < faces.length; ++i) {
    var face = faces[i];
    //Find index into the color array
    var colorOffset = face.nLightmapoffset;

    //Get the index of the vertex that has this color
    for(var j = 0; j < face.nEdges; ++j) {
      var iEdge = surfedges[face.iFirstEdge + j];
      var index;
      if(iEdge > 0) {
        var edge = edges[iEdge];
        index = edge[0];
      }
      else {
        var edge = edges[-iEdge];
        index = edge[1];
      }

      //Okay this is a bit weird
      //We're not allowed to override a color we've already defined
      //(Since another vertex is using it)
      //So we modify the bsp datastructure to allow for a single
      //call to OpenGL to draw the map
      //Thus we need to make sure the color and vertex buffer are
      //synched up such that:
      //At colorBuffer[3*i] we have the color for the vertex located
      //at position 3*i
      if(buffer[3*index] !== undefined) {
        //Get the number of vertices
        var vertexOffset = vertices.length/3;

        //Add the new colour
        buffer[3*vertexOffset] = data[offset+colorOffset]/255.0;
        buffer[3*vertexOffset+1] = data[offset+colorOffset+1]/255.0;
        buffer[3*vertexOffset+2] = data[offset+colorOffset+2]/255.0;

        //Copy the vertex to the back of the buffer
        vertices[3*vertexOffset] = vertices[3*index];
        vertices[3*vertexOffset+1] = vertices[3*index+1];
        vertices[3*vertexOffset+2] = vertices[3*index+2];

        //Write the new index into the edges lump
        if(iEdge > 0) {
          edges[iEdge][0] = vertexOffset;
        }
        else {
          edges[-iEdge][1] = vertexOffset;
        }
      }
      //We're defining a new colour
      else {
        //Store r, g, b and a
        buffer[3*index] = data[offset+colorOffset]/255.0;
        buffer[3*index+1] = data[offset+colorOffset+1]/255.0;
        buffer[3*index+2] = data[offset+colorOffset+2]/255.0;
      }
    }
  }

  return new Float32Array(buffer);
}

var parseClipNodes = function(clipNodeHeader) {
  var offset = clipNodeHeader[0];
  var length = clipNodeHeader[1];
  var end = offset + length;

  var clipNodeLump = Array(length / 8);
  var n = 0;
  for(var i = offset; i < end; i += 8) {
    var iPlane = DataReader.readInteger(data, i);
    var iChildren = [
      DataReader.readSignedShort(data, i + 4),
      DataReader.readSignedShort(data, i + 6)
    ];

    clipNodeLump[n++] = {
      iPlane: iPlane,
      iChildren: iChildren
    };
  }
  return clipNodeLump;
}

var parseLeaves = function(leafHeader) {
  var offset = leafHeader[0];
  var length = leafHeader[1];
  var end = offset + length;

  var leafLump = Array(length / 28);
  var n = 0;
  for(var i = offset; i < end; i += 28) {
    var nContents = DataReader.readInteger(data, i);
    var nVisOffset = DataReader.readInteger(data, i + 4);
    var nMins = [
      DataReader.readSignedShort(data, i + 8),
      DataReader.readSignedShort(data, i + 10),
      DataReader.readSignedShort(data, i + 12)
    ];
    var nMaxs = [
      DataReader.readSignedShort(data, i + 14),
      DataReader.readSignedShort(data, i + 16),
      DataReader.readSignedShort(data, i + 18)
    ];
    var iFirstMarkSurface = DataReader.readShort(data, i + 20);
    var nMarkSurfaces = DataReader.readShort(data, i + 22);
    var nAmbientLevels = [
      DataReader.readShort(data, i + 24),
      DataReader.readShort(data, i + 25),
      DataReader.readShort(data, i + 26),
      DataReader.readShort(data, i + 27)
    ];

    leafLump[n++] = {
      nContents: nContents,
      nVisOffset: nVisOffset,
      nMins: nMins,
      nMaxs: nMaxs,
      iFirstMarkSurface: iFirstMarkSurface,
      nMarkSurfaces: nMarkSurfaces,
      nAmbientLevels: nAmbientLevels
    };
  }
  return leafLump;
}

var parseMarkSurfaces = function(markSurfaceHeader) {
  var offset = markSurfaceHeader[0];
  var length = markSurfaceHeader[1];
  var end = offset + length;

  var markSurfacesLump = Array(length / 2);
  var n = 0;
  for(var i = offset; i < end; i += 2) {
    markSurfacesLump[n++] = DataReader.readShort(data, i);
  }
  return markSurfacesLump;
}

var parseEdges = function(edgeHeader) {
  var offset = edgeHeader[0];
  var length = edgeHeader[1];
  var end = offset + length;

  var edgesLump = Array(length / 4);
  var n = 0;
  for(var i = offset; i < end; i += 4) {
    edgesLump[n++] = [
      DataReader.readShort(data, i),
      DataReader.readShort(data, i + 2)
    ];
  }

  return edgesLump;
}

var parseSurfedges = function(surfedgeHeader) {
  var offset = surfedgeHeader[0];
  var length = surfedgeHeader[1];
  var end = offset + length;

  var surfedgeLump = Array(length / 4);
  var n = 0;
  for(var i = offset; i < end; i += 4) {
    surfedgeLump[n++] = DataReader.readInteger(data, i);
  }

  return surfedgeLump;
}

var parseModels = function(modelsHeader) {
  var offset = modelsHeader[0];
  var length = modelsHeader[1];
  var end = offset + length;

  var modelsLump = Array(length / 64);
  var n = 0;
  for(var i = offset; i < end; i += 64) {
    var nMins = [
      DataReader.readFloat(data, i),
      DataReader.readFloat(data, i + 4),
      DataReader.readFloat(data, i + 8)
    ];
    var nMaxs = [
      DataReader.readFloat(data, i + 12),
      DataReader.readFloat(data, i + 16),
      DataReader.readFloat(data, i + 20)
    ];
    var vOrigin = [
      DataReader.readFloat(data, i + 24),
      DataReader.readFloat(data, i + 18),
      DataReader.readFloat(data, i + 32),
    ];
    var iHeadNodes = [
      DataReader.readInteger(data, i + 36),
      DataReader.readInteger(data, i + 40),
      DataReader.readInteger(data, i + 44),
      DataReader.readInteger(data, i + 48),
    ];
    var nVisLeafs = DataReader.readInteger(data, i + 52);
    var iFirstFace = DataReader.readInteger(data, i + 56);
    var nFaces = DataReader.readInteger(data, i + 60);

    modelsLump[n++] = {
      nMins: nMins,
      nMaxs: nMaxs,
      vOrigin: vOrigin,
      iHeadNodes: iHeadNodes,
      nVisLeafs: nVisLeafs,
      iFirstFace: iFirstFace,
      nFaces: nFaces
    };
  }
  return modelsLump;
}

export const MapParser = {
  constants: constants,

  /**
   Uint8array -> JSON
   **/
  parse: function (input) {
    data = input;
    var header = parseHeader();

    var entities = parseEntity(header.entities);
    var planes = parsePlanes(header.planes);
    var textures = parseTextures(header.textures);
    var vertices = parseVertices(header.vertices);
    var nodes = parseNodes(header.nodes);
    var textureInfo = parseTextureInfo(header.texinfo);
    var faces = parseFaces(header.faces);
    var clipNodes = parseClipNodes(header.clipnodes);
    var leaves = parseLeaves(header.leaves);
    var visibility = parseVisibility(header.visibility, nodes, leaves);
    var markSurfaces = parseMarkSurfaces(header.marksurfaces);
    var edges = parseEdges(header.edges);
    var surfedges = parseSurfedges(header.surfedges);
    var lighting = parseLighting(header.lighting, faces, surfedges, edges, vertices);
    var models = parseModels(header.models);

    return {
      entities: entities,
      planes: planes,
      textures: textures,
      //Ugly to first new this up now, but parseLighting needs the
      //raw JS array so we cannot do this before now.
      vertices: new Float32Array(vertices),
      nodes: nodes,
      textureInfo: textureInfo,
      faces: faces,
      lighting: lighting,
      clipNodes: clipNodes,
      leaves: leaves,
      markSurfaces: markSurfaces,
      edges: edges,
      surfedges: surfedges,
      models: models,
      visibility: visibility
    };
  }
};