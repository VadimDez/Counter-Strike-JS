// https://counterstrike.fandom.com/wiki/Counter-Strike

export class BuyMenu {
  static menu = [
    {
      name: 'Pistols',
      type: 'pistol',
      child: [
        { name: 'Glock-18', code: 'glock18', price: 400 },
        { name: 'H&K USP .45', code: 'usp', price: 500 },
        { name: '228 Compact', code: 'p228', price: 600 },
        { name: 'Desert Eagle', code: 'deagle', price: 650 },
        { name: 'Five-SeveN', code: 'fiveseven', price: 750 },
        { name: 'Dual Berettas', code: 'elite', price: 800 }
      ]
    },
    {
      name: 'Shotguns',
      type: 'primary',
      child: [
        { name: 'Benelli M3 Super90', code: 'm3', price: 1700 },
        { name: 'Benelli XM1014', code: 'xm1014', price: 3000 }
      ]
    },
    {
      name: 'Sub-Machine Guns',
      type: 'primary',
      child: [
        { name: 'Steyr Tactical Machine Pistol', code: 'tmp', price: 1250 },
        { name: 'Ingram MAC-10', code: 'mac10', price: 1400 },
        { name: 'H&K MP5-Navy', code: 'mp5', price: 1500 },
        { name: 'H&K UMP45', code: 'ump45', price: 1700 },
        { name: 'FN P90', code: 'p90', price: 2350 }
      ]
    },
    {
      name: 'Rifles',
      type: 'primary',
      child: [
        { name: 'Galil', code: 'galil', price: 2000 },
        { name: 'FAMAS', code: 'famas', price: 2250 },
        { name: 'AK-47', code: 'ak47', price: 2500 },
        { name: 'Maverick M4A1 Carbine', code: 'm4a1', price: 3100 },
        { name: 'Sig SG-552 Commando', code: 'sg552', price: 3500 },
        { name: 'Steyr Aug', code: 'aug', price: 3500 },
        { name: 'Steyr Scout', code: 'scout', price: 2750 },
        { name: 'Sig SG-550 Sniper', code: 'sg550', price: 4200 },
        { name: 'Magnum Sniper Rifle', code: 'awp', price: 4750 },
        { name: 'H&K G3/SG-1 Sniper Rifle', code: 'g3sg1', price: 5000 }
      ]
    },
    {
      name: 'Machine Gun',
      type: 'primary',
      child: [{ name: 'FN M249 Para', code: 'm249', price: 5750 }]
    },
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

      if (item) {
        this.onSelectItem({ code: item.code, type: primaryMenu.type });
      }
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
      $elem.appendChild(BuyMenu.createMenuRow(item, i++));
    });

    $elem.appendChild(BuyMenu.createCancelRow());
  }

  static createMenuRow(item: any, i: number) {
    const $div = document.createElement('div');
    const $name = document.createElement('span');
    $name.classList.add('name');

    let str = `${i}. ${item.name}`;
    $name.innerText = str;

    $div.appendChild($name);

    if (item.price) {
      const $price = document.createElement('span');
      $price.classList.add('price');
      $price.innerText = item.price;
      $div.appendChild($price);
    }

    return $div;
  }

  static createCancelRow() {
    const $div = document.createElement('div');
    const $name = document.createElement('span');
    $name.classList.add('name');
    $name.innerText = '0. Cancel';
    $div.appendChild($name);

    return $div;
  }
}
