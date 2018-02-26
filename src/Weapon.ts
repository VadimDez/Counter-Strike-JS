/**
 * Created by Vadym Yatsyuk on 25.02.18
 */
import { mat4 } from 'gl-matrix';
// import * as glMatrix from '../lib/gl-matrix';
// const mat4 = glMatrix.mat4;
import { GameInfo } from './GameInfo';
import { Sprite } from './Sprite';
import { download } from './util/download';
import { WeaponStateManager } from './WeaponStateManager';
import { ModelParser } from './ModelParser';
import { ModelRender } from './ModelRender';

/**
  This file defines the representation of a weapon.
  A weapon is a 1st person model which provides functionality
  such as shooting and reloading as well as rendering.
**/

export class Weapon {
  sprite = {};
  renderer = null;
  name: string;
  crosshair: Sprite = null;
  gl = GameInfo.gl;
  stateManager = WeaponStateManager.shotgunManager;

  constructor(private weaponName: string) {
    this.name = weaponName;

    this.loadWeaponInformation();
  }

  // Download weapon information
  loadWeaponInformation() {
    download(`data/sprites/weapon_${ this.weaponName }.txt`, 'text', (txt) => {
      let lines = txt.split('\n');
      // The last line is an empty string
      let length = lines.length - 1;

      for (let i = 1; i < length; ++i) {
        let tokens = lines[i]
          .split(/ |\t/g)
          .filter((str) => str.length !== 0);

        // Note: The 640 res sprites are stored last in the file,
        // so if there exists a 640 res version of the sprite then
        // that's the one that will end up in the sprite object
        this.sprite[tokens[0]] = {
          res: tokens[1],
          file: tokens[2],
          x: tokens[3],
          y: tokens[4],
          w: tokens[5],
          h: tokens[6],
        };
      }

      if (this.sprite['crosshair'] !== undefined) {
        // Dwonload crosshair spritesheet
        download(`data/sprites/${ this.sprite['crosshair'].file }.spr`, 'arraybuffer', (data: any) => {
          let crosshairInfo = this.sprite['crosshair'];
          this.crosshair = new Sprite(this.gl, data).subSprite(crosshairInfo.x, crosshairInfo.y, crosshairInfo.w, crosshairInfo.h);
        });
      }
    });

    // Download weapon model
    download(`data/models/v_${ this.weaponName }.mdl`, 'arraybuffer', (data) => {
      let weaponData = ModelParser.parse(this.gl, data);
      this.renderer = new ModelRender(this.gl, weaponData);
    });
  }


  render() {
    if (this.renderer !== null) {
      // Render the weapon
      this.renderer.render();
    }

    if (this.crosshair !== null) {
      // Render the crosshair
      mat4.identity(GameInfo.mvMatrix);
      mat4.translate(GameInfo.mvMatrix, GameInfo.mvMatrix, [0.0, 0.0, -50]);
      this.crosshair.render();
    }
  }

  shoot() {
    this.stateManager.onShoot(this);
  }

  idle() {
    this.stateManager.onIdle(this);
  }

  reload() {
    this.stateManager.onReload(this);
  }

  special() {
    this.stateManager.onSpecial(this);
  }
}