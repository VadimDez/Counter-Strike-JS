import { WeaponStateManagerInterface } from './WeaponStateManager.interface';
import { Weapon } from '../Weapon';

export class WeaponStateManager implements WeaponStateManagerInterface {
  shootIndex = 0;
  onShoot(weapon: Weapon) {}

  onReload(weapon: Weapon) {}

  onSpecial(weapon: Weapon) {}

  onIdle(weapon: Weapon) {}

  onDraw(weapon: Weapon) {}
}
