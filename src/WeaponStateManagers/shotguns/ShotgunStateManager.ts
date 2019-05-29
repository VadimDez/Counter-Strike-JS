import { Weapon } from '../../Weapon';
import { WeaponStateManager } from '../WeaponStateManager';
import { WeaponAnimations } from '../../WeaponAnimations';

export class ShotgunStateManager extends WeaponStateManager {
  ammo = 8;
  magazineCapacity = 8;

  getWeaponData(weapon) {
    return WeaponAnimations[weapon.name][0];
  }

  onShoot(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = this.getWeaponData(weapon);

    if (
      weaponData.shoot.includes(render.currentSequence()) ||
      weaponData.reload.includes(render.currentSequence())
    ) {
      return;
    }

    if (this.ammo <= 0) {
      this.onReload(weapon);
      return;
    }

    render.forceAnimation(weaponData.shoot[this.shootIndex]);
    this.ammo--;

    if (this.ammo <= 0) {
      for (let i = 0; i < weaponData.reload.length; i++) {
        render.queueAnimation(weaponData.reload[i]);
      }
      this.ammo = this.magazineCapacity;
    }

    if (++this.shootIndex === weaponData.shoot.length) {
      this.shootIndex = 0;
    }

    render.queueAnimation(weaponData.idle);
  }

  onReload(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = this.getWeaponData(weapon);

    if (
      this.ammo === this.magazineCapacity ||
      weaponData.reload.includes(render.currentSequence())
    ) {
      return;
    }

    if (weaponData.reload.includes(render.currentSequence())) {
      return;
    }

    render.forceAnimation(weaponData.reload[0]);

    for (let i = 1; i < weaponData.reload.length; i++) {
      render.queueAnimation(weaponData.reload[i]);
    }
    this.ammo = this.magazineCapacity;
    render.queueAnimation(weaponData.idle);
  }

  onIdle(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = this.getWeaponData(weapon);
    render.queueAnimation(weaponData.idle);
  }

  onDraw(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = this.getWeaponData(weapon);
    render.forceAnimation(weaponData.draw);
    render.queueAnimation(weaponData.idle);
  }
}
