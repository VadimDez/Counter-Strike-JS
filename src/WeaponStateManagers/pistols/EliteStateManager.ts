import { PistolStateManager } from './PistolStateManager';
import { Weapon } from '../../Weapon';

export class EliteStateManager extends PistolStateManager {
  ammo = 30;
  magazineCapacity = 30;
  onShoot(weapon: Weapon) {
    super.onShoot(weapon);
    this.state ^= 1;
  }
}
