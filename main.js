requirejs.config({
	shim: {
        'lib/createjs': {
            exports: 'createjs'
        }
    }
});

require(["lib/gl-matrix", "Player", "util/download", "Map", "GameInfo", "config", "util/PointerLock"], function(glMatrix, Player, download, Map, GameInfo, config, PointerLock) {
		//Define namespace
		window.cs = window.cs || { };

		function initGL(canvas) {
			try {
				GameInfo.gl = canvas.getContext("experimental-webgl");
				GameInfo.gl.viewportWidth = canvas.width;
				GameInfo.gl.viewportHeight = canvas.height;
				
				GameInfo.gl.enable(gl.DEPTH_TEST);
				GameInfo.gl.enable(gl.CULL_FACE);
				GameInfo.gl.cullFace(gl.FRONT);
				
			} catch (e) { }
			if (!GameInfo.gl) {
				console.log("Could not initialise WebGL");
			}
		}
		
		function render() {
			var player = GameInfo.player;
			var gl = GameInfo.gl;
			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			glMatrix.mat4.perspective(GameInfo.pMatrix, config.FIELD_OF_VIEW*Math.PI/180,
				gl.viewportWidth / gl.viewportHeight,
				config.NEAR_CLIPPING, config.FAR_CLIPPING);
			
			glMatrix.mat4.identity(GameInfo.mvMatrix);
			glMatrix.mat4.rotateX(GameInfo.mvMatrix, GameInfo.mvMatrix, player.xAngle);
			glMatrix.mat4.rotateY(GameInfo.mvMatrix, GameInfo.mvMatrix, player.yAngle);
			
			//Move the player by moving the map in the reverse direction
			glMatrix.mat4.translate(GameInfo.mvMatrix, GameInfo.mvMatrix,
				[player.y, -player.z - config.PLAYER_HEIGHT, player.x]);
			
			GameInfo.map.render(player.position());
			
			glMatrix.mat4.identity(GameInfo.mvMatrix);
			
			//Draw player
			player.render();
		}
		
		function mainLoop() {
			requestAnimFrame(mainLoop);
			GameInfo.player.move();
			
			render();
		}
		
		function webGLStart() {
			var canvas = document.getElementById("canvas");
			initGL(canvas);
			var gl = GameInfo.gl;

			var mapName = "cs_assault.bsp"/*sessionStorage.getItem("map")*/;
			download("data/maps/" + mapName, "arraybuffer", function(data) {
				gl.clearColor(0.0, 0.0, 0.0, 1.0);
				
				//Parse map
				GameInfo.map = new Map(gl, data);
				GameInfo.player = new Player(gl, -496, 2352, 176);
				GameInfo.player.switchWeapon(config.PLAYER_DEFAULT_WEAPON);
				//Set event handler for resizing the screen every time
				//the window changes size
				var resizeCallback = function() {
					canvas.width = window.innerWidth;
					canvas.height = window.innerHeight;
					gl.viewportWidth = window.innerWidth;
					gl.viewportHeight = window.innerHeight;
				};
				resizeCallback();
				window.addEventListener("resize", resizeCallback, false);
						
				//Listen for clicks on the canvas
				canvas.addEventListener("click", function() {
					//is the mouse not currently locked?
					if(!PointerLock.pointerLockElement()) {
						//Nope. Request locking
						PointerLock.requestPointerLock(canvas);
					}
				}, false);
						
				//Listen for pointer locking
				PointerLock.addPointerLockExchangeEventListener(document, function(e) {
					//Did the pointer just go from unlocked to locked?
					if(!!PointerLock.pointerLockElement()) {
						//Yep! Add mousemove listener
						PointerLock.addMouseMoveEventListener(document, rotatePlayer, false);
					}
					else { //Nope. Remove mouse move listener
						PointerLock.removeMouseMoveEventListener(document, rotatePlayer);
					}
				}, false);

				mainLoop();
			});
		}
		
		//Rotate the player when the mouse is moved
		function rotatePlayer(e) {
			var player = GameInfo.player;
			player.rotate(e.movementX, e.movementY);
		}
		
		function start() {
			var peer = new Peer({key: cs.peerJSApiKey});
			var server = sessionStorage.getItem("server");
			//Should we connect to a server?
			if(server !== null) {
				//Yep. Connect to it
				var conn = peer.connect(server);
				conn.on("open", function() {
					conn.send("Hello, I am " + peer.id);
				});
				conn.on("error", function(err) {
					console.log(err);
				});
			}
			else {
				//No server specified: We are the server
				peer.on("open", function() {
					console.log("Game server started with ID: " + peer.id);
				});
				
				peer.on("error", function(err) {
					console.log("Error starting game server: " + err);
				});
				
				peer.on("connection", function(conn) {
					conn.on("data", function(data){
						console.log(data);
					});
				});
			}
			
			webGLStart();
		}
	start();
});