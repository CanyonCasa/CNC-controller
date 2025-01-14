/*
A simple web server for a RPi based CNC offline controller
This server has no external framework dependencies, only serialport library, and ... 
  * Performs request logging
  * Serves basic file content: HTML, CSS, JS, JSON, JPG
  * Implements a web socket for serial communication with the CNC
  * Error handling

SYNTAX (from within the bin folder):
    node cnc [<configuration_file>]

    where <configuration_file> defaults to ../restricted/config[.js or .json]
    and expects a ../logs folder.

SECURITY: NOT for use on the open Internet! DO NOT place config in document root!
*/


// load language extension dependencies first...
require('./Extensions2JS');   // personal library of additions to JS language, only required once
// require node dependencies...
const fsp = require('fs').promises;
const path = require('path');
const http = require('http');
const Scribe = require('./scribe');
const { httpStatusMsg, mimeType } = require('./misc');
const SerialWS = require('./wsSerial');

// read the hosting configuration from (cmdline specified arg or default) JS or JSON file ...
const cfg = require(process.argv[2] || '../restricted/config');

// Scribe instance...
const scribe = Scribe(cfg.scribe);  // must load config first
const VERSION = 1.00;
scribe.info(`CNC Offline Controller Server[${VERSION}] setup ...`);

// web server...
let httpServer = null;
try {
    httpServer = http.createServer(async(req,res)=>{
        // code called for each http request...
        let ctx = { 
            headers: cfg.site.headers,
            host: req.headers.host,
            url: req.url,
            href: `http://${req.headers.host}${cfg.port==80?'':(':'+cfg.port)}${req.url}`,
            method: req.method.toUpperCase()
        };
        try {
            if (ctx.method != 'GET') throw 405;
            scribe.log(scribe.format(cfg.log$,ctx));    // log request URL
            if (ctx.url==='/') ctx.url = '/index.html'; // adjust homepage
            // handle and send request...
            ctx.file = path.join(cfg.site.root,ctx.url);
            scribe.trace(`File: ${ctx.file}`);
            ctx.headers['Content-type'] = mimeType(path.extname(ctx.file));
            let data = await fsp.readFile(ctx.file);
            res.writeHead(200, ctx.headers);
            res.end(data);
        } catch(e) {
            // handle content error...
            if (typeof(e)!='number') e = (e.code==='ENOENT') ? 404 : 500;
            let msg = httpStatusMsg(e);
            let ref = e===404 ? ` [${ctx.file}]` : '';
            scribe.error(`[${e}]: ${msg.msg}${ref}`);
            ctx.headers['Content-type'] = 'application/json; charset=UTF-8';    // force JSON
            res.writeHead(200, ctx.headers);
            res.end(JSON.stringify(msg));
        };
    }).listen(cfg.port);
    scribe.info(`CNC Offline Controller Server setup on: ${cfg.host}:${cfg.port}`);
} catch(e) { 
    scribe.fatal(`CNC Offline Controller Server failed to start --> ${e.toString()}`);
};
if (!httpServer) process.exit();

// web socket for serial...
let wss = new SerialWS(cfg,Scribe);

httpServer.on('upgrade', function upgrade(request, socket, head){
    if (request.url===cfg.ws.url) {
        wss.upgrade(request, socket, head);
        } else {
            socket.destroy();
        }
    });
