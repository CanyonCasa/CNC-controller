/// WebSocket serial wrapper...

require('./Extensions2JS');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline')
const WebSocket = require('ws');


function wsSerial(cfg,Scribe) {
    this.cfg = cfg;
    this.scribble = Scribe(cfg.scribe);
    // define serial port cfg...
    this.cfgPort = Object.assign({},cfg.port,{autoOpen: false});
    // define websock...
    this.wss = new WebSocket.Server({ noServer: true });
    this.wss.on('error',err=>this.scribble.error(`Serial WebsocketServer (WSS): ${err.toString()}`));
};

wsSerial.prototype.upgrade = function upgrade(request, socket, head){
    this.wss.handleUpgrade(request, socket, head, (ws)=>{
        this.ws = ws;
        this.wss.emit('connection', ws, request);
        ws.on('error',err=>this.scribble.error(`Serial Websocket: ${err.toString()}`));
        ws.on('close', ()=>{ this.scribble.warn('Serial WebSocket closed!') });
        ws.on('message',(buf)=>{
            let msg = buf.toString().replace(/\r?\n|\r/g,'');
            this.scribble.extra(`> ${msg}`);
            try {
                this.port.write(buf);
            } catch(e) { this.scribble.error(e); this.ws.emit('serial', 'Write to serial port failed!'); }
            });
        ws.on('serial',e=>{ this.ws.send(`error:${this.cfgPort.alias||this.cfgPort.path} !:${e.toString()}\r\n`); });
        this.scribble.info('Serial WebSocket open!');
        this.notFoundReported = false;
        this.openSerial();
    });
};

wsSerial.prototype.openSerial = function() {
    if (!this.port) {   // initial open
        this.port = (this.cfgPort.path) ? (new SerialPort(this.cfgPort)) : null;
        if (!this.port) return setTimeout(()=>{this.openSerial()},1000);
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: this.cfgPort.delimiter||'\r\n' }));
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
            let ready = e$.indexOf('Port is already open')!==-1;    // ignore already open errors
            let opening = e$.indexOf('Port is opening')!==-1;       // likely repeated timeout errors
            let portNotFound = e$.indexOf('File not found')!==-1;   // trap repeated not found errors
            if ((opening && !this.openingReported) || (portNotFound && !this.notFoundReported)) {
                this.scribble.error(`Serial ${e$}`);
                this.ws.emit('serial','Opening serial port failed!');
            };
            this.notFoundReported |= portNotFound;
            this.openingReported |= opening;
            if (!ready) setTimeout(()=>{this.openSerial()},1000);
        } else {
            this.scribble.info(`Serial port '${this.cfgPort.path}' opened!`);
            this.notFoundReported = false;
            this.openingReported = false;
        };
    });
};

module.exports = wsSerial;
