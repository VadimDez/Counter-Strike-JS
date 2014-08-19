/**
	This file contains the code needed to parse a .spr file (Version 2)
	into a JSON datastructure.
	Source: http://yuraj.ucoz.com/half-life-formats.pdf
**/

define(["util/DataReader"], function(DataReader) {
	var constants = {
		SPR_MAGIC: 0x50534449,
		SPR_VERSION: 2
	};
	var data;
	
	var parseHeader = function() {
		var magic = DataReader.readInteger(data, 0);
		if(magic != constants.SPR_MAGIC) {
			console.log("Invalid magic number for .spr file. Expected "
				+ constants.SPR_MAGIC + ", but was: " + magic);
			return;
		}
		var version = DataReader.readInteger(data, 4);
		if(version != constants.SPR_VERSION) {
			console.log("Invalid version number for .spr file. Expected "
				+ constants.SPR_VERSION + ", but was: " + version);
			return;
		}
		
		var type = DataReader.readInteger(data, 8);
		var textureFormat = DataReader.readInteger(data, 12);
		var boundingRadius = DataReader.readFloat(data, 16);
		var maxWidth = DataReader.readInteger(data, 20);
		var maxHeight = DataReader.readInteger(data, 24);
		var numFrames = DataReader.readInteger(data, 28);
		var beamLength = DataReader.readFloat(data, 32);
		var synchType = DataReader.readInteger(data, 36);
		
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
	};
	
	var parsePalette = function() {
		var size = DataReader.readShort(data, 40);
		var end = 42 + size * 3;
		
		var palette = Array(size);
		var n = 0;
		for(var i = 42; i != end; i += 3) {
			var r = data[i];
			var g = data[i+1];
			var b = data[i+2];
			
			palette[n++] = [r, g, b];
		}
		return palette;
	};
	
	var parseSingleFrame = function(palette, offset) {
		var group = DataReader.readInteger(data, offset);
		var originX = DataReader.readInteger(data, offset+4);
		var originY = DataReader.readInteger(data, offset+8);
		var width = DataReader.readInteger(data, offset+12);
		var height = DataReader.readInteger(data, offset+16);
		var end = width*height + offset + 20;
		
		//The transparent colour is the last colour in the palette
		var transparentColor = palette[palette.length-1];
		var isTransparent = function(rgb) {
			return rgb[0] === transparentColor[0] &&
				rgb[1] === transparentColor[1] &&
				rgb[2] === transparentColor[2];
		}
		
		var imageData = new Uint8Array(4 * width * height);
		var n = 0;
		for(var i = offset+20; i != end; ++i) {
			var rgb = palette[data[i]];
			imageData[n++] = rgb[0]
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
	};
	
	var parseFrames = function(palette) {
		var end = data.length;
		var i = 42 + palette.length * 3;
		
		var frames = [];
		while(i != end) {
			var frame = parseSingleFrame(palette, i);
			frames.push(frame);
			//Advance to the next frame
			i += frame.width * frame.height + 20;
		}
		return frames;
	};
	
	return {
		parse: function(input) {
			data = input;
			
			var header = parseHeader();
			if(!header) return;
			var palette = parsePalette();
			var frames = parseFrames(palette);
			return {
				header: header,
				frames: frames
			};
		}
	};
});