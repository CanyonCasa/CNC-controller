// Remote file server configuration data...

let cfg = {
    remoteFileServer: true,
    host: '192.168.0.179',  // host name for the server
    port: '9000',           // server port, may require permissions
    chunk:  8192,           // max data chunk size; larger files compressed and streamed
    log$: "RQST[${ctx.method}] ${ctx.href}",    // template for logging requests
    scribe: {                           // parameters for the built in logger
        tag: 'RFS',                     // unique top-level tag for transcript output
        mask: 'extra',                  // desired level of detail see scribe.js
        transcript: {
            file: '../logs/rfs.log',    // where to save logs; folder must exist
            bsize: 10000,               // buffer size to minimize writes
            fsize: 250000               // file size rollover
        }
    },
    site: { // any custom response headers written by server
        headers: {
            site: 'CNC Remote File Server',
            'Access-Control-Allow-Origin': '*' 
        }
    },
    ws: {                               // websockets parameters; default only define file with remote endpoint
        file: {                         // files websocket
            scribe: { tag: 'WSR' },     // unique transcript message tag for websocket responses
            root: {                     // references for absolute path requested from client
                remote: '../../cnc'     // absolute path defined here to isolate server file system from client
            }
        }
    }
};

exports = module.exports = cfg;
