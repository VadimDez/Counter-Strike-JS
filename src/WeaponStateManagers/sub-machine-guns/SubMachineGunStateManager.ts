import { Weapon } from '../../Weapon';
import { WeaponStateManager } from '../WeaponStateManager';
import { WeaponAnimations } from '../../WeaponAnimations';
export class SubMachineGunStateManager extends WeaponStateManager {
  ammo = 30;
  magazineCapacity = 30;
  totalAmmoCapacity = 90;

  onShoot(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][0];
    if (render.currentSequence() === 1) {
      // reloading
      this.ammo = this.magazineCapacity;
      return;
    }

    if (this.ammo <= 0) {
      this.onReload(weapon);
      return;
    }

    render.forceAnimation(weaponData.shoot[this.shootIndex]);
    this.ammo--;

    if (this.ammo <= 0) {
      render.queueAnimation(weaponData.reload);
    }

    if (++this.shootIndex === weaponData.shoot.length) {
      this.shootIndex = 0;
    }
    render.queueAnimation(weaponData.idle);
  }

  onReload(weapon: Weapon) {
    if (this.magazineCapacity === this.ammo) {
      return;
    }

    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][0];
    render.forceAnimation(weaponData.reload);
    this.ammo = this.magazineCapacity;
    render.queueAnimation(weaponData.idle);
  }

  onIdle(weapon: Weapon) {
    let render = weapon.renderer;
    render.queueAnimation(0);
  }

  onDraw(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = WeaponAnimations[weapon.name][0];
    if (render) {
      render.forceAnimation(weaponData.draw);
      render.queueAnimation(weaponData.idle);
    }
  }
}
