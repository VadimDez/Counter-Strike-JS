/**
 * Created by Vadym Yatsyuk on 25.02.18
 */
/**
  This file contains all configuration settings for the engine
**/

export const config = {
  MAP_PATH: 'cstrike/maps/cs_assault.bsp',
  MAP: 'de_dust2.bsp',
  PLAYER_PATH: 'cstrike/models/player/arctic/arctic.mdl',
  PLAYER_DEFAULT_WEAPON: 'ak47',
  NEAR_CLIPPING: 0.1,
  FAR_CLIPPING: 10000.0,
  FIELD_OF_VIEW: 59.0, // In degrees
  PLAYER_HEIGHT: 17,
  GRAVITY: 12,
  // How much the player can change his Z position without a jump.
  MAX_Z_CHANGE: 17,
  // The factor multiplied to the delta x and delta y of the mouse movement
  MOUSE_SENSITIVITY: 0.0025
};
