/**
 * Created by Vadym Yatsyuk on 25.02.18
 */
import { Main } from './main';

export class Menu {
  static maps = [
    'cs_assault.bsp',
    'cs_italy.bsp',
    'de_aztec.bsp',
    'de_dust2.bsp',
    'de_nuke.bsp',
    'de_inferno.bsp'
  ];

  static openMenu(element: string) {
    let menu = document.getElementById(element);
    let menuHeight = screen.height / 2;
    let menuWidth = screen.width / 4.2;

    menu.style.height = `${menuHeight}px`;
    menu.style.width = `${menuWidth}px`;
    menu.style.marginTop = `-${(menuHeight / 2).toString()}px`;
    menu.style.marginLeft = `-${(menuWidth / 2).toString()}px`;
    menu.style.visibility = 'visible';
  }

  static closePopupMenu(element: string) {
    let menu = document.getElementById(element);
    menu.style.visibility = 'hidden';
  }

  static getRandomMap() {
    const index = Math.floor(Math.random() * (Menu.maps.length + 1));

    return Menu.maps[index];
  }

  static getMap(): string {
    let $dropdown: any = document.getElementById('dropDownMapMenu');
    let mapValue = $dropdown.options[$dropdown.selectedIndex].value;

    return mapValue || Menu.getRandomMap();
  }

  static startGame() {
    let main = new Main();
    main.start('de_dust2.bsp' || Menu.getMap());
  }

  static joinGame() {
    let server = (document.getElementById('server') as any).value;
    sessionStorage.setItem('server', server);
    let main = new Main();
    main.start(Menu.getRandomMap());
  }
}
