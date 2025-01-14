// wsCNC.js interface to CNC websocket...

var wsCNC = {

    ws: null,
    url: 'ws://localhost/serial',
    callback: null,

    connect: function wsConnect() {
        if (wsCNC.ws) wsCNC.ws = null;
        wsCNC.ws = new WebSocket(wsCNC.url);
        console.log('CNC websocket created...');
        if (!wsCNC.ws.on) wsCNC.ws.on = function(event,func) { wsCNC.ws.addEventListener(event,func) };
        wsCNC.ws.on('error',(e)=>console.error);
        wsCNC.ws.on('message',(msg)=>{ 
            let text = msg.data.replace(/\r?\n|\r/,'');
            console.log(`> ${text}`);
            if (callback) this.callback(text);
        });
        wsCNC.ws.on('open',(evt)=>{ console.log('ws connected'); });
        wsCNC.ws.on('close',(evt)=>{ console.log('ws disconnected'); setTimeout(wsCNC.connect,1000); });
    },

    init: function init(url,callback) {
        wsCNC.url = url || wsCNC.url;
        wsCNC.callback = callback || wsCNC.callback;
        //wsCNC.connect();
    },

    send: function wsSend(text) {
        console.log(`< ${text}`);
        wsCNC.ws.send(text + '\r\n');
    }

};