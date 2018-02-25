import { WeaponAnimations } from './WeaponAnimations';

export const WeaponStateManager = {
	eliteManager: (function() {
		var shootIndex = 0;
		var state = 0;
		return {
			onShoot: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][state];
				if(weaponData.reload.indexOf(render.currentSequence()) !== -1)
					return;
				render.forceAnimation(weaponData.shoot[shootIndex]);
				if(++shootIndex == weaponData.shoot.length)
					shootIndex = 0;
				state = state === 0 ? 1 : 0;
				render.queueAnimation(weaponData.idle);
			},

			onReload: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][state];
				render.forceAnimation(weaponData.reload[0]);
				for(var i = 1; i < weaponData.reload.length; ++i) {
					render.queueAnimation(weaponData.reload[i]);
				}
				render.queueAnimation(weaponData.idle);
			},
			onSpecial: function(weapon) {},
			onIdle: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][state];
				render.queueAnimation(weaponData.idle);
			}
		}
	})(),

	shotgunManager: (function() {
		var shootIndex = 0;
		return {
			onShoot: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][0];
				if([1, 2].indexOf(render.currentSequence()) !== -1)
					return;
				render.forceAnimation(weaponData.shoot[shootIndex]);
				if(++shootIndex == weaponData.shoot.length)
					shootIndex = 0;
				render.queueAnimation(0);
			},

			onReload: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][0];
				render.forceAnimation(5);
				render.queueAnimation(3);
				render.queueAnimation(4);
				render.queueAnimation(0);
			},

			onSpecial: function(weapon) {

			},

			onIdle: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][0];
				render.queueAnimation(0);
			}
		};
	})(),

	subMachineGunManager: (function() {
		var shootIndex = 0;
		return {
			onShoot: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][0];
				if(render.currentSequence() === 1) //reloading
					return;
				render.forceAnimation(weaponData.shoot[shootIndex]);
				if(++shootIndex == weaponData.shoot.length)
					shootIndex = 0;
				render.queueAnimation(0);
			},

			onReload: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][0];
				render.forceAnimation(1);
				render.queueAnimation(0);
			},

			onSpecial: function(weapon) {

			},

			onIdle: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][0];
				render.queueAnimation(0);
			}
		};
	})(),

	pistolManager: (function() {
		var shootIndex = 0;
		return {
			onShoot: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][0];
				if(weaponData.reload.indexOf(render.currentSequence()) !== -1)
					return;
				render.forceAnimation(weaponData.shoot[shootIndex]);
				if(++shootIndex == weaponData.shoot.length)
					shootIndex = 0;
				render.queueAnimation(0);
			},

			onReload: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][0];
				if(render.currentSequence() === weaponData.reload[0])
					return;
				render.forceAnimation(weaponData.reload[0]);
				render.queueAnimation(0);
			},

			onSpecial: function(weapon) {

			},

			onIdle: function(weapon) {
				var render = weapon.renderer;
				render.queueAnimation(0);
			}
		};
	})(),

	glock18Manager: (function() {
		var shootIndex = 0;
		var state = 1;
		return {
			onShoot: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][state];
				if(weaponData.reload.indexOf(render.currentSequence()) !== -1)
					return;
				render.forceAnimation(weaponData.shoot[shootIndex]);
				if(++shootIndex == weaponData.shoot.length)
					shootIndex = 0;
				render.queueAnimation(0);
			},

			onReload: function(weapon) {
				var render = weapon.renderer;
				var weaponData = WeaponAnimations[weapon.name][0];
				if(render.currentSequence() === weaponData.reload[0])
					return;
				render.forceAnimation(weaponData.reload[0]);
				render.queueAnimation(0);
			},

			onSpecial: function(weapon) {
				var render = weapon.renderer;
				state ^= 1; //Swap between state 0 and 1
				var weaponData = WeaponAnimations[weapon.name][0];
				render.forceAnimation(weaponData.draw[0]);

			},

			onIdle: function(weapon) {
				var render = weapon.renderer;
				render.queueAnimation(0);
			}
		};
	})()
};