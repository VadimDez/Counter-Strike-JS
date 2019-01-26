import { C4StateManager } from './WeaponStateManagers/C4StateManager';
import { WeaponStateManagerInterface } from './WeaponStateManagers/WeaponStateManager.interface';
import { KnifeStateManager } from './WeaponStateManagers/KnifeStateManager';
import { PistolStateManager } from './WeaponStateManagers/PistolStateManager';
import { SubMachineGunStateManager } from './WeaponStateManagers/SubMachineGunStateManager';
import { GrenadeStateManager } from './WeaponStateManagers/GrenadeStateManager';
/**
 * Created by Vadym Yatsyuk on 25.02.18
 */
import { mat4 } from 'gl-matrix';
// import * as glMatrix from '../lib/gl-matrix';
// const mat4 = glMatrix.mat4;
import { GameInfo } from './GameInfo';
import { Sprite } from './Sprite';
import { download } from './util/download';
import { ModelParser } from './parsers/ModelParser';
import { ModelRender } from './renderers/ModelRender';

/**
  This file defines the representation of a weapon.
  A weapon is a 1st person model which provides functionality
  such as shooting and reloading as well as rendering.
**/

export class Weapon {
  sprite: any = {};
  renderer = null;
  name: string;
  crosshair: Sprite = null;
  gl = GameInfo.gl;
  stateManager: WeaponStateManagerInterface;

  constructor(private weaponName: string) {
    this.name = weaponName;
    this.stateManager = this.getStateManager();

    this.loadWeaponInformation();
  }

  getStateManager() {
    switch (this.name) {
      case 'knife':
        return new KnifeStateManager();
      case 'ak47':
        return new SubMachineGunStateManager();
      case 'deagle':
        return new PistolStateManager();
      case 'hegrenade':
        return new GrenadeStateManager();
      case 'c4':
        return new C4StateManager();
    }
  }

  // Download weapon information
  async loadWeaponInformation() {
    const txt = await download<string>(
      `data/sprites/weapon_${this.weaponName}.txt`,
      'text'
    );
    const lines = txt.split('\n');
    // The last line is an empty string
    let length = lines.length - 1;

    for (let i = 1; i < length; ++i) {
      let tokens = lines[i].split(/ |\t/g).filter(str => str.length !== 0);

      // Note: The 640 res sprites are stored last in the file,
      // so if there exists a 640 res version of the sprite then
      // that's the one that will end up in the sprite object
      this.sprite[tokens[0]] = {
        res: tokens[1],
        file: tokens[2],
        x: tokens[3],
        y: tokens[4],
        w: tokens[5],
        h: tokens[6]
      };
    }

    if (this.sprite['crosshair']) {
      // Dwonload crosshair spritesheet
      const crosshair = await download(
        `data/sprites/${this.sprite['crosshair'].file}.spr`,
        'arraybuffer'
      );

      let crosshairInfo = this.sprite.crosshair;

      this.crosshair = new Sprite(this.gl, crosshair).subSprite(
        crosshairInfo.x,
        crosshairInfo.y,
        crosshairInfo.w,
        crosshairInfo.h
      );
    }

    // Download weapon model
    const mdl = await download(
      `data/models/v_${this.weaponName}.mdl`,
      'arraybuffer'
    );
    let weaponData = ModelParser.parse(this.gl, mdl);
    this.renderer = new ModelRender(this.gl, weaponData);
  }

  render() {
    if (this.renderer !== null) {
      // Render the weapon
      this.renderer.render();
    }

    if (this.crosshair) {
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

  draw() {
    this.stateManager.onDraw(this);
  }
}
