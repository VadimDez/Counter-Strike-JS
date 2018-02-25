Counter-Strike JS
==
Counter-Strike 1.6 implementation in JavaScript utilizing state of the art browser APIs.

*Uses https://github.com/MathiasVP/CS as the base.*

<b>Current state</b>
<ul>
<li>Parses and renders .bsp files (version 30) containing map data</li>
<li>Parses and renders .mdl files (version 10) with textures </li>
<li>Camera movement, yaw and pitch fully implemented</li>
<li>Collision detection implemented</li>
<li>Naive gravity implemented</li>
</ul>

<b>Hacking on the codebase</b><br />
<ul>
<li>A fully updated version of Chrome is recommended when hacking around in the code. (Firefox not yet supported)</li>
<li>When debugging locally use the Chrome flag: "--disable-web-security" so that Chrome can load data files from the local file system.</li>
</ul>

<b>Commiting changes</b><br />
<ul>
<li>Please note: No actual data (maps, models, textures, etc.) is included in the project, due to copyright reasons!</li>
</ul>

![Screenshot](http://i.imgur.com/9kMVte7.png)
