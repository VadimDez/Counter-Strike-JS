/**
 * Created by Vadym Yatsyuk on 25.02.18
 */
import { mat4 } from 'gl-matrix';

import { Map } from './Map';
import { Player } from './Player';

export type GameInfoType = { gl: any, player: Player, map: Map, mvMatrix: mat4, pMatrix: mat4 };

export const GameInfo: GameInfoType = {
  gl: null,
  player: null,
  map: null,
  mvMatrix: mat4.create(),
  pMatrix: mat4.create()
};
