# Counter-Strike JS

Counter-Strike 1.6 implementation in TypeScript utilizing state of the art browser APIs.

> _Used https://github.com/MathiasVP/CS as the base._

### Current state

- Parses and renders .bsp files (version 30) containing map data
- Parses and renders .mdl files (version 10) with textures
- Camera movement, yaw and pitch fully implemented
- Collision detection implemented
- Naive gravity implemented

### Develop

**_Please note: No actual data (maps, models, textures, etc.) is included in the project, due to copyright reasons!_**

- Copy `cstrike` folder from your `Counter-Strike` into root folder of this project

- Install dependencies

```
npm install
```

- Then start webpack

```
npm start
```

- Open [http://localhost:9000](http://localhost:9000)

![Screenshot](https://user-images.githubusercontent.com/3748453/50407004-1dbc1180-07cf-11e9-8976-7472bc17183d.jpg)
