import { Weapon } from './../Weapon';
import { WeaponStateManager } from './WeaponStateManager';
import { WeaponAnimations } from '../WeaponAnimations';

export class KnifeStateManager extends WeaponStateManager {
  getWeaponData(weaponName) {
    return WeaponAnimations[weaponName][0];
  }

  onShoot(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = this.getWeaponData(weapon.name);

    render.forceAnimation(weaponData.shoot);
    render.queueAnimation(weaponData.idle);
  }

  onSpecial(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = this.getWeaponData(weapon.name);
    render.forceAnimation(weaponData.special);

    render.queueAnimation(weaponData.idle);
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
