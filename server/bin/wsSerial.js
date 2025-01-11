/// WebSocket serial wrapper...

require('./Extensions2JS');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline')
const WebSocket = require('ws');


function wsSerial(cfg,Scribe) {
    this.scribble = Scribe(cfg.scribe);
    this.cfg = cfg;
    // define serial cfg...
    this.cfgSerial = Object.assign({},cfg.ws.serial,{autoOpen: false});
    // define websock...
    this.wss = new WebSocket.Server({ noServer: true });
    this.wss.on('error',err=>this.scribble.error(`WebsockServer: ${err.toString()}`));
};

wsSerial.prototype.upgrade = function upgrade(request, socket, head){
    this.wss.handleUpgrade(request, socket, head, (ws)=>{
        this.ws = ws;
        this.wss.emit('connection', ws, request);
        ws.on('error',err=>this.scribble.error(`Websock: ${err.toString()}`));
        ws.on('close', ()=>{ this.scribble.warn('WebSocket closed!') });
        ws.on('message',(buf)=>{
            let msg = buf.toString().replace(/\r?\n|\r/g,'');
            this.scribble.extra(`$> ${msg}, ${buf}`);
            if (this.port) this.port.write(buf);
            });
        this.scribble.info('WebSocket open!');
        this.notFoundReported = false;
        this.openSerial();
    });
};

wsSerial.prototype.openSerial = function() {
    if (!this.port) {   // initial open
        this.port = (this.cfgSerial.path) ? (new SerialPort(this.cfgSerial)) : null;
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: this.cfgSerial.delimiter||'\r\n' }));
        this.port.on('open',()=>{ this.scribble.extra('Serial Port opened!'); });
        this.port.on('close',()=>{
            this.scribble.warn('Serial Port closed!');
            this.openSerial();
        });
        this.port.on('error',(err)=>{
            this.scribble.error(`Serial port: ${err.toString()}`);
            setTimeout(()=>{this.openSerial()},1000);
        });
        this.parser.on('data',(data)=>{
            this.ws.send(data);
            this.scribble.extra(`< ${data}`);
        });
    };
    this.port.open(e=>{
        if (e) {
            let e$ = e.toString();
            let portNotFound = e$.indexOf('File not found')!==-1;   // trap repeated not found errors
            let ready = e$.indexOf('Port is already open')!==-1;    // ignore already open errors
            if (!ready && (!portNotFound || !this.notFoundReported)) this.scribble.error(`Serial port ${e$}}`);
            this.notFoundReported = portNotFound;
            if (!ready) setTimeout(()=>{this.openSerial()},1000);
        } else {
            this.scribble.info(`Serial port '${this.cfgSerial.path}' opened!`);
            this.notFoundReported = false;
        };
    });
};

module.exports = wsSerial;
