// Data for defining tabs and button layouts and function...

let verbose = true; // for all console logging and transcripting

var cncModelData = {
    params: {
        autoQuery: 'query', // false or name of query button, i.e. gcode=?
        gCodeInit: '$H; G54; G21',
        feed: 1000,
        feedMax: 2000,
        jog: 3,
        jogs: [0.01,0.1,1,10,100],
        spindleDirection: 'M3',
        spindleMotor: 'M5',
        spindleSpeed: 10000,
        spindleSpeedMax: 10000,
        zProbeOffset: 19.15,
        alarm: '',
        bf: '',
        error: '',
        fs: '',
        mpos: '-,-,-',
        msg: '',
        state: '',
        units: 'mm',
        wco: '-,-,-',
        file: {
            pseudo: '',
            folder: '',
            name: '',
            size: 0,
            lines: 0,
            time: '',
            date: '',
            type: '',
            root: '',
            contents: ''
        },
        fileOverlayTemplates: [
            "File: ${pseudo}","${size}/${lines}","${date}",
            "","",""
        ],
        filesLocal: {
            root: 'local',
            label: '(local:)',
            folder: '',
            accept: '',
        },
        filesRemote: {
            root: 'remote',
            label: '(remote:)',
            folder: '',
            accept: '.nc'
        },
        filesUSB: {
            root: 'usb',
            label: '(USB:)',
            folder: '',
            accept: '.nc'
        },
        statusTemplates: [
            "M: ${mpos}","WS: ${wsEnabled?'OPEN':'CLSD'}","J: ${jogs[jog]}${units}","MX: ${spindleMotor==='M5'?'OFF':'ON'}",
            "W: ${wco}","S: ${spindleSpeed}","F: ${feed}","D: ${spindleDirection==='M4'?'CCW':'CW'}",
            "${msg}","${state}","A: ${alarm}","E: ${error}"
        ],
        transcriptLength: 100,
        wsEnabled: true
    },
    tabs: [
        {
            label: 'JOB',
            buttons: [
                'home','log','filesL','filesR','filesU',
                'unlock','query','','','',
                'reset','check','resume','run','pause',
                '','','','',''
            ],
            overlay: 'file'
        },
        {
            label: 'MOVE',
            buttons: [
                'home','yplus','zplus','','setx',
                'xminus','alt','xplus','','sety',
                'zminus','yminus','jinc','','setz',
                'unlock','reset','jdec','zprobe','setxyz'
            ]
        },
        {
            label: 'SPINDLE',
            buttons: [
                'moff','m10','m25','m50','m100',
                'mon','mcw','mccw','','',
                '','','','','',
                'unlock','reset','','',''
            ]
        },
        {
            label: 'CMD',
            view: 'keyboard',
            buttons: [
                [
                    '','X','Y','Z','G','7','8','9','shft',
                    '','M','L','P','#','4','5','6','$',
                    '','H','J','','','1','2','3','',
                    '','C','S','F',' ','-','0','.','=',
                    '','','','','','','','bksp','enter' // note first 6 slots overlayed by commandline
                ],
                [
                    '','','','','','7','8','9','shft',
                    '','','','','','4','5','6','$',
                    '','','','','','1','2','3','',
                    '','','','',' ','-','0','.','=',
                    '','','','','','','','bksp','enter' // note first 6 slots overlayed by commandline
                ]
            ],
            shift: 0,
            overlay: 'cmd'
        },
        {
            label: '',
            buttons: [
                '','','','','',
                '','','','','',
                '','','','','',
                '','','','',''
            ]
        },
        {
            label: 'SETTINGS',
            buttons: [
                'home','','setHome','setAlt','',
                'unlock','','','','',
                'query','machine','','','',
                'reset','','test','','ws'
            ]
        }
    ],
    buttons: {
        alt: {
            label: 'Alt Pos',
            img: '/images/center.png',
            title: 'Goto Alternate Position',
            action: 'gcode',
            gcode: 'G30 ?'
        },
        bksp: {
            label: 'BKSP',
            img: '/images/bksp.png',
            action: 'key',
            key: 'bksp'
        },
        check: {
            label: 'CHECK',
            action: 'gcode',
            gcode: '$C'
        },
        enter: {
            label: 'Enter',
            img: '/images/enter.png',
            action: 'key',
            key: 'enter'
        },
        filesL: {
            label: 'File...<br>(local)',
            action: 'call',
            call: 'filesDialog',
            args: ['filesLocal']
        },
        filesR: {
            label: 'File...<br>(remote)',
            action: 'call',
            call: 'filesDialog',
            args: ['filesRemote']
        },
        filesU: {
            label: 'File...<br>(USB)',
            action: 'call',
            call: 'filesDialog',
            args: ['filesUSB']
        },
        home: {
            label: 'Home',
            img: '/images/house.png',
            title: 'Home',
            action: 'gcode',
            gcode: '$H ?'
        },
        jdec: {
            label: 'JOG<br>LESS',
            action: 'param',
            param: 'jog',
            //template: '${(Number(jog)-1+jogs.length)%jogs.length}'    // wrap around
            template: '${Math.max(0,Number(jog)-1)}'                    // no wrap around
        },
        jinc: {
            label: 'JOG<br>MORE',
            action: 'param',
            param: 'jog',
            //template: '${(Number(jog)+1)%jogs.length}'                // wrap around
            template: '${Math.min(Number(jog)+1,jogs.length-1)}'        // no wrap around
        },
        log: {
            label: 'GCODE<br>LOG',
            action: 'call',
            call: 'popup',
            args: ['info','log']
        },
        machine: {
            label: 'CNC<br>REPORT',
            action: 'macro',
            macro: 'machine'
         },
        mcw: {
            disabled: true,
            label: 'FORWARD',
            action: 'param',
            param: 'spindleDirection',
            value: 'M3'
        },
        mccw: {
            disabled: true,
            label: 'REVERSE',
            action: 'param',
            param: 'spindleDirection',
            value: 'M4'
        },
        moff: {
            label: 'OFF',
            action: 'gcode',
            gcode: 'M5'
        },
        mon: {
            disabled: true,
            label: 'ON',
            action: 'gcode',
            gcode: '${spindleDirection} S${spindleSpeed}'
        },
        m10: {
            label: '10%',
            action: 'macro',
            macro: [
                {action: 'param', param: 'spindleSpeed',value: '1000'},
                {action: 'gcode', gcode: '${spindleDirection} S${spindleSpeed}'}
            ]
        },
        m25: {
            label: '25%',
            action: 'macro',
            macro: [
                {action: 'param', param: 'spindleSpeed',value: '2500'},
                {action: 'gcode', gcode: '${spindleDirection} S${spindleSpeed}'}
            ]
        },
        m50: {
            label: '50%',
            action: 'macro',
            macro: [
                {action: 'param', param: 'spindleSpeed',value: '5000'},
                {action: 'gcode', gcode: '${spindleDirection} S${spindleSpeed}'}
            ]
        },
        m100: {
            label: '100%',
            action: 'macro',
            macro: [
                {action: 'param', param: 'spindleSpeed',value: '10000'},
                {action: 'gcode', gcode: '${spindleDirection} S${spindleSpeed}'}
            ]
        },
        pause: {
            label: 'PAUSE',
            action: 'gcode',
            gcode: '!'
        },
        query: {
            label: 'QUERY',
            img: '/images/question.png',
            title: 'Query Machine Status',
            action: 'gcode',
            gcode: '?'
        },
        reset: {
            label: 'RESET',
            action: 'reset'
        },
        resume: {
            label: 'RESUME',
            action: 'gcode',
            gcode: '~'
        },
        setAlt: {
            label: 'Set<br>Alt Pos',
            title: 'Set Alt Pos (G30.1)',
            action: 'gcode',
            gcode: 'G30.1'
        },
        setHome: {
            label: 'Set<br>Home',
            title: 'Set Home (G28.1)',
            action: 'gcode',
            gcode: 'G28.1'
        },
        setx: {
            label: 'Set X',
            action: 'gcode',
            gcode: 'G10 L20 P0 X0 ?'
        },
        sety: {
            label: 'Set Y',
            action: 'gcode',
            gcode: 'G10 L20 P0 Y0 ?'
        },
        setz: {
            label: 'Set Z',
            action: 'gcode',
            gcode: 'G10 L20 P0 Z0 ?'
        },
        setxyz: {
            label: 'Set<br>XYZ',
            action: 'gcode',
            gcode: 'G10 L20 P0 X0 Y0 Z0 ?'
        },
        shft: {
            label: 'SHIFT KEY',
            img: '/images/shift.png',
            action: 'shift'
        },
        unlock: {
            label: 'Unlock',
            img: '/images/unlock.png',
            action: 'gcode',
            gcode: '$X ?'
        },
        usb: {
            label: 'USB...',
            action: 'macro',
            macro: 'usb'
        },
        test: {
            disabled: true,
            label: 'TEST',
            action: 'gcode',
            gcode: 'G90 X0 Y0 Z0 F${feed}'
        },
        ws: {
            label: 'WS<br>TOGGLE',
            action: 'call',
            call: 'wsStatus',
            args: [],
        },
        xminus: {
            label: 'X-',
            img: '/images/x-.png',
            title: 'X RIGHT',
            action: 'gcode',
            gcode: '$J=G91 X-${jogs[jog]} F${feed}',
            params: ['jog','rate']
        },
        xplus: {
            label: 'X+',
            img: '/images/x+.png',
            title: 'X LEFT',
            action: 'gcode',
            gcode: '$J=G91 X${jogs[jog]} F${feed}',
            params: ['jog']
        },
        yminus: {
            label: 'Y-',
            img: '/images/y-.png',
            title: 'Y MINUS',
            action: 'gcode',
            gcode: '$J=G91 Y-${jogs[jog]} F${feed}',
            params: ['jog']
        },
        yplus: {
            label: 'Y+',
            img: '/images/y+.png',
            title: 'Y PLUS',
            action: 'gcode',
            gcode: '$J=G91 Y${jogs[jog]} F${feed}',
            params: ['jog']
        },
        zminus: {
            label: 'Z-',
            img: '/images/z-.png',
            title: 'Z DOWN',
            action: 'gcode',
            gcode: '$J=G91 Z-${jogs[jog]} F${feed}',
            params: ['jog']
        },
        zplus: {
            label: 'Z+',
            img: '/images/z+.png',
            title: 'Z UP',
            action: 'gcode',
            gcode: '$J=G91 Z${jogs[jog]} F${feed}',
            params: ['jog']
        },
        zprobe: {
            label: 'Set<br>Z-PROBE',
            action: 'gcode',
            gcode: 'G38.2 Z-5 F50; G92 Z${zProbeOffset}; $J=G91 Z2 F1000; ?'
        }
    },
    macros: {
        machine: [
            { action: 'gcode', gcode: '$G; $#; $I; $N; $$' },
            { action: 'wait', wait: 500 },
            { action: 'call', call: 'popup', args: ['info','report']  }               
        ]
    },
};
