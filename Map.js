/**
	This file abstracts the call to cs.MapParser and cs.MapRender into a single
	class that performs both actions.
**/

define(["MapParser", "MapRender"], function(MapParser, MapRender) {
	return function(gl, data) {
		var mapData = MapParser.parse(data);
		var mapRender = new MapRender(gl, mapData);
		this.mapData = mapData;
		/**
			Render the map as seen from the "pos" position
		**/
		this.render = function(pos) {
			return mapRender.render(pos);
		};
	};
});