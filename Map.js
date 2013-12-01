/**
	This file abstracts the call to cs.MapParser and cs.MapRender into a single
	class that performs both actions.
**/

window.cs = window.cs || { };

cs.Map = function(gl, data) {
	var mapData = cs.MapParser.parse(data);
	var mapRender = new cs.MapRender(gl, mapData);
	
	this.mapData = mapData;
	/**
		Render the map as seen from the "pos" position
	**/
	this.render = function(pos) {
		return mapRender.render(pos);
	};
}