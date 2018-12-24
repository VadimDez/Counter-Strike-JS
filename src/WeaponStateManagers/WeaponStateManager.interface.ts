import { Weapon } from './../Weapon';
export interface WeaponStateManagerInterface {
  onShoot(weapon: Weapon);
  onReload(weapon: Weapon);
  onSpecial(weapon: Weapon);
  onIdle(weapon: Weapon);
  onDraw(weapon: Weapon);
}
