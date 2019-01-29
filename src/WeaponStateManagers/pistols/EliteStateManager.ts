import { PistolStateManager } from './PistolStateManager';
import { Weapon } from '../../Weapon';

export class EliteStateManager extends PistolStateManager {
  onShoot(weapon: Weapon) {
    super.onShoot(weapon);
    this.state ^= 1;
  }
}
