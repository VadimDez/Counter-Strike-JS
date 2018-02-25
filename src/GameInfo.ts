/**
 * Created by Vadym Yatsyuk on 25.02.18
 */

import { mat4 } from 'gl-matrix';

export const GameInfo: any = {
	gl: null,
	player: null,
	map: null,
	mvMatrix: mat4.create(),
	pMatrix: mat4.create()
};
