/**
	This file adds collision detection functionality to the game engine
	The logic has been ported from the Quake 1 engine
**/
// import { vec3 } from 'gl-matrix';
import * as glMatrix from '../lib/gl-matrix';
const vec3 = glMatrix.vec3;
import { MapParser } from './MapParser';
import { GameInfo } from './GameInfo';

var samePosition = function(vStart, vEnd) {
	return vStart[0] === vEnd[0] &&
		vStart[1] === vEnd[1] &&
		vStart[2] === vEnd[2];
};

var trace = function(vStart, vEnd, shouldSlide) {
	var mapData = GameInfo.map.mapData;
	//No need to do anything if no movement is required
	if(samePosition(vStart, vEnd)) {
		return vEnd;
	}

	var traceObj = {
		plane: <any>{},
		allSolid: true,
		ratio: 1.0 //How far we got before colliding with anything
	};
	//models[0] is the geometry of the entire map
	recursiveHullCheck(mapData.models[0].iHeadNodes[0], 0, 1,
		vStart, vEnd, traceObj);

	//If ratio is still 1 we never collided with anything
	if(traceObj.ratio === 1.0) {
		return vEnd;
	}
	//Collision found
	//Calculate how far we got before colliding using the following
	//formula:
	//vNewPosition = vStart + (vEnd - vStart)*ratio
	var vDelta = vec3.create();
	vec3.sub(vDelta, vEnd, vStart);
	var vNewPosition = vec3.create();
	vec3.scaleAndAdd(vNewPosition, vStart, vDelta, traceObj.ratio);

	//Calculate how much we still need to move
	var vMove = vec3.create();
	vec3.sub(vMove, vEnd, vNewPosition);

	if(!shouldSlide) {
		return vNewPosition;
	}

	//We now calculate how much the player should "slide"
	//i.e when hitting a wall we don't completely stop, but rather slide
	//along the wall
	var distance = vec3.dot(vMove, traceObj.plane.vNormal);
	var vEndPosition = [
		vEnd[0] - traceObj.plane.vNormal[0] * distance,
		vEnd[1] - traceObj.plane.vNormal[1] * distance,
		vEnd[2] - traceObj.plane.vNormal[2] * distance
	];

	//Make sure we don't collide with anything else from the new positions
	return trace(vNewPosition, vEndPosition, true);
};

var recursiveHullCheck = function(iNode, p1f, p2f, p1, p2, traceObj) {
	var mapData = GameInfo.map.mapData;
	if(iNode < 0) {
		if(iNode != MapParser.constants.CONTENTS_SOLID) {
			traceObj.allSolid = false;
		}
		return true;
	}
	//Get possible collision plane
	var node = mapData.clipNodes[iNode];
	var plane = mapData.planes.planes[node.iPlane];
	//Get normal of plane
	var vNormal = [
		mapData.planes.normals[3*node.iPlane],
		mapData.planes.normals[3*node.iPlane + 1],
		mapData.planes.normals[3*node.iPlane + 2]
	];

	var t1, t2;

	//If the plane is perpendicular to either the X, Y, or Z axis
	if(plane.type < 3) {
		t1 = p1[plane.type] - plane.distance;
		t2 = p2[plane.type] - plane.distance;
	}
	else {
		//Not perpendicular to any axis
		t1 = vec3.dot(vNormal, p1) - plane.distance;
		t2 = vec3.dot(vNormal, p2) - plane.distance;
	}

	if(t1 >= 0 && t2 >= 0) {
		return recursiveHullCheck(node.iChildren[0], p1f, p2f, p1, p2,
			traceObj);
	}
	if(t1 < 0 && t2 < 0) {
		return recursiveHullCheck(node.iChildren[1], p1f, p2f, p1, p2,
			traceObj);
	}

	var epsilon = 0.03125 // 1/32

	var frac;
	if (t1 < 0) {
		frac = (t1 + epsilon)/(t1-t2);
	}
	else {
		frac = (t1 - epsilon)/(t1-t2);
	}
	if (frac < 0) {
		frac = 0;
	}
	if (frac > 1) {
		frac = 1;
	}

	var mid = p1f + (p2f - p1f)*frac;
	var vMid = vec3.fromValues(
		p1[0] + frac*(p2[0] - p1[0]),
		p1[1] + frac*(p2[1] - p1[1]),
		p1[2] + frac*(p2[2] - p1[2])
	);
	var side = t1 < 0 ? 1 : 0;

	if(!recursiveHullCheck(node.iChildren[side], p1f, mid, p1, vMid,
		traceObj)) {
			return false;
	}

	var otherSide = side ^ 1;
	if(!hullPointContentIsSolid(node.iChildren[otherSide], vMid)) {
		return recursiveHullCheck(node.iChildren[otherSide], mid, p2f,
			vMid, p2, traceObj);
	}

	//Check if we ever got out of the solid area
	if(traceObj.allSolid) {
		return false;
	}

	if(side == 0) {
		traceObj.plane.vNormal = Array(3);
		traceObj.plane.vNormal[0] = vNormal[0];
		traceObj.plane.vNormal[1] = vNormal[1];
		traceObj.plane.vNormal[2] = vNormal[2];

		traceObj.plane.distance = plane.distance;
		traceObj.plane.type = plane.type;
	}
	else {
		var negvNormal = vec3.create();
		vec3.negate(negvNormal, vNormal);
		traceObj.plane.vNormal = negvNormal;
		traceObj.plane.distance = -plane.distance;
	}

	//While were at a solid area
	while(hullPointContentIsSolid(mapData.models[0].iHeadNodes[0], vMid)) {
		//Go back a bit
		frac -= 0.1;
		//If we hit 0 we can't go any further
		if(frac < 0) {
			traceObj.ratio = mid;
			return false;
		}
		//We could go further, calculate new ratio of how far we went
		mid = p1f + (p2f - p1f)*frac;
		var vDelta = vec3.create();
		vec3.sub(vDelta, p2, p1);
		vec3.scaleAndAdd(vMid, p1, vDelta, frac);
	}

	//Store how far we were able to go
	traceObj.ratio = mid;
	return false;
};

//Check whether the point p is a solid or not
var hullPointContentIsSolid = function(iNode, p) {
	var mapData = GameInfo.map.mapData;

	while(iNode >= 0) {
		var node = mapData.clipNodes[iNode];
		var plane = mapData.planes.planes[node.iPlane];
		var vNormal = [
			mapData.planes.normals[3*node.iPlane],
			mapData.planes.normals[3*node.iPlane + 1],
			mapData.planes.normals[3*node.iPlane + 2]
		];

		var d = vec3.dot(vNormal, p) - plane.distance;

		if(d < 0) {
			iNode = node.iChildren[1];
		}
		else {
			iNode = node.iChildren[0];
		}
	}

	return iNode == MapParser.constants.CONTENTS_SOLID;
};

export const CollisionDetection = {
	move: function(vStart, vEnd) {
		return trace(vStart, vEnd, true);
	},

	isOnGround: function(pos) {
		var x = pos[0];
		var y = pos[1];
		var z = pos[2];
		var t = trace(pos, [x, y, z-1], false);
		return Math.abs(t[2] - z) < 0.000001;
	}
};
