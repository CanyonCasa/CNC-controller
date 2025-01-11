let cfg = {
    host: 'localhost',
    port: '80',
    log$: "RQST[${ctx.method}] ${ctx.href}",
    scribe: {
        tag: 'CNC',
        mask: 'extra',
        transcript: {
            file: '../logs/cnc.log',
            bsize: 10000,
            fsize: 250000
        }
    },
    site: {
        headers: { site: 'CNC Offline Controller Server' },
        root: '../site'
    },
    ws: {
        serial: {
            delimiter: '\r\n',
            path: 'COM10',
            baudRate: 115200
        },
        scribe: { tag: 'WS' },
        url: '/serial'
    }

};

exports = module.exports = cfg;
