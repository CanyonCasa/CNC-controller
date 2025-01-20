// Data for defining tabs and button layouts and function...

var cncModelData = {
    params: {
        autoQuery: 'query', // false or name of query button, i.e. gcode=?
        gCodeInit: '$H; G54; G21',
        feed: 1000,
        feedMax: 2000,
        jog: 1,
        jogs: [0.01,0.1,1,10,100],
        spindleDirection: 'M3',
        spindleMotor: 'M5',
        spindleSpeed: 10000,
        spindleSpeedMax: 10000,
        zProbeOffset: 19.08,
        alarm: '',
        bf: '',
        error: '',
        fs: '',
        mpos: '-,-,-',
        msg: '',
        state: '',
        units: 'mm',
        wco: '-,-,-',
        status: [],
        statusTemplates: [
            "M: ${mpos}","","J: ${jogs[jog]}${units}","MX: ${spindleMotor==='M5'?'OFF':'ON'}",
            "W: ${wco}","S: ${spindleSpeed}","F: ${feed}","D: ${spindleDirection==='M4'?'CCW':'CW'}",
            "${msg}","${state}","A: ${alarm}","E: ${error}"
        ],
        transcriptLength: 100,
        report: new Set()
    },
    tabs: [
        {
            label: 'JOB',
            buttons: [
                'home','file','usb','report','log',
                'unlock','','','','',
                'query','test','','','',
                'reset','','resume','','pause'
            ],
            view: 'buttons'
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
            label: 'CUSTOM',
            buttons: [
                '','','','','',
                '','','','','',
                '','','','','',
                '','','','',''
            ]
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
                '','','','','',
                'reset','','','',''
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
        check: {
            label: 'CHECK',
            action: 'gcode',
            gcode: '$C'
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
        file: {
            label: 'File...',
            action: 'macro',
            macro: 'file'
        },
        machine: {
            label: 'MACHINE',
            action: 'gcode',
            gcode: '$$'
        },
        mcw: {
            label: 'FORWARD',
            action: 'param',
            param: 'spindleDirection',
            value: 'M3',
            disabled: true
        },
        mccw: {
            label: 'REVERSE',
            action: 'param',
            param: 'spindleDirection',
            value: 'M4',
            disabled: true
        },
        moff: {
            label: 'OFF',
            action: 'gcode',
            gcode: 'M5'
        },
        mon: {
            label: 'ON',
            action: 'gcode',
            gcode: '${spindleDirection} S${spindleSpeed}'
        },
        m10: {
            label: '10%',
            action: 'param',
            param: 'spindleSpeed',
            value: '1000'
        },
        m25: {
            label: '25%',
            action: 'param',
            param: 'spindleSpeed',
            value: '2500'
        },
        m50: {
            label: '50%',
            action: 'param',
            param: 'spindleSpeed',
            value: '5000'
        },
        m100: {
            label: '100%',
            action: 'param',
            param: 'spindleSpeed',
            value: '10000'
        },
        pause: {
            label: 'PAUSE',
            action: 'gcode',
            value: '!'
        },
        query: {
            label: 'QUERY',
            img: '/images/question.png',
            title: 'Query Machine Status',
            action: 'gcode',
            gcode: '?'
        },
        report: {
            label: 'REPORT',
            action: 'call',
            call: 'popup',
            args: ['info','report']
         },
        reset: {
            label: 'RESET',
            action: 'reset'
        },
        resume: {
            label: 'RESUME',
            action: 'gcode',
            value: '~'
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
        unlock: {
            label: 'Unlock',
            img: '/images/unlock.png',
        },
        usb: {
            label: 'USB...',
            action: 'macro',
            macro: 'usb'
        },
        test: {
            label: 'TEST',
            action: 'gcode',
            gcode: '$G; $#; $I; $N; $$'
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
            label: 'Z PROBE',
            action: 'macro',
            macro: 'zprobe'
        }
    },
    macros: {
        log: [],
        report: [
            { action: 'call', call: 'popup', args: ['info']  },           
            { action: 'call', call: 'popup', args: ['report']  }               
        ]
    },
};
