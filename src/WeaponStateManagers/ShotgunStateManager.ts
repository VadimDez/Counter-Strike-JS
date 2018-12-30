import { Weapon } from './../Weapon';
import { WeaponStateManager } from './WeaponStateManager';
import { WeaponAnimations } from '../WeaponAnimations';

export class ShotgunStateManager extends WeaponStateManager {
  onShoot(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][0];

    if ([1, 2].indexOf(render.currentSequence()) !== -1) {
      return;
    }

    render.forceAnimation(weaponData.shoot[this.shootIndex]);

    if (++this.shootIndex === weaponData.shoot.length) {
      this.shootIndex = 0;
    }

    render.queueAnimation(0);
  }

  onReload(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][0];

    render.forceAnimation(5);
    render.queueAnimation(3);
    render.queueAnimation(4);
    render.queueAnimation(0);
  }

  onIdle(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][0];
    render.queueAnimation(0);
  }

  onDraw(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = WeaponAnimations[weapon.name][0];
    render.forceAnimation(weaponData.draw);
    render.queueAnimation(weaponData.idle);
  }
}
