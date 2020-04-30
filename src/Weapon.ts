import { P90StateManager } from './WeaponStateManagers/sub-machine-guns/P90StateManager';
import { UMP45StateManager } from './WeaponStateManagers/sub-machine-guns/UMP45StateManager';
import { TMPStateManager } from './WeaponStateManagers/sub-machine-guns/TMPStateManager';
import { XM1014StateManager } from './WeaponStateManagers/shotguns/XM1014StateManager';
import { M3StateManager } from './WeaponStateManagers/shotguns/M3StateManager';
import { GalilStateManager } from './WeaponStateManagers/rifles/GalilStateManager';
import { EliteStateManager } from './WeaponStateManagers/pistols/EliteStateManager';
import { FiveSevenStateManager } from './WeaponStateManagers/pistols/FiveSevenStateManager';
import { P228StateManager } from './WeaponStateManagers/pistols/P228StateManager';
import { UspStateManager } from './WeaponStateManagers/pistols/UspStateManager';
import { GlockStateManager } from './WeaponStateManagers/pistols/GlockStateManager';
import { C4StateManager } from './WeaponStateManagers/equipment/C4StateManager';
import { WeaponStateManagerInterface } from './WeaponStateManagers/WeaponStateManager.interface';
import { KnifeStateManager } from './WeaponStateManagers/KnifeStateManager';
import { DeagleStateManager } from './WeaponStateManagers/pistols/DeagleStateManager';
import { SubMachineGunStateManager } from './WeaponStateManagers/sub-machine-guns/SubMachineGunStateManager';
import { GrenadeStateManager } from './WeaponStateManagers/equipment/GrenadeStateManager';
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
import { WeaponStateManager } from './WeaponStateManagers/WeaponStateManager';

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
  weapon: Sprite = null;
  ammo: Sprite = null;
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
      case 'tmp':
        return new TMPStateManager();
      case 'ump45':
        return new UMP45StateManager();
      case 'p90':
        return new P90StateManager();
      case 'mac10':
      case 'mp5':
      case 'm249':
      case 'famas':
      case 'ak47':
      case 'm4a1':
      case 'sg552':
      case 'aug':
      case 'scout':
      case 'sg550':
      case 'awp':
      case 'g3sg1':
        return new SubMachineGunStateManager();
      case 'galil':
        return new GalilStateManager();
      case 'hegrenade':
        return new GrenadeStateManager();
      case 'c4':
        return new C4StateManager();

      // pistols
      case 'glock18':
        return new GlockStateManager();
      case 'usp':
        return new UspStateManager();
      case 'p228':
        return new P228StateManager();
      case 'deagle':
        return new DeagleStateManager();
      case 'fiveseven':
        return new FiveSevenStateManager();
      case 'elite':
        return new EliteStateManager();

      // shotguns
      case 'm3':
        return new M3StateManager();
      case 'xm1014':
        return new XM1014StateManager();

      default:
        return new WeaponStateManager();
    }
  }

  // Download weapon information
  async loadWeaponInformation() {
    const spriteName = this.weaponName === 'mp5' ? 'mp5navy' : this.weaponName;

    const txt = await download<string>(
      `cstrike/sprites/weapon_${spriteName}.txt`,
      'text'
    );
    console.log(txt);

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

    console.log('=============== sprite:');
    console.log(this.sprite);

    await this.renderHud();
    await this.renderCrosshair();

    // Download weapon model
    const mdl = await download(
      `cstrike/models/v_${this.weaponName}.mdl`,
      'arraybuffer'
    );
    let weaponData = ModelParser.parse(this.gl, mdl);
    this.renderer = new ModelRender(this.gl, weaponData);
  }

  getSprite(fileName) {
    return download(`cstrike/sprites/${fileName}.spr`, 'arraybuffer');
  }

  async renderHud() {
    if (this.sprite.weapon) {
      const weaponInfo = this.sprite.weapon;
      // Dwonload weapon spritesheet
      const weapon = await this.getSprite(weaponInfo.file);

      this.weapon = new Sprite(this.gl, weapon).subSprite(
        weaponInfo.x,
        weaponInfo.y,
        weaponInfo.w,
        weaponInfo.h
      );
    }

    if (this.sprite.ammo) {
      const ammoInfo = this.sprite.ammo;
      const ammo = await this.getSprite(ammoInfo.file);

      this.ammo = new Sprite(this.gl, ammo).subSprite(
        ammoInfo.x,
        ammoInfo.y,
        ammoInfo.w,
        ammoInfo.h
      );
    }
  }

  async renderCrosshair() {
    if (this.sprite.crosshair) {
      // Dwonload crosshair spritesheet
      const crosshairInfo = this.sprite.crosshair;
      const crosshair = await this.getSprite(crosshairInfo.file);

      this.crosshair = new Sprite(this.gl, crosshair).subSprite(
        crosshairInfo.x,
        crosshairInfo.y,
        crosshairInfo.w,
        crosshairInfo.h
      );
    }
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

    if (this.weapon) {
      mat4.identity(GameInfo.mvMatrix);
      // mat4.translate(GameInfo.mvMatrix, GameInfo.mvMatrix, [-50.0, 15.0, -50]);
      mat4.translate(GameInfo.mvMatrix, GameInfo.mvMatrix, [10.0, -1.0, -10]);
      this.weapon.render();
    }

    if (this.ammo) {
      mat4.identity(GameInfo.mvMatrix);
      mat4.translate(GameInfo.mvMatrix, GameInfo.mvMatrix, [0.0, 0.0, -50]);
      this.ammo.render();
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
