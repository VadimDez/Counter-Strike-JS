/**
 * Created by Vadym Yatsyuk on 25.02.18
 */
/**
 * This file defines the representation of a Player
 * A player is responsible for its own movement by
 * providing keyboard listeners
**/

import * as KeyboardJS from 'keyboardjs/dist/keyboard.min.js';
console.log(KeyboardJS);
import { vec3 } from 'gl-matrix';
// import * as glMatrix from '../lib/gl-matrix';
// const vec3 = glMatrix.vec3;

import { Mouse as MouseJS } from './util/Mouse';
import { config } from './config';
import { CollisionDetection } from './CollisionDetection';
import { Weapon } from './Weapon';

export class Player {
  x: number;
  y: number;
  z: number;
  yAngle = 0;
  xAngle = 0;
  speed = 5;
  dir: vec3;
  weapon: Weapon = null;

  constructor(public gl, x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;

    // X and Y direction. Not necessarily normalized
    this.dir = vec3.fromValues(0, 0, 0);
    this.setupKey();
  }

  position() {
    return [this.x, this.y, this.z];
  }

  move() {
    let onGround = CollisionDetection.isOnGround(this.position());
    let normalDir = vec3.fromValues(0, 0, 0);
    vec3.normalize(normalDir, this.dir);

    // Move forward
    let newX = this.x + this.speed * normalDir[0] * Math.cos(this.yAngle);
    let newY = this.y - this.speed * normalDir[0] * Math.sin(this.yAngle);
    let newZ = this.z + 18 * this.dir[2];

    // Strafe
    newY -= this.speed * normalDir[1] * Math.cos(Math.PI - this.yAngle);
    newX += this.speed * normalDir[1] * Math.sin(Math.PI - this.yAngle);

    // Apply gravity if we're not on the ground. TODO: Accelerate instead of subtracting a constant
    if (!onGround) {
      newZ -= config.GRAVITY;
      this.dir[2] = Math.max(0, this.dir[2] - 0.1);
    }

    let newPosition = CollisionDetection.move([this.x, this.y, this.z + config.MAX_Z_CHANGE], [newX, newY, newZ]);

    this.x = newPosition[0];
    this.y = newPosition[1];
    this.z = newPosition[2];
  }

  rotate(xDelta, yDelta) {
    let PI_HALF = Math.PI / 2.0;
    let PI_TWO = Math.PI * 2.0;

    this.yAngle += (xDelta * config.MOUSE_SENSITIVITY) || 0;

    // Make sure we're in the interval [0, 2*pi]
    while (this.yAngle < 0) {
      this.yAngle += PI_TWO;
    }
    while (this.yAngle >= PI_TWO) {
      this.yAngle -= PI_TWO;
    }

    this.xAngle += (yDelta * config.MOUSE_SENSITIVITY) || 0;

    // Make sure we're in the interval [-pi/2, pi/2]
    if (this.xAngle < -PI_HALF) {
      this.xAngle = -PI_HALF;
    }
    if (this.xAngle > PI_HALF) {
      this.xAngle = PI_HALF;
    }
  }

  render() {
    return this.weapon.render();
  }

  switchWeapon(weaponName) {
    this.weapon = new Weapon(weaponName);
  }

  setupKey() {
    MouseJS.on('left', () => {
      this.weapon.shoot();
    }, () => {
      this.weapon.idle();
    });

    MouseJS.on('right', () => {
      this.weapon.special();
    }, () => {
      this.weapon.idle();
    });

    KeyboardJS.on('r', (event, keys, combo) => {
      this.weapon.reload();
    }, (event, keys, combo) => {
    });


    KeyboardJS.on('w', (event: KeyboardEvent) => {
      this.dir[0] = 1;
    }, (event) => {
      this.dir[0] = 0;
    });

    KeyboardJS.on('s', (event: KeyboardEvent) => {
      this.dir[0] = -1;
    }, (event) => {
      this.dir[0] = 0;
    });

    // Handle w and s keys
    KeyboardJS.on('w + s', (event: KeyboardEvent) => {
      this.dir[0] = 0;
    });


    KeyboardJS.on('a', (event: KeyboardEvent) => {
      this.dir[1] = 1;
    }, (event) => {
      this.dir[1] = 0;
    });

    KeyboardJS.on('d', (event: KeyboardEvent) => {
      this.dir[1] = -1;
    }, (event) => {
      this.dir[1] = 0;
    });

    // Handle a and d keys
    // Symmetric to the handling of w and s
    KeyboardJS.on('a + d', () => {
      this.dir[1] = 0;
    });

    KeyboardJS.on('space', (event) => {
      let d = this.dir[2];
      if (d < 0.0001 && d > -0.0001) {
        this.dir[2] = 1;
      }
    }, function (event) {
    });
  }
}