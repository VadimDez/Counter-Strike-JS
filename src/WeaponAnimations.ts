const pistols = {
  glock18: [
    {
      idle: 0,
      shoot: [5],
      reload: 7,
      draw: [8],
      special: [1]
    },
    {
      idle: 0,
      shoot: [4],
      reload: 12,
      draw: [11],
      special: [2]
    }
  ],
  usp: [
    {
      idle: 8,
      shoot: [9],
      reload: 13,
      draw: [14],
      special: [7, 0]
    },
    {
      idle: 0,
      shoot: [1],
      reload: 5,
      draw: [6],
      special: [15, 8]
    }
  ],
  p228: [
    {
      idle: 0,
      shoot: [1, 2, 3],
      reload: 5,
      draw: [6]
    }
  ],
  deagle: [
    {
      idle: 0,
      shoot: [1, 2],
      reload: 4,
      draw: [5]
    }
  ],
  fiveseven: [
    {
      idle: 0,
      shoot: [1, 2],
      reload: 4,
      draw: [5]
    }
  ],
  elite: [
    {
      idle: 0,
      shoot: [2, 3, 4, 5, 6],
      reload: 14,
      draw: [15]
    },
    {
      idle: 0,
      shoot: [8, 9, 10, 11, 12],
      reload: 14,
      draw: [15]
    }
  ]
};

const shotguns = {
  m3: [
    {
      idle: 0,
      shoot: [1, 2],
      reload: [5, 3, 4],
      draw: [6]
    }
  ],
  xm1014: [
    {
      idle: 0,
      shoot: [1, 2],
      reload: [5, 3, 4],
      draw: [6]
    }
  ]
};

const subMachineGuns = {
  tmp: [
    {
      idle: 0,
      shoot: [3, 4, 5],
      reload: [1],
      draw: [2]
    }
  ],
  mac10: [
    {
      idle: 0,
      shoot: [3, 4, 5],
      reload: [1],
      draw: [2]
    }
  ],
  mp5: [
    {
      idle: 0,
      shoot: [3, 4, 5],
      reload: [1],
      draw: [2]
    }
  ],
  ump45: [
    {
      idle: 0,
      shoot: [3, 4, 5],
      reload: [1],
      draw: [2]
    }
  ],
  p90: [
    {
      idle: 0,
      shoot: [3, 4, 5],
      reload: [1],
      draw: [2]
    }
  ]
};

const machineGun = {
  m249: [
    {
      idle: 0,
      shoot: [1, 2],
      reload: [3],
      draw: [4]
    }
  ]
};

const rifles = {
  galil: [
    {
      idle: 0,
      shoot: [3, 4, 5],
      reload: [1],
      draw: [2]
    }
  ],
  famas: [
    {
      idle: 0,
      shoot: [3, 4, 5],
      reload: [1],
      draw: [2]
    }
  ],
  ak47: [
    {
      idle: 0,
      shoot: [3, 4, 5],
      reload: 1,
      draw: 2
    }
  ],
  m4a1: [
    {
      idle: 7,
      shoot: [8, 9, 10],
      reload: [11],
      draw: [12],
      special: [6]
    },
    {
      idle: 0,
      shoot: [1, 2, 3],
      reload: [4],
      draw: [5],
      special: [13]
    }
  ],
  sg552: [
    {
      idle: 0,
      shoot: [3, 4, 5],
      reload: [1],
      draw: [2]
    }
  ],
  aug: [
    {
      idle: 0,
      shoot: [3, 4, 5],
      reload: [1],
      draw: [2]
    }
  ],
  scout: [
    {
      idle: 0,
      shoot: [1, 2],
      reload: [3],
      draw: [4]
    }
  ],
  sg550: [
    {
      idle: 0,
      shoot: [1, 2],
      reload: [3],
      draw: [4]
    }
  ],
  awp: [
    {
      idle: 0,
      shoot: [1, 2, 3],
      reload: [4],
      draw: [5]
    }
  ],
  g3sg1: [
    {
      idle: 0,
      shoot: [1, 2],
      reload: [3],
      draw: [4]
    }
  ]
};

export const WeaponAnimations = {
  knife: [
    {
      idle: 0,
      shoot: 6,
      special: 5,
      draw: [3]
    }
  ],
  ...shotguns,

  ...subMachineGuns,

  ...pistols,

  ...machineGun,

  ...rifles,

  hegrenade: [
    {
      idle: 0,
      shoot: 1,
      afterShoot: 4,
      draw: 3
    }
  ],
  c4: [
    {
      idle: 0,
      shoot: 3,
      afterShoot: 2,
      draw: 1
    }
  ]
};
