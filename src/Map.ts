/**
 * Created by Vadym Yatsyuk on 25.02.18
 */

import { MapParser } from './parsers/MapParser';
import { MapRender } from './renderers/MapRender';

/**
 This file abstracts the call to cs.MapParser and cs.MapRender into a single
 class that performs both actions.
 **/

export class Map {
  mapData: any;
  mapRender: MapRender;

  constructor(public gl: any, public bspData: any) {
    this.mapData = MapParser.parse(bspData);
    this.mapRender = new MapRender(gl, this.mapData);
  }

  getSpawn() {
    const r = Math.floor(Math.random() * 2);

    if (r) {
      const ctSpawn = this.mapData.entities.filter(
        o => o.classname === 'info_player_start'
      );
      return ctSpawn[Math.floor(Math.random() * (ctSpawn.length + 1))];
    }
    const tSpawn = this.mapData.entities.filter(
      o => o.classname === 'info_player_deathmatch'
    );
    return tSpawn[Math.floor(Math.random() * (tSpawn.length + 1))];
  }

  /**
   Render the map as seen from the "pos" position
   **/
  render(pos: any) {
    return this.mapRender.render(pos);
  }
}
