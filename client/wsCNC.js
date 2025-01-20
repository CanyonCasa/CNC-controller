// wsCNC.js: Websocket client interface to server CNC websocket...
const wsCNC = { // websocket wrapper...

    ws: null,
    url: 'ws://localhost/serial',
    listener: null,
    onRX: function(listener) { wsCNC.listener = listener; },

    connect: function wsConnect(url) {
        wsCNC.url = url || wsCNC.url;
        if (wsCNC.ws) wsCNC.ws = null;          // destroy any previous websocket
        wsCNC.ws = new WebSocket(wsCNC.url);    // create a new websocket
        console.log('CNC websocket created...');
        wsCNC.ws.addEventListener('error',(e)=>console.error);
        wsCNC.ws.addEventListener('message',(msg)=>{
            let text = msg.data.replace(/\r?\n|\r/,'');
            if (verbose) console.log(`>[wsCNC] ${text}`);
            if (wsCNC.listener) wsCNC.listener(text);
        });
        wsCNC.ws.addEventListener('open',(evt)=>{ console.log('ws connected'); });
        wsCNC.ws.addEventListener('close',(evt)=>{ console.log('ws disconnected'); setTimeout(wsCNC.connect,1000); });
        //wsCNC.ws.addEventListener('serial',(evt)=>{ console.log('ws serial'); if (wsCNC.listener) wsCNC.listener('error:PORT'); });
    },

    send: function wsSend(text) {
        if (verbose) console.log(`<[wsCNC] ${text}`);
        wsCNC.ws.send(text + '\r\n');
    }

};
