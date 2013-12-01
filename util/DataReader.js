/**
	This class implements functionality for reading binary data from a JS array
**/

DataReader = (function () {
	var view = new DataView(new ArrayBuffer(4));
	
	return {
		//Might be a bit slow, but loading speed is currently not an issue
		readFloat: function(data, n) {
			view.setUint8(0, data[n+3]);
			view.setUint8(1, data[n+2]);
			view.setUint8(2, data[n+1]);
			view.setUint8(3, data[n]);
			return view.getFloat32(0);
		},
		
		readInteger: function(data, n) {
			return data[n] + (data[n + 1] << 8) + (data[n + 2] << 16) + (data[n + 3] << 24);
		},
		
		readSignedShort: function(data, n) {
			var k = (data[n] + (data[n + 1] << 8));
			//If the sign bit is on
			if(k & 0x8000) {
				return k - 65536;
			}
			return k;
		},
		
		readShort: function(data, n) {
			return data[n] + (data[n + 1] << 8);
		},
		
		readBinaryString: function(data, n, length) {
			var str = data.subarray(n, n + length);
			return String.fromCharCode.apply(null, str);
		}
	};
})();