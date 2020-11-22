import { TgaParser } from './parsers/TgaParser';
/**
 * Created by Vadym Yatsyuk on 25.02.18
 */

import { mat4 } from 'gl-matrix';

import { download } from './util/download';
import { GameInfo } from './GameInfo';
import { Player } from './Player';
import { Map } from './Map';
import { config } from './config';
import { PointerLock } from './util/PointerLock';

export class Main {
  private map: string;

  constructor() {
    (window as any).cs = (window as any).cs || {};
  }

  static initGL(canvas: HTMLCanvasElement) {
    try {
      GameInfo.gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      GameInfo.gl.viewportWidth = canvas.width;
      GameInfo.gl.viewportHeight = canvas.height;

      GameInfo.gl.enable((window as any).gl.DEPTH_TEST);
      GameInfo.gl.enable((window as any).gl.CULL_FACE);
      GameInfo.gl.cullFace((window as any).gl.FRONT);
    } catch (e) {}

    if (!GameInfo.gl) {
      console.log('Could not initialise WebGL');
    }
  }

  static render() {
    let player = GameInfo.player;
    let gl = GameInfo.gl;

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(
      GameInfo.pMatrix,
      (config.FIELD_OF_VIEW * Math.PI) / 180,
      gl.viewportWidth / gl.viewportHeight,
      config.NEAR_CLIPPING,
      config.FAR_CLIPPING
    );

    mat4.identity(GameInfo.mvMatrix);
    mat4.rotateX(GameInfo.mvMatrix, GameInfo.mvMatrix, player.xAngle);
    mat4.rotateY(GameInfo.mvMatrix, GameInfo.mvMatrix, player.yAngle);

    // Move the player by moving the map in the reverse direction
    mat4.translate(GameInfo.mvMatrix, GameInfo.mvMatrix, [
      player.y,
      -player.z - config.PLAYER_HEIGHT,
      player.x
    ]);

    GameInfo.map.render(player.position());

    mat4.identity(GameInfo.mvMatrix);

    // Draw player
    player.render();
  }

  mainLoop() {
    (window as any).requestAnimFrame(this.mainLoop.bind(this));
    GameInfo.player.move();

    Main.render();
  }

  getMap() {
    return this.map || config.MAP;
  }

  async webGLStart() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;

    Main.initGL(canvas);

    GameInfo.gl.clearColor(201 / 255, 236 / 255, 252 / 255, 1.0);

    const map: any = await this.loadMap();
    // Parse map
    GameInfo.map = new Map(GameInfo.gl, map);

    this.renderSky();

    this.preparePlayer();

    // Set event handler for resizing the screen every time
    // the window changes size
    let resizeCallback = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      GameInfo.gl.viewportWidth = window.innerWidth;
      GameInfo.gl.viewportHeight = window.innerHeight;
    };

    resizeCallback();
    window.addEventListener('resize', resizeCallback, false);

    // Listen for clicks on the canvas
    canvas.addEventListener(
      'click',
      () => {
        // is the mouse not currently locked?
        if (!PointerLock.pointerLockElement()) {
          // Nope. Request locking
          PointerLock.requestPointerLock(canvas);
        }
      },
      false
    );

    // Listen for pointer locking
    PointerLock.addPointerLockExchangeEventListener(
      document,
      e => {
        // Did the pointer just go from unlocked to locked?
        if (!!PointerLock.pointerLockElement()) {
          console.log('add mouse move');
          // Yep! Add mousemove listener
          PointerLock.addMouseMoveEventListener(
            document,
            Main.rotatePlayer,
            false
          );
        } else {
          // Nope. Remove mouse move listener
          console.log('remove mouse move');
          PointerLock.removeMouseMoveEventListener(document, Main.rotatePlayer);
        }
      },
      false
    );

    this.mainLoop();
  }

  preparePlayer() {
    const spawn = GameInfo.map.getSpawn();

    GameInfo.player = new Player(
      GameInfo.gl,
      spawn.origin[0],
      spawn.origin[1],
      spawn.origin[2]
    );
    GameInfo.player.xAngle = spawn.angles[2];
    GameInfo.player.yAngle = spawn.angles[1];

    GameInfo.player.switchWeapon(config.PLAYER_DEFAULT_WEAPON);
  }

  // Rotate the player when the mouse is moved
  static rotatePlayer(e) {
    let player = GameInfo.player;
    player.rotate(e.movementX, e.movementY);
  }

  async loadMap() {
    const mapName = this.getMap();

    return await download(`cstrike/maps/${mapName}`, 'arraybuffer');
  }

  async renderSky() {
    let skyname = GameInfo.map.mapData.entities[0].skyname;

    if (!skyname) {
      return;
    }

    const coords: { [name: string]: number[] } = {
      up: [0, 0],
      rt: [0, 256],
      dn: [0, 512],
      ft: [256, 0],
      lf: [256, 256],
      bk: [256, 512]
    };

    if (skyname === 'des') {
      skyname = 'Des';
    }

    const sides = ['bk', 'dn', 'ft', 'lf', 'rt', 'up'].map(
      a => `${skyname}${a}`
    );

    for (let side of sides) {
      const data: any = await download(
        `cstrike/gfx/env/${side}.tga`,
        'arraybuffer',
        true
      );

      TgaParser.parse(data);
    }
  }

  start(map: string) {
    // var peer = new Peer({key: (window as any).cs.peerJSApiKey});
    // var server = sessionStorage.getItem("server");
    // //Should we connect to a server?
    // if (server !== null) {
    //   //Yep. Connect to it
    //   var conn = peer.connect(server);
    //   conn.on("open", function() {
    //     conn.send("Hello, I am " + peer.id);
    //   });
    //   conn.on("error", function(err) {
    //     console.log(err);
    //   });
    // } else {
    //   //No server specified: We are the server
    //   peer.on("open", function() {
    //     console.log("Game server started with ID: " + peer.id);
    //   });
    //
    //   peer.on("error", function(err) {
    //     console.log("Error starting game server: " + err);
    //   });
    //
    //   peer.on("connection", function(conn) {
    //     conn.on("data", function(data){
    //       console.log(data);
    //     });
    //   });
    // }

    this.map = map;
    this.webGLStart();
  }
}
