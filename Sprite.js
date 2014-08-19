/**
	The sprite abstraction class for parsing and rendering a sprite.
**/

define(["SpriteParser", "SpriteRender"], function(SpriteParser, SpriteRender) {
	return function Sprite(gl, data) {
		//If data has a header field it means that it's an already
		//parsed JSON representation. If not we need to parse it
		var sprite = data.header === undefined ? SpriteParser.parse(data) : data;
		var spriteRender;
		this.render = function() {
			if(!spriteRender) {
				spriteRender = new SpriteRender(gl, sprite);
			}
			spriteRender.render();
		};
		
		this.subSprite = function(x, y, w, h) {
			var subsprite = {};
			subsprite.header = sprite.header;
			subsprite.frames = Array(sprite.frames.length);
			var width = sprite.header.maxWidth;
			for(var i = 0; i < sprite.frames.length; ++i) {
				var frame = sprite.frames[i];
				var imageData = new Uint8Array(4 * w * h);
				
				//The first pixel in our new image
				var start = 4 * (width * y + x);
				var n = start;
				//Loop through each row containing part of the image we need
				for(var j = 0; j != h; ++j) {
					//Grab the subarray of the row we need
					var row = frame.imageData.subarray(n, 4*w + n);
					imageData.set(row, 4 * j * w);
					//Advance to the next row in the image
					n += 4 * width;
				}
				//Create a new frame in the subsprite
				subsprite.frames[i] = {
					group: frame.group,
					originX: frame.originX,
					originY: frame.originY,
					width: w,
					height: h,
					imageData: imageData
				};
			}
			
			return new Sprite(gl, subsprite);
		};
	};
});