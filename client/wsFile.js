// wsFile.js: Websocket client interface to file service...

/*
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
        wsFile.ws.addEventListener('message',(data)=>{
            console.log(`<[wsFile]: ${typeof(data)}`);
            if (wsFile.listener) wsFile.listener(data);
        });
        wsFile.ws.addEventListener('open',(evt)=>{ console.log('File websocket connected'); });
        wsFile.ws.addEventListener('close',(evt)=>{ console.log('File webscoket disconnected',evt); if (evt.code!==4999) setTimeout(wsFile.connect,1000);
        });
    },

    disconnect: function wsDisconnect() {
        wsFile.ws.close(4999);
        console.log('File websocket destroyed!');
    },

    send: function wsSend(data) {
        console.log(`<[wsFile] ${typeof(data)}`);
        wsFile.ws.send(data);
    }

};
*/