// Data for defining tabs and button layouts and function...

var cncTabsData = {
    tabs: [
        {
            label: 'MAIN',
            buttons: [
                'home','','','','',
                'unlock','','','','',
                '','','','','',
                'reset','','','','unlock'
            ]
        },
        {
            label: 'MOVE',
            buttons: [
                'home','','','','',
                'center','xminus','','xplus','',
                '','','','','',
                '','','','','unlock'
            ]
        },
        {
            label: 'JOB',
            buttons: [
                '','','','','',
                '','','','','',
                '','','','','',
                '','','','',''
            ]
        },
        {
            label: 'TBD1',
            buttons: [
                '','','','','',
                '','','','','',
                '','','','','',
                '','','','',''
            ]
        },
        {
            label: 'TBD2',
            buttons: [
                '','','','','',
                '','','','','',
                '','','','','',
                '','','','',''
            ]
        },
        {
            label: 'TBD3',
            buttons: [
                '','','','','',
                '','','','','',
                '','','','','',
                '','','','',''
            ]
        }
    ],
    buttons: {
        center: {
            label: 'Center',
            action: 'gcode',
            gcode: 'G30'
        },
        home: {
            label: 'Home',
            img: '/images/house.png',
            action: 'gcode',
            gcode: '$H'
        },
        move: {
            label: 'MOVE',
            action: 'gcode',
            gcode: 'TBD'
        },
        reset: {
            label: 'RESET',
            action: 'port',
            state: 'close'
        },
        unlock: {
            label: 'Unlock',
            img: '/images/unlock.png',
            action: 'gcode',
            gcode: '$X'
        },
        xminus: {
            label: 'X-',
            action: 'gcode',
            gcode: '$X'
        },
        xplus: {
            label: 'X+',
            action: 'gcode',
            gcode: '$X'
        }

    }

};
