// CNC server configuration data...

let cfg = {
    host: 'localhost',  // host name for the server
    port: '8000',       // server port, may require permissions
    chunk:  8192,       // max data chunk size; larger files compressed and streamed
    log$: "RQST[${ctx.method}] ${ctx.href}",    // template for logging requests
    scribe: {                           // parameters for the built in logger
        tag: 'CNC',                     // unique top-level tag for transcript output
        mask: 'extra',                  // desired level of detail see scribe.js
        transcript: {
            file: '../logs/cnc.log',    // where to save logs; folder must exist
            bsize: 10000,               // buffer size to minimize writes
            fsize: 250000               // file size rollover
        }
    },
    site: { // any custom response headers written by server
        headers: {
            site: 'CNC Offline Controller Server',
            'Access-Control-Allow-Origin': '*' 
        }, 
        root: '../../client'            // relative or absolute path to files served to the client
    },
    ws: {                               // websockets parameters; default all defined for CNC server
        serial: {                       // serial port websocket
            port: {                     // port parameters
                alias: 'CNC',           // optional alias for error reporting
                delimiter: '\r\n',      // line delimiter; may be CNC specific
                path: 'COM10',           // port identifier, likely /dev/ttyACM0 on RPi
                baudRate: 115200        // serial baudrate; may be CNC specific
            },
            scribe: { tag: 'SWS' }      // unique transcript message tag for websocket responses
        },
        file: {                         // files websocket
            scribe: { tag: 'FWS' },     // unique transcript message tag for websocket responses
            root: {                     // references for absolute path requested from client
                local: '../../cnc',     // relative/absolute paths defined here to isolate server file system from client
                usb: '/media'           // note: these keys match those in the cncModelData,js 
            }
        },
        rpi: {                          // optional websock to allow control of RPI
            scribe: { tag: 'RPI' }      // unique transcript message tag for websocket responses
        },
        remote: {                       // remote: note ws defined as a relay to different server
            ws: 'ws://192.168.0.179:9000/file',
            wsOptions: { handshakeTimeout: 2000 },
            scribe: { tag: 'RFS' }
        }
        
    }
};

exports = module.exports = cfg;
