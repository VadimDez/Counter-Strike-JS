import { Weapon } from '../../Weapon';
import { WeaponStateManager } from '../WeaponStateManager';
import { WeaponAnimations } from '../../WeaponAnimations';

export class FiveSevenStateManager extends WeaponStateManager {
  onShoot(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][0];
    if (weaponData.reload.indexOf(render.currentSequence()) !== -1) {
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
    if (render.currentSequence() === weaponData.reload[0]) {
      return;
    }

    render.forceAnimation(weaponData.reload[0]);
    render.queueAnimation(0);
  }

  onIdle(weapon: Weapon) {
    let render = weapon.renderer;
    render.queueAnimation(0);
  }

  onDraw(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = WeaponAnimations[weapon.name][0];
    render.forceAnimation(weaponData.draw);
    render.queueAnimation(weaponData.idle);
  }
}
