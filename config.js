/**
	This file contains all configuration settings for the engine
**/

window.cs = window.cs || { };

cs.config = {
	MAP_PATH: "data/maps/cs_assault.bsp",
	PLAYER_PATH: "data/models/player/arctic/arctic.mdl",
	PLAYER_DEFAULT_WEAPON: "ak47",
	NEAR_CLIPPING: 0.1,
	FAR_CLIPPING: 10000.0,
	FIELD_OF_VIEW: 59.0, //In degrees
	PLAYER_HEIGHT: 17,
	GRAVITY: 12,
	//How much the player can change his Z position without a jump.
	MAX_Z_CHANGE: 17,
	//The factor multiplied to the delta x and delta y of the mouse movement
	MOUSE_SENSITIVITY: 0.0025
};