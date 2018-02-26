/**
 * Created by Vadym Yatsyuk on 25.02.18
 */

import { MapParser } from './MapParser';
import { MapRender } from './MapRender';

/**
 This file abstracts the call to cs.MapParser and cs.MapRender into a single
 class that performs both actions.
 **/


export class Map {
  mapData: any;
  mapRender: any;

  constructor(public gl: any, public data: any) {
    let mapData = MapParser.parse(data);
    this.mapRender = new MapRender(gl, mapData);
    this.mapData = mapData;
  }

  /**
   Render the map as seen from the "pos" position
   **/
  render(pos: any) {
    return this.mapRender.render(pos);
  }
}
