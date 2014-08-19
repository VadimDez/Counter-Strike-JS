/**
	This file defines the representation of a weapon.
	A weapon is a 1st person model which provides functionality
	such as shooting and reloading as well as rendering.
**/
define(["ModelRender", "util/download", "Sprite", "ModelParser", "GameInfo", "lib/gl-matrix", "WeaponStateManager"],
	function(ModelRender, download, Sprite, ModelParser, GameInfo, glMatrix, WeaponStateManager) {

	return function(weaponName) {
		var sprite = {};
		this.renderer = null;
		this.name = weaponName;
		var crosshair = null;
		var gl = GameInfo.gl;

		var stateManager = WeaponStateManager.shotgunManager;
		
		//Download weapon information
		download("data/sprites/weapon_" + weaponName + ".txt", "text", function(txt) {
			var lines = txt.split("\n");
			//The last line is an empty string
			var length = lines.length-1
			for(var i = 1; i < length; ++i) {
				var tokens = lines[i].split(/ |\t/g)
				.filter(function (str) {
					return str.length != 0;
				});
				//Note: The 640 res sprites are stored last in the file,
				//so if there exists a 640 res version of the sprite then
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
				download("data/sprites/" + sprite["crosshair"].file + ".spr", "arraybuffer", function(data) {
					var crosshairInfo = sprite["crosshair"];
					crosshair = new Sprite(gl, data).subSprite(crosshairInfo.x, crosshairInfo.y, crosshairInfo.w, crosshairInfo.h);
				});
			}
		});
		
		//Download weapon model
		var _this = this;
		download("data/models/v_" + weaponName + ".mdl", "arraybuffer", function(data) {
			var weaponData = ModelParser.parse(gl, data);
			_this.renderer = new ModelRender(gl, weaponData);
		});
		
		this.render = function() {
			if(this.renderer !== null) {
				//Render the weapon
				this.renderer.render();
			}
			
			if(crosshair !== null) {
				//Render the crosshair
				glMatrix.mat4.identity(GameInfo.mvMatrix);
				glMatrix.mat4.translate(GameInfo.mvMatrix, GameInfo.mvMatrix, [0.0, 0.0, -50]);
				crosshair.render();
			}
		};
		
		this.shoot = function() {
			stateManager.onShoot(this);
		};
		
		this.idle = function() {
			stateManager.onIdle(this);
		};
		
		this.reload = function() {			
			stateManager.onReload(this);
		};
		
		this.special = function() {
			stateManager.onSpecial(this);
		}
	};
});