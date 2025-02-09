/// WebSocket file server wrapper...

require('./Extensions2JS');
const WebSocket = require('ws');

function wsRelayServer(cfg,Scribe) {
    this.cfg = cfg;
    this.scribble = Scribe(cfg.scribe);
    // define websocket server and client...
    this.wss = new WebSocket.Server({ noServer: true });
    this.wss.on('error',err=>this.scribble.error(`Relay WebsocketServer (WSS): ${err.toString()}`));
};

wsRelayServer.prototype.upgrade = function upgrade(request, socket, head){
    this.wss.handleUpgrade(request, socket, head, (ws)=>{
        this.ws = ws;
        this.wss.emit('connection', ws, request);
        ws.on('error',err=>this.scribble.error(`Relay Websocket: ${err.toString()}`));
        ws.on('close', ()=>{ this.scribble.warn('Relay WebSocket closed!') });
        ws.on('message', async (buf)=>{
            try {
                let relay = new WebSocket(this.cfg.ws,this.cfg.wsOptions); // this attempts a temporary connection to remote server
                relay.on('error',e=>this.scribble.error(`Relay: ${e.toString()}`));
                relay.on('open',()=>{ relay.send(buf); });
                relay.on('message',(rmsg)=>{ ws.send(rmsg.toString()); relay.close(); });
            } catch(e) {
                this.scribble.warn(`wsRelay: Message relay failed!`);
                ws.send(JSON.stringify({error: e}));
            };
        });
        this.scribble.info('(Remote) Relay WebSocket open!');
    });
};

module.exports = wsRelayServer;
