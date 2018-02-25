/**
 * Created by Vadym Yatsyuk on 25.02.18
 */

import { MapParser } from './MapParser';
import { MapRender } from './MapRender';

/**
 This file abstracts the call to cs.MapParser and cs.MapRender into a single
 class that performs both actions.
 **/


export const Map = function(gl: any, data: any) {
  var mapData = MapParser.parse(data);
  var mapRender = new MapRender(gl, mapData);
  this.mapData = mapData;

  /**
   Render the map as seen from the "pos" position
   **/
  this.render = function(pos: any) {
    return mapRender.render(pos);
  };
};