export class BuyMenu {
  static menu = [
    {
      name: 'Pistols',
      type: 'pistol',
      child: [
        { name: 'Glock-18', code: 'glock18', price: 400 },
        { name: 'H&K USP .45', code: 'usp', price: 500 },
        { name: '228 Compact', price: 600 },
        { name: 'Desert Eagle', price: 650 },
        { name: 'Five-SeveN', price: 750 },
        { name: 'Dual Berettas', price: 800 }
      ]
    },
    { name: 'Shotguns', child: {} },
    { name: 'Sub-Machine Guns', child: {} },
    { name: 'Rifles', child: {} },
    { name: 'Machine Gun', child: {} },
    { name: 'Primary Ammo', child: {} },
    { name: 'Secondary Ammo', child: {} },
    { name: 'Equipments', child: {} }
  ];

  static getMenuElement(): HTMLDivElement {
    return document.querySelector('#buy-menu');
  }

  static getItemsContainerElement(): HTMLDivElement {
    return document.querySelector('#buy-menu-container');
  }

  static showMenu() {
    BuyMenu.getMenuElement().style.display = 'flex';
  }

  static hideMenu() {
    BuyMenu.getMenuElement().style.display = 'none';
  }

  static clearMenu() {
    const div = BuyMenu.getItemsContainerElement();
    while (div.firstChild) {
      div.removeChild(div.firstChild);
    }
  }

  static showBuyMenu() {
    BuyMenu.clearMenu();
    this.setTitle('Buy Item');
    this.renderMenu(BuyMenu.menu);
    BuyMenu.showMenu();
  }

  constructor(public onSelectItem: Function = null) {}

  public selectMenu(selected: number[]) {
    BuyMenu.clearMenu();
    const primaryMenu = BuyMenu.menu[selected[0]];

    if (selected.length === 1) {
      BuyMenu.setTitle(primaryMenu.name);

      BuyMenu.renderMenu(primaryMenu.child as any[]);
    } else {
      const item = this.getItem(selected);

      this.onSelectItem({ code: item.code, type: primaryMenu.type });
    }
  }

  getItem(selected) {
    return BuyMenu.menu[selected[0]].child[selected[1]];
  }

  static setTitle(title: string) {
    const $div = document.createElement('div');
    $div.classList.add('buy-menu__title');
    $div.textContent = title;
    BuyMenu.getItemsContainerElement().appendChild($div);
  }

  static renderMenu(menu: any[]) {
    const $elem = BuyMenu.getItemsContainerElement();
    let i = 1;

    menu.forEach(item => {
      const $div = document.createElement('div');
      let str = `${i}. ${item.name}`;
      $div.innerText = str;
      i++;

      $elem.appendChild($div);
    });
  }
}
