import { WeaponStateManager } from './../WeaponStateManager';
import { Weapon } from '../../Weapon';
import { WeaponAnimations } from '../../WeaponAnimations';

export class PistolStateManager extends WeaponStateManager {
  state = 0;

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

  onShoot(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = this.getWeaponData(weapon);

    if (
      weaponData.reload === render.currentSequence() ||
      weaponData.shoot.includes(render.currentSequence())
    ) {
      return;
    }

    render.forceAnimation(weaponData.shoot[this.shootIndex]);

    if (++this.shootIndex === weaponData.shoot.length) {
      this.shootIndex = 0;
    }

    render.queueAnimation(weaponData.idle);
  }

  onReload(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = this.getWeaponData(weapon);

    if (render.currentSequence() === weaponData.reload) {
      return;
    }

    render.forceAnimation(weaponData.reload);
    render.queueAnimation(weaponData.idle);
  }

  onSpecial(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = this.getWeaponData(weapon);
    this.state ^= 1; //  Swap between state 0 and 1
    render.forceAnimation(weaponData.special[0]);

    for (let i = 1; i <= weaponData.special.length; i++) {
      render.queueAnimation(weaponData.special[i]);
    }
  }

  getWeaponData(weapon: Weapon) {
    return WeaponAnimations[weapon.name][this.state];
  }
}
