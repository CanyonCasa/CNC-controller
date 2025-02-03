/// WebSocket file server wrapper...

require('./Extensions2JS');
const WebSocket = require('ws');
const { exec } = require('child_process');

function wsRPi(cfg,Scribe) {
    this.cfg = cfg;
    this.scribble = Scribe(cfg.scribe);
    // define websock...
    this.wss = new WebSocket.Server({ noServer: true });
    this.wss.on('error',err=>this.scribble.error(`RPi WebsocketServer (WSS): ${err.toString()}`));
};

wsRPi.prototype.upgrade = function upgrade(request, socket, head){
    this.wss.handleUpgrade(request, socket, head, (ws)=>{
        this.ws = ws;
        this.wss.emit('connection', ws, request);
        ws.on('error',err=>this.scribble.error(`RPi Websocket: ${err.toString()}`));
        ws.on('close', ()=>{ this.scribble.warn('Rpi WebSocket closed!') });
        ws.on('message', async (buf)=>{
            try { 
                var msg = JSON.parse(buf.toString()); 
            } catch(e) { 
                this.scribble.warn(`wsRPi: Message parsing failed!`);
                ws.send({error: e})
            };
            this.scribble.extra(`wsRPi: '${ JSON.stringify(msg).slice(0,60)+'...'}`);
            try {
                switch (msg.action) {
                    case 'reboot': // reboot the RPi...
                        setTimeout(()=>{exec('sudo /usr/sbin/shutdown -r now')},msg.delay||100);
                        msg.msg = 'RPi reboot in progress...'
                        break;
                    case 'halt': // halt the RPi for safe powerdown...
                        setTimeout(()=>{exec('sudo /usr/sbin/shutdown -h now')},msg.delay||100);
                        msg.msg = 'RPi halting for safe powerdown...'
                        break;
                    case 'server': // server shutdown/restart
                        setTimeout(()=>{process.exit(10)},msg.delay||100);
                        msg.msg = 'RPi server restarting...'
                        break;
                    case 'client': // client shutdown/restart
                        setTimeout(()=>{exec('killall chromium')},msg.delay||100);
                        msg.msg = 'RPi client restarting...'
                        break;
                    default:
                        msg.error =`UNKNOWN[${msg.action}]: file server request action!`
                };
            } catch(e) {
                msg.error = e;
                this.scribble.error(`wsRPi: Error encountered for ${msg.action} => ${e.toString()}`)
            };
            ws.send(JSON.stringify(msg));
        });
        this.scribble.info('RPi WebSocket open!');
    });
};

module.exports = wsRPi;
