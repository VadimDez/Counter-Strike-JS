/**
 * Created by Vadym Yatsyuk on 25.02.18
 */

/**
 This class implements functionality for reading binary data from a JS array
 **/

let view = new DataView(new ArrayBuffer(4));

export class DataReader {
  // Might be a bit slow, but loading speed is currently not an issue
  static readFloat(data: any, n: any) {
    view.setUint8(0, data[n + 3]);
    view.setUint8(1, data[n + 2]);
    view.setUint8(2, data[n + 1]);
    view.setUint8(3, data[n]);
    return view.getFloat32(0);
  }

  static readInteger(data: any, n: any) {
    return data[n] + (data[n + 1] << 8) + (data[n + 2] << 16) + (data[n + 3] << 24);
  }

  static readSignedShort(data: any, n: any) {
    let k = (data[n] + (data[n + 1] << 8));
    // If the sign bit is on
    if (k & 0x8000) {
      return k - 65536;
    }
    return k;
  }

  static readShort(data: any, n: any) {
    return data[n] + (data[n + 1] << 8);
  }

  static readBinaryString(data: any, n: any, length: any) {
    let end = length + n;
    let str = '';
    for (let i = n; i != end; ++i) {
      if (data[i] > 0) {
        str += String.fromCharCode(data[i]);
      }
      else break;
    }
    return str;
  }
}