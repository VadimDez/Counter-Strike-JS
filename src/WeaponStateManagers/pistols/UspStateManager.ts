import { Weapon } from '../../Weapon';
import { WeaponStateManager } from '../WeaponStateManager';
import { WeaponAnimations } from '../../WeaponAnimations';

export class UspStateManager extends WeaponStateManager {
  state = 0;

  onShoot(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][this.state];

    if (weaponData.reload === render.currentSequence()) {
      return;
    }

    render.forceAnimation(weaponData.shoot);

    render.queueAnimation(weaponData.idle);
  }

  onReload(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][this.state];

    if (render.currentSequence() === weaponData.reload) {
      return;
    }
    render.forceAnimation(weaponData.reload);
    render.queueAnimation(0);
  }

  onSpecial(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][this.state];
    this.state ^= 1; //  Swap between state 0 and 1
    render.forceAnimation(weaponData.special[0]);
    render.queueAnimation(weaponData.special[1]);
  }

  onIdle(weapon: Weapon) {
    let render = weapon.renderer;
    let weaponData = WeaponAnimations[weapon.name][this.state];
    render.queueAnimation(weaponData.idle);
  }

  onDraw(weapon: Weapon) {
    const render = weapon.renderer;
    const weaponData = WeaponAnimations[weapon.name][this.state];
    render.forceAnimation(weaponData.draw);
    render.queueAnimation(weaponData.idle);
  }
}
