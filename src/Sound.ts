import { CONSTANTS } from './renderers/ModelRender';
export class Sound {
  static getSoundPath(event, modelData) {
    switch (event.event) {
      case CONSTANTS.EVENT_SOUND:
        return 'cstrike/sound/' + event.options;
      case CONSTANTS.EVENT_FIRE:
        const weapon = modelData.header.name;
        return (
          'cstrike/sound/weapons/' +
          weapon.substr(2, weapon.length - 6) +
          '-1.wav'
        );
      default:
        return null;
    }
  }

  static preloadSounds(modelData) {
    modelData.sequences.forEach(sequence => {
      sequence.events.forEach(event => {
        const path = Sound.getSoundPath(event, modelData);
        console.log(path);
        if (path) {
          createjs.Sound.registerSound(path, path);
        }
      });
    });
  }
}
