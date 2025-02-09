// (C) 2025 Enchanted Engineering
//const VERSION = 1.00;     // 20250126 dvc Initial release
//const VERSION = '1.10';   // 20250126 dvc Second release
const VERSION = '1.20';   // 20250205 dvc RFS add-on

/*
A simple web server for a RPi based CNC offline controller
This server has no external framework dependencies, only serialport library, and ... 
  * Performs request logging
  * Serves basic file content: HTML, CSS, JS, JSON, JPG, PNG, ...
  * Implements a web socket for serial communication with the CNC
  * Implements a web socket for file loadig and saving
  * Error handling

SYNTAX
    node <path-to-server-bin>/cnc [<configuration_file>]

    where <configuration_file> defaults to ../restricted/config[.js or .json]
    The app expects a ../logs folder as well, unless defined deferently in config file.

SECURITY: NOT SECURE! NOT for use on the open Internet! DO NOT place config in document root!
*/


// load language extension dependencies first...
require('./Extensions2JS');   // personal library of additions to JS language, only required once
// require node dependencies...
const fs = require('fs');
const fsp = fs.promises;
const zlib = require('zlib');
const path = require('path');
const http = require('http');
const { httpStatusMsg, mimeType, Scribe, sniff, stat } = require('./misc'); // helper functions
const SerialWS = require('./wsSerial');     // serial port websocket handler
const FileWS = require('./wsFileServer');   // file websocket handler
const RelayWS = require('./wsRelayServer'); // file relay websocket handler
const RPiWS = require('./wsRPi');           // RPi command websocket handler

// read the hosting configuration from (cmdline specified arg or default) JS or JSON file ...
const cfg = require(process.argv[2] || '../restricted/config');
// determine server mode...
const serverID = cfg.remoteFileServer ? 'Remote File' : 'CNC Offline Controller';

// Scribe instance...
const scribe = Scribe(cfg.scribe);  // must load config first
scribe.info(`${serverID} Server[${VERSION}] setup ...`);

// web server...
let httpServer = null;
let chunkSize = cfg.chunk || 16384;

try {
    httpServer = http.createServer(async(req,res)=>{
        // code called for each http request...
        let ctx = {
            headers: Object.assign({},cfg.site.headers,{uuid: Math.random().toString().slice(2)}),
            host: req.headers.host,
            url: req.url,
            href: `http://${req.headers.host}${req.url}`,
            method: req.method.toUpperCase()
        };
        try {   // called for each request...
            scribe.log(scribe.format(cfg.log$,ctx));    // log request URL
            if (ctx.method != 'GET') throw 405;
            if (cfg.remoteFileServer) throw 404;
            // handle file request...
            if (ctx.url==='/') ctx.url = '/index.html'; // resolve homepage
            ctx.file = path.join(cfg.site.root,ctx.url);
            ctx.headers['Content-type'] = mimeType(path.extname(ctx.file));
            ctx.headers['cache-control'] = 'no-cache';
            scribe.trace(`File[${ctx.headers['Content-type']}]: ${ctx.file}`);
            let fstat = await stat(ctx.file); // throw 404 if file not valid
            if (fstat.size > chunkSize) {
                let bytes = 0;
                ctx.headers['content-encoding'] = 'gzip';
                ctx.data = fs.createReadStream(ctx.file);
                ctx.gzip = zlib.createGzip();
                ctx.sniffer = sniff(buf=>{bytes+=buf.length});
                ctx.sniffer.on('close',() => { 
                    res.end();
                    scribe.info(`Streamed ${fstat.size} bytes of ${ctx.url} as ${bytes} bytes!`);
                    });
                res.writeHead(200, ctx.headers);
                ctx.data.pipe(ctx.gzip).pipe(ctx.sniffer).pipe(res);
            } else {
                ctx.data = await fsp.readFile(ctx.file);
                ctx.headers['Content-Length'] = fstat.size;
                res.writeHead(200, ctx.headers);
                res.end(ctx.data);
                scribe.info(`Sent ${fstat.size} bytes of ${ctx.url}!`);
            }
        } catch(e) {
            // handle content error...
            console.log(e);
            if (typeof(e)!='number') e = (e.code==='ENOENT') ? 404 : 500;
            let msg = httpStatusMsg(e);
            let ref = e===404 ? ` [${ctx.file}]` : '';
            scribe.error(`[${e}]: ${msg.msg}${ref}`);
            ctx.headers['Content-type'] = 'application/json; charset=UTF-8';    // force JSON
            res.writeHead(200, ctx.headers);
            res.end(JSON.stringify(msg));
        };
    }).listen(cfg.port);
    scribe.info(`${serverID} Server setup on: ${cfg.host}:${cfg.port}`);
} catch(e) { 
    scribe.fatal(`${serverID} Server failed to start --> ${e.toString()}`);
};
if (!httpServer) process.exit();


// conditionally define websocket connections...
let wss = cfg.ws.serial ? new SerialWS(cfg.ws.serial,Scribe) : null;    // websocket for serial connection to CNC
let wsf = cfg.ws.file ? new FileWS(cfg.ws.file,Scribe) : null;          // webscoket for local and USB file requests
let wsrfs = cfg.ws.remote ? new RelayWS(cfg.ws.remote,Scribe) : null;   // websocket for remote file requests
let wsrpi = cfg.ws.rpi ? new RPiWS(cfg.ws.rpi,Scribe) : null;           // websocket for RPi control...

httpServer.on('upgrade', function upgrade(request, socket, head){
    if (wsrfs && request.url==='/remote') {
        wsrfs.upgrade(request, socket, head);
    } else if (wss && request.url==='/serial') {
        wss.upgrade(request, socket, head);
    } else if (wsf && request.url==='/file') {
        wsf.upgrade(request, socket, head);
    } else if (wsrpi && request.url==='/rpi') {
        wsrpi.upgrade(request, socket, head);
    } else {
        socket.destroy();
    };
});
