/**
	This file provides high level mechanisms for mouse event listeners
	as well as abstracting away browser differences.
**/

var MouseJS = (function() {
	
	//Index 1 is left, 2 is middle and 3 is right
	var downListeners = [[], [], []];
	var upListeners = [[], [], []];
	
	var upListener = function(e) {
		if(!PointerLock.pointerLockElement()) return;
		upListeners[e.which-1].forEach(function(callback) {
			callback(e);
		});
	};
	
	var downListener = function(e) {
		if(!PointerLock.pointerLockElement()) return;
		downListeners[e.which-1].forEach(function(callback) {
			callback(e);
		});
	};
	
	document.addEventListener("mousedown", downListener, false);
	document.addEventListener("mouseup", upListener, false);

	var stringToWhich = {
		left: 0,
		middle: 1,
		right: 2
	};
	
	return {
		//"left", "right" or "middle"
		on: function(which, down, up) {
			downListeners[stringToWhich[which]].push(down);
			upListeners[stringToWhich[which]].push(up);
		}
	};
})();