/**
	This file defines the representation of a weapon.
	A weapon is a 1st person model which provides functionality
	such as shooting and reloading as well as rendering.
**/
window.cs = window.cs || { };

cs.Weapon = function(weaponName) {
	var sprite = {};
	var renderer = null;
	var crosshair = null;
	
	//Download weapon information
	cs.download("data/sprites/weapon_" + weaponName + ".txt", "text", function(txt) {
		var lines = txt.split("\n");
		//The last line is an empty string
		var length = lines.length-1
		for(var i = 1; i < length; ++i) {
			var tokens = lines[i].split(/ |\t/g)
			.filter(function (str) {
				return str.length != 0 
			});
			//Note: The 640 res sprites are stored last in the file,
			//so if there exists a 64p res version of the sprite then
			//that's the one that will end up in the sprite object
			sprite[tokens[0]] = {
				res: tokens[1],
				file: tokens[2],
				x: tokens[3],
				y: tokens[4],
				w: tokens[5],
				h: tokens[6],
			};
		}
		
		if(sprite["crosshair"] !== undefined) {
			//Dwonload crosshair spritesheet
			cs.download("data/sprites/" + sprite["crosshair"].file + ".spr", "arraybuffer", function(data) {
				var crosshairInfo = sprite["crosshair"];
				crosshair = new cs.Sprite(gl, data).subSprite(crosshairInfo.x, crosshairInfo.y, crosshairInfo.w, crosshairInfo.h);
			});
		}
	});
	
	//Download weapon model
	cs.download("data/models/v_" + weaponName + ".mdl", "arraybuffer", function(data) {
		var weaponData = cs.ModelParser.parse(gl, data);
		renderer = new cs.ModelRender(gl, weaponData);
	});
	
	this.render = function() {
		if(renderer !== null) {
			//Render the weapon
			renderer.render();
		}
		
		if(crosshair !== null) {
			//Render the crosshair
			mat4.identity(cs.mvMatrix);
			mat4.translate(cs.mvMatrix, cs.mvMatrix, [0.0, 0.0, -50]);
			crosshair.render();
		}
	};
	
	this.shoot = function() {
		document.getElementById("sound").cloneNode(true).play();
		renderer.forceAnimation(3, 125);
	};
	
	this.idle = function() {
		renderer.queueAnimation(0);
	};
	
	this.reload = function() {
		renderer.forceAnimation(1);
		renderer.queueAnimation(0);
	};
};