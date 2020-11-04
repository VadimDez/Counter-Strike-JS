/**
 * Created by Vadym Yatsyuk on 25.02.18
 */
import { Menu } from './menu';
import '../styles.scss';
import '../stylesmenu.scss';

(function() {
  function init() {
    let $newGame = document.querySelector('.new-game');
    let $joinServer = document.querySelector('.join-server');

    if ($newGame && $joinServer) {
      $newGame.addEventListener('click', (e: Event) => {
        e.preventDefault();
        startGameMenu();
      });

      $joinServer.addEventListener('click', (e: Event) => {
        e.preventDefault();
        joinGameMenu();
      });
    }
  }

  function startGameMenu() {
    const MENU = 'newGameMenu';
    Menu.openMenu(MENU);

    let $startGame = document.querySelector('.menu-start-game');
    let $cancel = document.querySelector('.menu-cancel');

    $startGame.addEventListener('click', () => {
      let $mainMenu: HTMLDivElement = document.querySelector('.main-menu');
      let $canvas: HTMLDivElement = document.querySelector('#canvas');
      $mainMenu.style.display = 'none';
      $canvas.style.display = 'block';

      Menu.startGame();
    });

    $cancel.addEventListener('click', () => {
      Menu.closePopupMenu(MENU);
    });
  }

  function joinGameMenu() {
    const MENU = 'joinGameMenu';
    Menu.openMenu(MENU);

    const $joinGame = document.querySelector('.join-game-button');
    const $cancel = document.querySelector('.cancel-join-button');

    $joinGame.addEventListener('click', () => {
      Menu.joinGame();
    });

    $cancel.addEventListener('click', () => {
      Menu.closePopupMenu(MENU);
    });
  }

  init();

  // Menu.startGame();
})();
