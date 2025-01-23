# CNC-controller

#### *Keywords*
Raspberry Pi, CNC, offline, controller, gcode, sender

#### *Abstract*
RPi-based offline CNC controller designed around a 5" (800x480 pixel) touch screen. The design implements   
a NodeJS web server running on the localhost (RPi) accessed from a browser running in kiosk mode.
It utilizes vanilla HTML, CSS, JavaScript, and Vue3 with no dependencies aside from the node websocket library, 
making modification very easy. All screen "tabs" allow user customization through a data model config file.
Use of a Websocket interface allows connection directly to a backend serial port (USB) enabling passing gcode
from the web browser directly to the CNC machine. A second websocket provides access to files from local, remote, 
and USB sources.


## <span style="color: red; font-weight: bold">NOTICE</span>
<span style="color: red;">This design assumes operation on a local network to simplify user access (i.e no credentials or certificate management).
**As such the controller should not be operated on the open Internet.**</span>

## SERVER
The [server/bin] cnc.js file, with various other libs, implements a NodeJS-based websever with WEbsockets. The [server/restricted] config.js file provides all the setup needed to run. before use install NodeJS and the NodeJS dependencies from the server/bin folder

```JavaScript
\>npm  install serialport
\>npm  install ws
```
To start the server simply run:

```JavaScript
\>node \<path-to-bin\>/cnc [../restricted/config.js]
```

<span style="color: aqua;">NOTE: This assumes the default location of the config file. The config.js file should not be under the root documents folder.</span>

<span style="color: aqua;">Tip: Run the server in a TM"UX pane to have it stay running after logging out of the RPi,</span>

## CLIENT

