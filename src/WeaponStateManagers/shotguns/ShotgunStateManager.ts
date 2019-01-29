import { Weapon } from '../../Weapon';
import { WeaponStateManager } from '../WeaponStateManager';
import { WeaponAnimations } from '../../WeaponAnimations';

export class ShotgunStateManager extends WeaponStateManager {
  onShoot(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][0];

    if (
      weaponData.shoot.includes(render.currentSequence()) ||
      weaponData.reload.includes(render.currentSequence())
    ) {
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

    if (weaponData.reload.includes(render.currentSequence())) {
      return;
    }

    render.forceAnimation(weaponData.reload[0]);

    for (let i = 1; i < weaponData.reload.length; i++) {
      render.queueAnimation(weaponData.reload[i]);
    }

    render.queueAnimation(weaponData.idle);
  }

  onIdle(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][0];
    render.queueAnimation(weaponData.idle);
  }

  onDraw(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = WeaponAnimations[weapon.name][0];
    render.forceAnimation(weaponData.draw);
    render.queueAnimation(weaponData.idle);
  }
}
