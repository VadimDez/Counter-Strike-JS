import { Weapon } from '../../Weapon';
import { PistolStateManager } from './PistolStateManager';

export class DeagleStateManager extends PistolStateManager {
  ammo = 7;
  magazineCapacity = 7;

  onSpecial(weapon: Weapon) {}
}
