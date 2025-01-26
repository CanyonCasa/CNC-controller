# CNC-controller

#### *Keywords*
Raspberry Pi, CNC, offline, controller, gcode, sender, grbl

#### *Abstract*
RPi-based offline CNC controller supporting Grbl 1.1 designed around a 5" (800x480 pixel) touch screen. The design implements a NodeJS web server running on the localhost (RPi) accessed from a browser running in kiosk mode. It utilizes vanilla HTML, CSS, JavaScript, and Vue3 with no dependencies aside from the node websocket library, simplifying modification and maintenance, customization. Use of a data model config file allow straightforward customization of all screen views (tabs). Use of a Websocket interface provides direct connection to a backend serial port (USB) enabling passing gcode from the web browser directly to the CNC machine. A second websocket provides access to files from multiple local, remote, and USB sources.

## <span style="color: red; font-weight: bold">NOTICE</span>
<span style="color: red;">This design assumes operation on a local network to simplify user access (i.e no credentials or certificate management).
**As such the controller should not be operated on the open Internet.**</span>

## SERVER
The [server/bin] cnc.js file, with various other libs, implements a NodeJS-based websever with WEbsockets. The server does not require any code modification for use, just proper definition of the[server/restricted] config.js file that provides all the setup needed to run. Before use install NodeJS and the NodeJS dependencies from the server/bin folder

```JavaScript
\>npm  install serialport
\>npm  install ws
```
To start the server simply run:

```JavaScript
\>node \<path-to-bin\>/cnc [../restricted/config.js]
```
<span style="color: aqua;">NOTE: This assumes the default location of the config file. The config.js file should not be under the root documents folder.</span>

Note, the server config file.

<span style="color: aqua;">Tip: Run the server in a TMUX pane to have it stay running after logging out of the RPi.</span>

## CLIENT
A basic HTML5 page with supporting scripts and a stylesheet serves as the client. The client uses (unbundled) Vue3 for building site page content based on the HTML template (index.html) and data provided in the client configuration file (cncModelData.js)

### Views
All views consist of a tab menu, button layout, status area, and optional overlays. Layout assumes a fixed 800x480 pixel screen, easily adjusted by CSS changes alone. The color theme may be changed also by simply changing variable definitions in the CSS file.

### Client Configuration Data
The client configuration file (cncModelData.js) has 4 main parts each described below:
  - parameters
  - tabs
  - buttons
  - macros

#### Parameters
The parameters section defines variables used in defining layout, parsing actions and fields, machine specific details, and and general program functions.

#### Tabs
Each view is referenced as a tab, which aggregates like functions. The layout fixes the number of tabs at 5; however, this could be adjusted based on user preferences. Each tab can have the following properties:
  - **label**: This defines the text dsiplayed for the label.
  - **buttons**: This defines the reference for buttons displayed on the tab. This has two forms:
    1. A simple one dimensional array that sequentially lists the keys, where an empty field ('') skips a given position. The shift property must not be defined for this form.
    2. A two dimensional array, where each outer element is a button layout. This form requires the presence of the shift property  which determines the set of buttons displayed.
  - **view**: This property selects an alternate view for the button layout, default "buttons" when not defined. The defined CMD tab uses "keyboard" view.
  - **overlay**: Specifies the name of any overlay shown on top of the layout for the specific tab.
  - **shift**: When defined, this property represents the index of the nested buttons array to select which set of buttons to display. 

#### Buttons
The buttons object defines the properties of each button. Values specified in the tabs button definition represent the lookup keys for each button. Buttons have the following properties.
  - **label**: Text displayed on the button if no img property present.
  - **img**: Image displayed on the button, which takes precedence over label.
  - **action**: Code action taken by the button when clicked. In addition to the action, each button generally includes a property referenced by the action. For example, action: 'gcode' will require an additional "gcode" property. Each action may have additional action specific properties. Actions are outlined below with included properties :
    - **action: 'gcode'**
      - 'gcode': Defines a string of gcode to execute. The gcode string represents a JavaScript string literal template allowing for parameter value substitution (from the parameter variable). Multi-line commands may by defined by comma separated fields; however, the resolved line cannot exceed buffer size (128) as no streaming is provided.
    - **action: 'param'**
      - 'param': References the name of the parameter in params to be changed. Either value or template must be defined
      - 'value': New fixed value for the parameter.
      - 'template': Defines a JavaScript string literal template allowing for parameter value substitution for determining the new parameter value.
    - **action: 'macro'**
      - 'macro': May be a string referencing a macro from the macro definitions OR an array of objects specifying the actions and properties to take. A macro is analogous to a series of button presses.
    - **action: 'reset'**
      - Has no properties; used to send a CTRL-X character to the CNC to perform a soft-reset.
    - **action: 'wait'**
      - 'wait': For macros, wait pecifies a delay time in milliseconds before executing the next action.
    - **action: 'call'**
      - 'call': Names an internal function called by the action.
      - 'args': An array of arguments passed to the function.
    - **action: 'key'**
      - 'key': Defines the character for a key pressed (i.e. command keypad), including 2 special cases of 'enter' for the newline key and 'bksp' for backspace. Keystokes define the value of the commandline on the CMD tab.
    - **action: 'shift'**
      - Has no properties; signals the shifting of button layout cycling through all defined arrangements.

#### Macros
For organizational puposes. The optional macros section defines a set of macros referenced by buttons, where each macro key defines the reference used by a button and its value defines an array of objects with each object representing the equivalent of a button press.
