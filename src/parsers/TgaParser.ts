export class TgaParser {
  static parse(data) {
    this.parseHeader(data);
  }

  static parseHeader(data) {
    const tga = new DataView(data);

    let header = {
      idLength: tga.getUint8(0),
      colorMapType: tga.getUint8(1),
      imageType: tga.getUint8(2),
      colorMap: {
        firstEntryIndex: tga.getUint16(3, true),
        length: tga.getUint16(5, true),
        size: tga.getUint8(7)
      },
      image: {
        xOrigin: tga.getUint16(8, true),
        yOrigin: tga.getUint16(10, true),
        width: tga.getUint16(12, true),
        height: tga.getUint16(14, true),
        depth: tga.getUint8(16),
        descriptor: tga.getUint8(17)
      }
    };
  }
}
