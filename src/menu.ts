/**
 * Created by Vadym Yatsyuk on 25.02.18
 */
import { Main } from './main';

export class Menu {
  static openMenu(element: string) {
    let menu = document.getElementById(element);
    let menuHeight = screen.height / 2;
    let menuWidth = screen.width / 4.2;

    menu.style.height = `${ menuHeight }px`;
    menu.style.width = `${ menuWidth }px`;
    menu.style.marginTop = `-${ (menuHeight / 2).toString() }px`;
    menu.style.marginLeft = `-${ (menuWidth / 2).toString() }px`;
    menu.style.visibility = 'visible';
  }

  static closePopupMenu(element: string) {
    let menu = document.getElementById(element);
    menu.style.visibility = 'hidden';
  }

  static startGame() {
    let e: any = document.getElementById('dropDownMapMenu');
    let map = e.options[e.selectedIndex].value;

    sessionStorage.setItem('map', map);
    console.log(sessionStorage.getItem('map'));
    let main = new Main();
    main.start();
  }

  static joinGame() {
    let server = (document.getElementById('server') as any).value;
    sessionStorage.setItem('server', server);
    let main = new Main();
    main.start();
  }
}