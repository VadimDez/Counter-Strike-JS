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

import { DataReader } from '../util/DataReader';

/**
 Provides easy-to-use functions for reading binary data
 **/

const constants = {
  BSP_VERSION: 30,

  PLANE_X: 0,
  PLANE_Y: 1,
  PLANE_Z: 2,
  PLANE_ANY_X: 3,
  PLANE_ANY_Y: 4,
  PLANE_ANY_Z: 5,

  CONTENTS_SOLID: -2
};

let uintToString = function (uintArray: any) {
  let encodedString = String.fromCharCode.apply(null, uintArray);
  return decodeURIComponent(escape(encodedString));
};

export class MapParser {
  static constants = constants;

  /**
   Uint8array -> JSON
   input - Raw data array of the .bsp file format version 30
   **/
  static parse(input: any) {
    let header = MapParser.parseHeader(input);

    let entities = MapParser.parseEntity(header.entities, input);
    let planes = MapParser.parsePlanes(header.planes, input);
    let textures = MapParser.parseTextures(header.textures, input);
    let vertices = MapParser.parseVertices(header.vertices, input);
    let nodes = MapParser.parseNodes(header.nodes, input);
    let textureInfo = MapParser.parseTextureInfo(header.texinfo, input);
    let faces = MapParser.parseFaces(header.faces, input);
    let clipNodes = MapParser.parseClipNodes(header.clipnodes, input);
    let leaves = MapParser.parseLeaves(header.leaves, input);
    let visibility = MapParser.parseVisibility(
      header.visibility,
      nodes,
      leaves,
      input
    );
    let markSurfaces = MapParser.parseMarkSurfaces(header.marksurfaces, input);
    let edges = MapParser.parseEdges(header.edges, input);
    let surfedges = MapParser.parseSurfedges(header.surfedges, input);
    let lighting = MapParser.parseLighting(
      header.lighting,
      faces,
      surfedges,
      edges,
      vertices,
      input
    );
    const models = MapParser.parseModels(header.models, input);

    return {
      entities: entities,
      planes: planes,
      textures: textures,
      // Ugly to first new this up now, but parseLighting needs the
      // raw JS array so we cannot do this before now.
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

  static parseHeader(data) {
    const magic = DataReader.readInteger(data, 0);
    if (magic !== constants.BSP_VERSION) {
      console.log('Invalid magic number. Expected: 30, but was: ' + magic);
      return;
    }
    return MapParser.parseLumps(data);
  }

  static parseEntity(entityHeader: any, data: any) {
    // Skip past first "
    let offset = entityHeader[0] + 1;
    // Remove last }
    let length = entityHeader[1] - 5;

    // Create subarray containing only the data of this lump
    let entities = data.subarray(offset, offset + length);
    // Convert to string
    const sEntities = uintToString(entities);
    // Split into an array of entities
    let entitiesArray = sEntities.split('}\n{');

    // Helper formatters
    let identity = function (x: any) {
      return x;
    };
    let parseList = function (formatter: any) {
      return str =>
        str.split(' ').map(v => {
          return formatter(v);
        });
    };

    const parseNumber = str => parseInt(str, 10);

    // A map from key to value formatters.
    let formatters = {
      MaxRange: parseInt,
      classname: identity,
      light: parseInt,
      message: identity,
      skyname: identity,
      sounds: parseInt,
      wad: wadStr => wadStr.split(';'),
      model: function (x) {
        // Most entities have a value of the form *N where N is an integer
        // But some entities have a string value instead,
        // (i.e path to models in case of hostages)
        if (x[0] === '*') {
          return parseInt(x.substr(1));
        }
        return identity;
      },
      renderamt: parseInt,
      rendercolor: parseList(parseInt),
      rendermode: parseInt,
      skin: parseInt,
      angles: parseList(parseNumber), // "Z Y X"
      delay: parseInt,
      distance: parseInt,
      dmg: parseInt,
      health: parseInt,
      lip: parseInt,
      locked_sentence: parseInt,
      locked_sound: parseInt,
      movesnd: parseInt,
      origin: parseList(parseNumber),
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

    let entityLump = Array(entitiesArray.length);
    for (let i = 0; i < entitiesArray.length; ++i) {
      // Get key
      let sKeyVal = entitiesArray[i].split('"');
      let map = {};
      // Create a mapping from key => value
      for (let j = 1; j < sKeyVal.length; j += 4) {
        let key = sKeyVal[j];
        let value = sKeyVal[j + 2];
        let formatter = formatters[key];
        if (!formatter) {
          console.log('Unknown entity name: ' + key);
        } else {
          map[key] = formatter(value);
        }
      }
      entityLump[i] = map;
    }
    return entityLump;
  }

  static parseModels(modelsHeader, data) {
    let offset = modelsHeader[0];
    let length = modelsHeader[1];
    let end = offset + length;

    let modelsLump = Array(length / 64);
    let n = 0;
    for (let i = offset; i < end; i += 64) {
      let nMins = [
        DataReader.readFloat(data, i),
        DataReader.readFloat(data, i + 4),
        DataReader.readFloat(data, i + 8)
      ];
      let nMaxs = [
        DataReader.readFloat(data, i + 12),
        DataReader.readFloat(data, i + 16),
        DataReader.readFloat(data, i + 20)
      ];
      let vOrigin = [
        DataReader.readFloat(data, i + 24),
        DataReader.readFloat(data, i + 18),
        DataReader.readFloat(data, i + 32)
      ];
      let iHeadNodes = [
        DataReader.readInteger(data, i + 36),
        DataReader.readInteger(data, i + 40),
        DataReader.readInteger(data, i + 44),
        DataReader.readInteger(data, i + 48)
      ];
      let nVisLeafs = DataReader.readInteger(data, i + 52);
      let iFirstFace = DataReader.readInteger(data, i + 56);
      let nFaces = DataReader.readInteger(data, i + 60);

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

  static parseLumps(data) {
    // Read the 15 predefined lumps
    return {
      entities: [
        DataReader.readInteger(data, 4),
        DataReader.readInteger(data, 8)
      ],
      planes: [
        DataReader.readInteger(data, 12),
        DataReader.readInteger(data, 16)
      ],
      textures: [
        DataReader.readInteger(data, 20),
        DataReader.readInteger(data, 24)
      ],
      vertices: [
        DataReader.readInteger(data, 28),
        DataReader.readInteger(data, 32)
      ],
      visibility: [
        DataReader.readInteger(data, 36),
        DataReader.readInteger(data, 40)
      ],
      nodes: [
        DataReader.readInteger(data, 44),
        DataReader.readInteger(data, 48)
      ],
      texinfo: [
        DataReader.readInteger(data, 52),
        DataReader.readInteger(data, 56)
      ],
      faces: [
        DataReader.readInteger(data, 60),
        DataReader.readInteger(data, 64)
      ],
      lighting: [
        DataReader.readInteger(data, 68),
        DataReader.readInteger(data, 72)
      ],
      clipnodes: [
        DataReader.readInteger(data, 76),
        DataReader.readInteger(data, 80)
      ],
      leaves: [
        DataReader.readInteger(data, 84),
        DataReader.readInteger(data, 88)
      ],
      marksurfaces: [
        DataReader.readInteger(data, 92),
        DataReader.readInteger(data, 96)
      ],
      edges: [
        DataReader.readInteger(data, 100),
        DataReader.readInteger(data, 104)
      ],
      surfedges: [
        DataReader.readInteger(data, 108),
        DataReader.readInteger(data, 112)
      ],
      models: [
        DataReader.readInteger(data, 116),
        DataReader.readInteger(data, 120)
      ]
    };
  }

  static parsePlanes(planeHeader, data) {
    let offset = planeHeader[0];
    let length = planeHeader[1];

    let planesLump = Array(length / 20);
    let normals = new Float32Array((length / 20) * 3);

    let end = offset + length;
    let n = 0;
    let k = 0;
    for (let i = offset; i < end; i += 20) {
      // Read normal
      let xNorm = DataReader.readFloat(data, i);
      let yNorm = DataReader.readFloat(data, i + 4);
      let zNorm = DataReader.readFloat(data, i + 8);

      // Store normals in seperate array for performance reasons
      normals[n++] = xNorm;
      normals[n++] = yNorm;
      normals[n++] = zNorm;

      // Read distance and type
      let dist = DataReader.readFloat(data, i + 12);
      let type = DataReader.readInteger(data, i + 16);

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

  static parseTextures(textureHeader, data) {
    let offset = textureHeader[0];
    let length = textureHeader[1];

    // Read number of upcoming structures
    let count = DataReader.readInteger(data, offset);

    // Read offsets
    let n = 0;
    let offsets = Array(n);
    let endOfOffsets = offset + 4 + count * 4;
    for (let i = offset + 4; i < endOfOffsets; i += 4) {
      offsets[n++] = DataReader.readInteger(data, i);
    }

    n = 0;
    let textureLumps = Array(count);
    let numTextures = count * 40;
    // Read actual structures with texture info
    for (let i = 0; i < numTextures; i += 40) {
      let addr = offset + offsets[n];

      let name = DataReader.readBinaryString(data, addr, 16);
      let width = DataReader.readInteger(data, addr + 16);
      let height = DataReader.readInteger(data, addr + 20);

      let offset1 = DataReader.readInteger(data, addr + 24);
      let offset2 = DataReader.readInteger(data, addr + 28);
      let offset3 = DataReader.readInteger(data, addr + 32);
      let offset4 = DataReader.readInteger(data, addr + 36);

      textureLumps[n++] = {
        name: name,
        width: width,
        height: height,
        offsets: [offset1, offset2, offset3, offset4],
        data: new Uint8Array([0, 255, 0, 255])
      };
    }
    return textureLumps;
  }

  static parseVertices(vertexHeader, data) {
    let offset = vertexHeader[0];
    let length = vertexHeader[1];

    let end = offset + length;
    let verticesLump = Array(length / 4);

    let n = 0;
    for (let i = offset; i < end; i += 12) {
      verticesLump[n++] = DataReader.readFloat(data, i);
      verticesLump[n++] = DataReader.readFloat(data, i + 4);
      verticesLump[n++] = DataReader.readFloat(data, i + 8);
    }
    return verticesLump;
  }

  static getVisibilityList(offset, nLeafs, nVisLeaves, data) {
    let visibilityList = Array(nLeafs - 1);

    let iVis = 0;
    // Loop through each leaf and perform run-length decompression
    for (let i = 0; iVis < nVisLeaves; ++i) {
      let byt = data[offset + i];
      // If the byte is 0 it means that the next 8 leaves are not shown
      if (byt === 0) {
        ++i;
        iVis += 8 * data[offset + i];
      } else {
        // Loop through each bit in the byte
        for (let bit = 1; bit < 256; ++iVis, bit <<= 1) {
          // If the bit is 1 and we're still in a valid leaf
          if ((byt & bit) > 0 && iVis < nLeafs) {
            visibilityList[iVis] = true;
          }
        }
      }
    }

    return visibilityList;
  }

  static parseVisibility(visibilityHeader, nodes, leaves, data) {
    let offset = visibilityHeader[0];
    let length = visibilityHeader[1];
    let end = offset + length;

    // Count the number of visibility leaves
    // A visivility leaf is a non solid leaf that has a valid offset
    // into the visibility lump
    let count =
      leaves.filter(function (leaf) {
        // Not a solid and has visibility
        return (
          leaf.nContents !== constants.CONTENTS_SOLID && leaf.nVisOffset >= 0
        );
      }).length - 1;

    let visibility = Array(count);
    for (let i = 0; i < count; ++i) {
      if (leaves[i + 1].nVisOffset >= 0) {
        visibility[i] = MapParser.getVisibilityList(
          offset + leaves[i + 1].nVisOffset,
          leaves.length,
          count,
          data
        );
      }
    }
    return visibility;
  }

  static parseNodes(nodeHeader, data) {
    let offset = nodeHeader[0];
    let length = nodeHeader[1];
    let end = offset + length;

    let nodesLump = Array(length / 24);
    let n = 0;
    for (let i = offset; i < end; i += 24) {
      let iPlane = DataReader.readInteger(data, i);
      let iChildren = [
        DataReader.readSignedShort(data, i + 4),
        DataReader.readSignedShort(data, i + 6)
      ];
      let nMins = [
        DataReader.readSignedShort(data, i + 8),
        DataReader.readSignedShort(data, i + 10),
        DataReader.readSignedShort(data, i + 12)
      ];
      let nMaxs = [
        DataReader.readSignedShort(data, i + 14),
        DataReader.readSignedShort(data, i + 16),
        DataReader.readSignedShort(data, i + 18)
      ];
      let firstFace = DataReader.readShort(data, i + 20);
      let nFaces = DataReader.readShort(data, i + 22);

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

  static parseTextureInfo(texinfoHeader, data) {
    let offset = texinfoHeader[0];
    let length = texinfoHeader[1];
    let end = offset + length;

    let textureInfoLump = Array(length / 40);
    let n = 0;
    for (let i = offset; i < end; i += 40) {
      let vS = [
        DataReader.readFloat(data, i),
        DataReader.readFloat(data, i + 4),
        DataReader.readFloat(data, i + 8)
      ];
      let fSShift = DataReader.readFloat(data, i + 12);
      let vT = [
        DataReader.readFloat(data, i + 16),
        DataReader.readFloat(data, i + 20),
        DataReader.readFloat(data, i + 24)
      ];
      let fTShift = DataReader.readFloat(data, i + 28);
      let iMiptex = DataReader.readInteger(data, i + 32);
      let nFlags = DataReader.readInteger(data, i + 36);

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

  static parseFaces(faceHeader, data) {
    let offset = faceHeader[0];
    let length = faceHeader[1];
    let end = offset + length;

    let faceLump = Array(length / 20);
    let n = 0;
    for (let i = offset; i < end; i += 20) {
      let iPlane = DataReader.readShort(data, i);
      let nPlanSide = DataReader.readShort(data, i + 2);
      let iFirstEdge = DataReader.readInteger(data, i + 4);
      let nEdges = DataReader.readShort(data, i + 8);
      let iTextureInfo = DataReader.readShort(data, i + 10);
      let nStyles = [data[i + 12], data[i + 13], data[i + 14], data[i + 15]];
      let nLightmapoffset = DataReader.readInteger(data, i + 16);

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

  static parseLighting(
    lightingHeader,
    faces,
    surfedges,
    edges,
    vertices,
    data
  ) {
    const offset = lightingHeader[0];
    let length = lightingHeader[1];
    let end = offset + length;

    const buffer = [];

    // Loop through all faces
    for (let i = 0; i < faces.length; ++i) {
      let face = faces[i];
      // Find index into the color array
      let colorOffset = face.nLightmapoffset;

      // Get the index of the vertex that has this color
      for (let j = 0; j < face.nEdges; ++j) {
        let iEdge = surfedges[face.iFirstEdge + j];
        let index;

        if (iEdge > 0) {
          let edge = edges[iEdge];
          index = edge[0];
        } else {
          let edge = edges[-iEdge];
          index = edge[1];
        }

        // Okay this is a bit weird
        // We're not allowed to override a color we've already defined
        // (Since another vertex is using it)
        // So we modify the bsp datastructure to allow for a single
        // call to OpenGL to draw the map
        // Thus we need to make sure the color and vertex buffer are
        // synched up such that:
        // At colorBuffer[3*i] we have the color for the vertex located
        // at position 3*i
        if (buffer[3 * index] !== undefined) {
          // Get the number of vertices
          let vertexOffset = vertices.length / 3;

          // Add the new colour
          buffer[3 * vertexOffset] = data[offset + colorOffset] / 255.0;
          buffer[3 * vertexOffset + 1] = data[offset + colorOffset + 1] / 255.0;
          buffer[3 * vertexOffset + 2] = data[offset + colorOffset + 2] / 255.0;

          // Copy the vertex to the back of the buffer
          vertices[3 * vertexOffset] = vertices[3 * index];
          vertices[3 * vertexOffset + 1] = vertices[3 * index + 1];
          vertices[3 * vertexOffset + 2] = vertices[3 * index + 2];

          // Write the new index into the edges lump
          if (iEdge > 0) {
            edges[iEdge][0] = vertexOffset;
          } else {
            edges[-iEdge][1] = vertexOffset;
          }
        }
        // We're defining a new colour
        else {
          // Store r, g, b and a
          buffer[3 * index] = data[offset + colorOffset] / 255.0;
          buffer[3 * index + 1] = data[offset + colorOffset + 1] / 255.0;
          buffer[3 * index + 2] = data[offset + colorOffset + 2] / 255.0;
        }
      }
    }

    return new Float32Array(buffer);
  }

  static parseClipNodes(clipNodeHeader, data) {
    let offset = clipNodeHeader[0];
    let length = clipNodeHeader[1];
    let end = offset + length;

    let clipNodeLump = Array(length / 8);
    let n = 0;

    for (let i = offset; i < end; i += 8) {
      let iPlane = DataReader.readInteger(data, i);
      let iChildren = [
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

  static parseLeaves(leafHeader, data) {
    let offset = leafHeader[0];
    let length = leafHeader[1];
    let end = offset + length;

    let leafLump = Array(length / 28);
    let n = 0;
    for (let i = offset; i < end; i += 28) {
      let nContents = DataReader.readInteger(data, i);
      let nVisOffset = DataReader.readInteger(data, i + 4);
      let nMins = [
        DataReader.readSignedShort(data, i + 8),
        DataReader.readSignedShort(data, i + 10),
        DataReader.readSignedShort(data, i + 12)
      ];
      let nMaxs = [
        DataReader.readSignedShort(data, i + 14),
        DataReader.readSignedShort(data, i + 16),
        DataReader.readSignedShort(data, i + 18)
      ];
      let iFirstMarkSurface = DataReader.readShort(data, i + 20);
      let nMarkSurfaces = DataReader.readShort(data, i + 22);
      let nAmbientLevels = [
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

  static parseMarkSurfaces(markSurfaceHeader, data) {
    let offset = markSurfaceHeader[0];
    let length = markSurfaceHeader[1];
    let end = offset + length;

    let markSurfacesLump = Array(length / 2);
    let n = 0;
    for (let i = offset; i < end; i += 2) {
      markSurfacesLump[n++] = DataReader.readShort(data, i);
    }
    return markSurfacesLump;
  }

  static parseEdges(edgeHeader, data) {
    let offset = edgeHeader[0];
    let length = edgeHeader[1];
    let end = offset + length;

    let edgesLump = Array(length / 4);
    let n = 0;
    for (let i = offset; i < end; i += 4) {
      edgesLump[n++] = [
        DataReader.readShort(data, i),
        DataReader.readShort(data, i + 2)
      ];
    }

    return edgesLump;
  }

  static parseSurfedges(surfedgeHeader, data) {
    let offset = surfedgeHeader[0];
    let length = surfedgeHeader[1];
    let end = offset + length;

    let surfedgeLump = Array(length / 4);
    let n = 0;
    for (let i = offset; i < end; i += 4) {
      surfedgeLump[n++] = DataReader.readInteger(data, i);
    }

    return surfedgeLump;
  }
}
