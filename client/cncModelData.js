// Data for defining tabs and button layouts and function...

let verbose = false; // for all console logging and transcripting

var cncModelData = {
    params: {
        autoQuery: 'query', // false or name of query button, i.e. gcode=?
        cmdHistoryLength: 20,
        cncBufferLength: 128,
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
        state: '?',
        units: 'mm',
        wco: '-,-,-',
        file: {
            pseudo: '',
            folder: '',
            name: '',
            size: 0,
            count: 0,
            lines: [],
            time: '',
            date: '',
            type: '',
            root: ''
        },
        job: {
            lines: [],
            ok: 0,
            sent: [],
        },
        fileOverlayTemplates: [
            "${pseudo}","${size}/${count}","${date}",
            "","",""
        ],
        filesLocal: {
            root: 'local',
            label: '(local:)',
            folder: '',
            accept: '.nc, .cnc, .gcode'
        },
        filesRemote: {
            root: 'remote',
            label: '(remote:)',
            folder: '',
            accept: '.nc, .cnc, .gcode'
        },
        filesUSB: {
            root: 'usb',
            label: '(USB:)',
            folder: '',
            accept: '.nc, .cnc, .gcode'
        },
        fileButtons: { close:'fClose', previous: 'fPrev', next: 'fNext' },
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
                    '','H','J','S','F','1','2','3',' ',
                    'hback','hadv','','','C','-','0','.','=',
                    '','','','','','','','bksp','enter' // note first 6 slots overlayed by commandline
                ],
                [
                    '','','','','','7','8','9','shft',
                    '','','','','','4','5','6','$',
                    '','','','','','1','2','3',' ',
                    '','','','','','-','0','.','=',
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
            title: 'Goto Alternate Position (Center)',
            action: 'gcode',
            gcode: 'G30 ?'
        },
        bksp: {
            label: 'BKSP',
            img: '/images/undo.png',
            title: 'backspace',
            action: 'key',
            key: 'bksp'
        },
        check: {
            label: 'CHECK<br>MODE',
            title: 'Toggle GCODE check mode',
            action: 'gcode',
            gcode: '$C'
        },
        enter: {
            label: 'Enter',
            img: '/images/enter.png',
            title: 'Enter -> run the command',
            action: 'key',
            key: 'enter'
        },
        fClose: {
            // used by the file dialog
            label: 'Close',
            title: 'Close Files Dialog',
            img: '/images/close.png',
            action: 'close'
        },
        fNext: {
            // used by the file dialog
            label: 'Next',
            title: 'Show next group of files',
            img: '/images/down.png',
            action: 'next'
        },
        fPrev: {
            // used by the file dialog
            label: 'Previous',
            img: '/images/up.png',
            title: 'Show previous group of files',
            action: 'previous'
        },
        filesL: {
            label: 'File...<br>(local)',
            title: 'List local files',
            action: 'call',
            call: 'filesDialog',
            args: ['filesLocal']
        },
        filesR: {
            label: 'File...<br>(remote)',
            title: 'List remote files',
            action: 'call',
            call: 'filesDialog',
            args: ['filesRemote']
        },
        filesU: {
            label: 'File...<br>(USB)',
            title: 'List USB files',
            action: 'call',
            call: 'filesDialog',
            args: ['filesUSB']
        },
        hback: {
            label: 'Back',
            img: '/images/history_back.png',
            title: 'History backwards',
            action: 'key',
            key: 'hback'
        },
        hadv: {
            label: 'Forward',
            img: '/images/history_forward.png',
            title: 'History forwards',
            action: 'key',
            key: 'hadv'
        },
        home: {
            label: 'Home',
            img: '/images/house.png',
            title: 'Home CNC',
            action: 'gcode',
            gcode: '$H, G54, G21, ?'
        },
        jdec: {
            label: 'JOG<br>LESS',
            title: 'Decrease job distance parameter',
            action: 'param',
            param: 'jog',
            //template: '${(Number(jog)-1+jogs.length)%jogs.length}'    // wrap around
            template: '${Math.max(0,Number(jog)-1)}'                    // no wrap around
        },
        jinc: {
            label: 'JOG<br>MORE',
            title: 'Increase job distance parameter',
            action: 'param',
            param: 'jog',
            //template: '${(Number(jog)+1)%jogs.length}'                // wrap around
            template: '${Math.min(Number(jog)+1,jogs.length-1)}'        // no wrap around
        },
        log: {
            label: 'GCODE<br>LOG',
            title: 'Display GCODE log',
            action: 'call',
            call: 'popup',
            args: ['info','log']
        },
        machine: {
            label: 'CNC<br>REPORT',
            title: 'Display machine settings',
            action: 'macro',
            macro: 'machine'
         },
        mcw: {
            disabled: true,
            label: 'FORWARD',
            title: 'Set spindle forward (CW): Not supported',
            action: 'param',
            param: 'spindleDirection',
            value: 'M3'
        },
        mccw: {
            disabled: true,
            label: 'REVERSE',
            title: 'Set spindle reverse (CCW): Not supported',
            action: 'param',
            param: 'spindleDirection',
            value: 'M4'
        },
        moff: {
            label: 'OFF',
            title: 'Turn the motor off',
            action: 'gcode',
            gcode: 'M5'
        },
        mon: {
            disabled: true,
            label: 'ON',
            title: 'Turn the motor on',
            action: 'gcode',
            gcode: '${spindleDirection} S${spindleSpeed}'
        },
        m10: {
            label: '10%',
            title: 'Run spindle at 10% of full speed',
            action: 'macro',
            macro: [
                {action: 'param', param: 'spindleSpeed',value: '1000'},
                {action: 'gcode', gcode: '${spindleDirection} S${spindleSpeed}'}
            ]
        },
        m25: {
            label: '25%',
            title: 'Run spindle at 25% of full speed',
            action: 'macro',
            macro: [
                {action: 'param', param: 'spindleSpeed',value: '2500'},
                {action: 'gcode', gcode: '${spindleDirection} S${spindleSpeed}'}
            ]
        },
        m50: {
            label: '50%',
            title: 'Run spindle at 50% of full speed',
            action: 'macro',
            macro: [
                {action: 'param', param: 'spindleSpeed',value: '5000'},
                {action: 'gcode', gcode: '${spindleDirection} S${spindleSpeed}'}
            ]
        },
        m100: {
            label: '100%',
            title: 'Run spindle at 100% of full speed',
            action: 'macro',
            macro: [
                {action: 'param', param: 'spindleSpeed',value: '10000'},
                {action: 'gcode', gcode: '${spindleDirection} S${spindleSpeed}'}
            ]
        },
        pause: {
            label: 'PAUSE',
            title: 'Pause job',
            action: 'gcode',
            gcode: '!'
        },
        query: {
            label: 'QUERY',
            img: '/images/question.png',
            title: 'Query Machine State',
            action: 'gcode',
            gcode: '?'
        },
        reset: {
            label: 'RESET',
            img: '/images/resetrd.png',
            title: 'Perform a soft-reset (CTRL-X)',
            action: 'reset'
        },
        resume: {
            label: 'RESUME',
            title: 'Resume job',
            action: 'gcode',
            gcode: '~'
        },
        setAlt: {
            label: 'Set<br>Alt Pos',
            title: 'Set Alternate work position (G30.1)',
            action: 'gcode',
            gcode: 'G30.1'
        },
        setHome: {
            label: 'Set<br>Home',
            title: 'Set Home position (G28.1)',
            action: 'gcode',
            gcode: 'G28.1'
        },
        setx: {
            label: 'Set X',
            title: 'Set work X position (G28.1)',
            action: 'gcode',
            gcode: 'G10 L20 P0 X0 ?'
        },
        sety: {
            label: 'Set Y',
            title: 'Set work Y position (G28.1)',
            action: 'gcode',
            gcode: 'G10 L20 P0 Y0 ?'
        },
        setz: {
            label: 'Set Z',
            title: 'Set work Z position (G28.1)',
            action: 'gcode',
            gcode: 'G10 L20 P0 Z0 ?'
        },
        setxyz: {
            label: 'Set<br>XYZ',
            title: 'Set work XYZ positions (G28.1)',
            action: 'gcode',
            gcode: 'G10 L20 P0 X0 Y0 Z0 ?'
        },
        shft: {
            label: 'SHIFT KEY',
            title: 'Shift button pages',
            img: '/images/shift.png',
            action: 'shift'
        },
        unlock: {
            label: 'Unlock',
            title: 'Unlock machine',
            img: '/images/unlock.png',
            action: 'gcode',
            gcode: '$X ?'
        },
        run: {
            label: 'RUN...',
            title: 'Run current loaded job',
            action: 'call',
            call: 'runJob',
            args: ['init']
        },
        test: {
            disabled: true,
            title: 'Run test code',
            label: 'TEST',
            action: 'gcode',
            gcode: 'G90 X0 Y0 Z0 F${feed}'
        },
        ws: {
            label: 'WS<br>TOGGLE',
            title: 'Toggle the websocket connections OFF/ON',
            action: 'call',
            call: 'wsStatus',
            args: [],
        },
        xminus: {
            label: 'X-',
            img: '/images/x-.png',
            title: 'X LEFT',
            action: 'gcode',
            gcode: '$J=G91 X-${jogs[jog]} F${feed}',
            params: ['jog','rate']
        },
        xplus: {
            label: 'X+',
            img: '/images/x+.png',
            title: 'X RIGHT',
            action: 'gcode',
            gcode: '$J=G91 X${jogs[jog]} F${feed}',
            params: ['jog']
        },
        yminus: {
            label: 'Y-',
            img: '/images/y-.png',
            title: 'Y FRONT',
            action: 'gcode',
            gcode: '$J=G91 Y-${jogs[jog]} F${feed}',
            params: ['jog']
        },
        yplus: {
            label: 'Y+',
            img: '/images/y+.png',
            title: 'Y BACK',
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
            title: 'Run Z-probe setting gcode',
            action: 'gcode',
            gcode: 'G38.2 Z-5 F50, G92 Z${zProbeOffset}, G53 G0 Z-1, ?'
        }
    },
    macros: {
        machine: [
            { action: 'gcode', gcode: '$G, $#, $I, $N, $$' },
            { action: 'wait', wait: 500 },
            { action: 'call', call: 'popup', args: ['info','report']  }               
        ]
    },
};
