// Vue3 functional model for cnc server ...

const cnc = Vue.createApp({
    data: function() { return {
        tabs: cncTabsData.tabs,
        buttons: cncTabsData.buttons,
        activeTab: 0,
        cnc: {
            speed: 10000
        }
    }},
    computed: {
        activeButtons() { 
            return this.tabs[this.activeTab].buttons.map(b=>b==='' ? {} : this.buttons[b]||{label:`${b}?`})
        }
    },
    methods: {
        cncRX(msg) {
           console.log('Vue cncRX:',msg);

        },
        pickButton(b) { 
            console.log(b);
            window.cncTX(b);
        },
        pickTab(i) { this.activeTab = i; },
        
    }
});
//cnc.config.globalProperties.$cncRX = cnc.methods.cncRX;

VueLib3.applyLibToApp(cnc); // extend app with VueLib3
const cncRoot = cnc.mount('#app');
//window.cnc = cnc


// Websocket setup...
// wsCNC object defined in window scope from loaded script

// this function takes input from Vue app (cnc) and sends it to the
function cncTX(msg) {
    switch (msg.action) {
        case 'gcode':
            wsCNC.send(msg.gcode);
            console.log(`TX[${msg.action}]: ${msg.gcode}`)
            break;
        default: {}
    };
};

// websocket callback to pass text received from CNC to Vue app (cnc)
function cncRX(text) {
    let msg = { text: text, type: 'ack' };
    if (texk='ok') { msg.type = 'ack'; }
    else if (text.startWith('<')) { msg.type = 'report'; }
    else if (text.startWith('[')) { msg.type = 'msg'; }
    else if (text.startWith('$')) { msg.type = 'var'; }
    else if (text.startWith('ALARM')) { msg.type = 'alarm'; }
    else if (text.startWith('error')) { msg.type = 'error'; }
    else if (text.startWith('Grbl')) { msg.type = 'version'; }
    else { msg.type = 'unknown'; };
    console.log(`RX msg[${msg.type}]: ${msg.text}`);
    cncRoot.cncRX(msg);
};

wsCNC.init(`ws://${window.location.host}/serial`, cncRX);