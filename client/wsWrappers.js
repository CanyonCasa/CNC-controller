// wsWrappers.js...

// Websocket client interface to server CNC websocket...
const wsCNC = { // websocket wrapper...

    ws: null,
    url: 'ws://localhost/serial',
    listener: null,
    onData: function(listener) { wsCNC.listener = listener; },

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
        wsCNC.ws.addEventListener('open',(evt)=>{ console.log('CNC websocket connected'); });
        wsCNC.ws.addEventListener('close',(evt)=>{ console.log('CNC websocket disconnected',evt); if (evt.code!==4999) setTimeout(wsCNC.connect,1000);
        });
    },

    disconnect: function wsDisconnect() {
        wsCNC.ws.close(4999);
        console.log('CNC websocket destroyed!');
    },

    send: function wsSend(text) {
        if (verbose) console.log(`<[wsCNC] ${text}`);
        wsCNC.ws.send(text + '\r\n');
    }

};


// Websocket client interface to file service...
const wsFile = { // websocket wrapper...

    ws: null,
    url: 'ws://localhost/file',
    listener: null,
    onData: function(listener) { wsFile.listener = listener; },

    connect: function wsConnect(url) {
        wsFile.url = url || wsFile.url;
        if (wsFile.ws) wsFile.ws = null;          // destroy any previous websocket
        wsFile.ws = new WebSocket(wsFile.url);    // create a new websocket
        console.log('File websocket created...');
        wsFile.ws.addEventListener('error',(e)=>console.error);
        wsFile.ws.addEventListener('message',(msg)=>{
            try {
                let text = msg.data.toString();
                let obj = JSON.parse(text);
                if (verbose) console.log(`>[wsFile]: ${text}`);
                if (wsFile.listener) wsFile.listener(obj);
            } catch(e) {
                console.error('wsFile.connect:',e);
                return {};
            };
        });
        wsFile.ws.addEventListener('open',(evt)=>{ console.log('File websocket connected'); });
        wsFile.ws.addEventListener('close',(evt)=>{ console.log('File webscoket disconnected',evt); if (evt.code!==4999) setTimeout(wsFile.connect,1000);
        });
    },

    disconnect: function wsDisconnect() {
        wsFile.ws.close(4999);
        console.log('File websocket destroyed!');
    },

    send: function wsSend(obj) {
        let text = JSON.stringify(obj);
        if (verbose) console.log(`<[wsFile]: ${text}`);
        wsFile.ws.send(text);
    }

};
