/**
  This file contains the code needed to parse a .spr file (Version 2)
  into a JSON datastructure.
  Source: http://yuraj.ucoz.com/half-life-formats.pdf
**/
import { DataReader } from '../util/DataReader';

const constants = {
  SPR_MAGIC: 0x50534449,
  SPR_VERSION: 2
};

export class SpriteParser {
  static parse(input) {
    const header = SpriteParser.parseHeader(input);
    if (!header) {
      return;
    }

    const palette = SpriteParser.parsePalette(input);
    const frames = SpriteParser.parseFrames(palette, input);

    return {
      header,
      frames
    };
  }

  static parseFrames(palette, data) {
    const end = data.length;
    let i = 42 + palette.length * 3;

    let frames = [];
    while (i != end) {
      const frame = SpriteParser.parseSingleFrame(palette, i, data);
      frames.push(frame);
      // Advance to the next frame
      i += frame.width * frame.height + 20;
    }

    return frames;
  }

  static parsePalette(data) {
    let size = DataReader.readShort(data, 40);
    let end = 42 + size * 3;

    let palette = Array(size);
    let n = 0;
    for (let i = 42; i !== end; i += 3) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      palette[n++] = [r, g, b];
    }

    return palette;
  }

  static parseHeader(data) {
    const magic = DataReader.readInteger(data, 0);
    if (magic != constants.SPR_MAGIC) {
      console.log(
        'Invalid magic number for .spr file. Expected ' +
          constants.SPR_MAGIC +
          ', but was: ' +
          magic
      );
      return;
    }

    const version = DataReader.readInteger(data, 4);
    if (version != constants.SPR_VERSION) {
      console.log(
        'Invalid version number for .spr file. Expected ' +
          constants.SPR_VERSION +
          ', but was: ' +
          version
      );
      return;
    }

    const type = DataReader.readInteger(data, 8);
    const textureFormat = DataReader.readInteger(data, 12);
    const boundingRadius = DataReader.readFloat(data, 16);
    const maxWidth = DataReader.readInteger(data, 20);
    const maxHeight = DataReader.readInteger(data, 24);
    const numFrames = DataReader.readInteger(data, 28);
    const beamLength = DataReader.readFloat(data, 32);
    const synchType = DataReader.readInteger(data, 36);

    return {
      type: type,
      textureFormat: textureFormat,
      boundingRadius: boundingRadius,
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      numFrames: numFrames,
      beamLength: beamLength,
      synchType: synchType
    };
  }

  static parseSingleFrame(palette, offset, data) {
    const group = DataReader.readInteger(data, offset);
    const originX = DataReader.readInteger(data, offset + 4);
    const originY = DataReader.readInteger(data, offset + 8);
    const width = DataReader.readInteger(data, offset + 12);
    const height = DataReader.readInteger(data, offset + 16);
    const end = width * height + offset + 20;

    // The transparent colour is the last colour in the palette
    const transparentColor = palette[palette.length - 1];
    let isTransparent = function(rgb) {
      return (
        rgb[0] === transparentColor[0] &&
        rgb[1] === transparentColor[1] &&
        rgb[2] === transparentColor[2]
      );
    };

    let imageData = new Uint8Array(4 * width * height);
    let n = 0;
    for (let i = offset + 20; i != end; ++i) {
      let rgb = palette[data[i]];
      imageData[n++] = rgb[0];
      imageData[n++] = rgb[1];
      imageData[n++] = rgb[2];
      imageData[n++] = isTransparent(rgb) ? 0 : 255;
    }
    return {
      group: group,
      originX: originX,
      originY: originY,
      width: width,
      height: height,
      imageData: imageData
    };
  }
}
