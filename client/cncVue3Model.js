// Vue3 functional model for cnc server ...
let verbose = true;

const templafy = (template, vars = {}) => {
    try {
        let [keyList,values] = [Object.keys(vars).join(','),Object.values(vars)];
        let literal = new Function('exprs','let func=('+keyList+')=>`'+template+'`; return func(...exprs)');
        return literal(values);
    } catch(e) { 
        console.error(`templafy[${template}]: ${e}`);
        return ''; }
  };

const cnc = Vue.createApp({
    data: function() { return {
        tabs: cncModelData.tabs,
        buttons: cncModelData.buttons,
        params: cncModelData.params,
        macros: cncModelData.macros,
        activeTab: 0,
        activeTabView: 'buttons',
        show: {
            info: false,
            log: false,
            report: false
        },
        transcript: []
    }},
    computed: {
        activeButtons() { return this.tabs[this.activeTab].buttons.map(b=>b==='' ? {} : this.buttons[b]||{label:`${b}?`}) },
        report() { return 'TBD' },
        script() { return this.transcript.join('\n'); },
        status() { return (this.params.statusTemplates || []).map(t=>templafy(t,this.params)); }   
    },
    methods: {
        cncRX(text) {
            this.scribe(`> ${text}`);
            if (verbose) console.log(`> ${text}`);
            if (text==='ok') { 
                this.params.error = '';
                this.params.alarm = '';
                this.params.state = 'OK';
            } else if (text.startsWith('<')) {
                let report = ('state:'+text.slice(1,-1)).split('|')
                    .reduce((x,s,i,a)=>{let [k,v]=s.split(':'); x[k.toLowerCase()]=v; return x},{});
                Object.keys(report).forEach(k=>{this.params[k] = report[k];});
                if (this.params.autoQuery && !('wco' in report)) setTimeout(()=>this.pickButton(this.buttons[this.params.autoQuery],1000));
            } else if (text.startsWith('[')) { 
                let msg = text.slice(1,-1);
                if (msg.match(/G[0-9]+|TL0|PRB|VER|OPT/)) {
                    let [k,v] = msg.split(':');
                    this.params.report[k] = v;
                } else {
                    this.params.msg = msg;
                };
            } else if (text.match(/\$N|\$[0-9]+/)) {
                let [k,v] = text.split('=');
                this.params.report[k] = v;
            } else if (text.startsWith('ALARM')) { 
                alarm = text.split(':')[1];
            } else if (text.startsWith('error')) { 
                this.params.error = text.split(':')[1];
            } else if (text.startsWith('Grbl')) { 
                this.params.version = text.split(' ')[1];
            } else { 
                console.warn(`cncRX[UNKNOWN MESSAGE]: ${text}`);
            };
        },
        pickButton(b) {
            if (b.disabled) return;
            if (verbose) console.log('Button:',b)
            switch (b.action) {
                case 'gcode':
                    console.log('button:',b)
                    let glist = b.gcode.split(';');
                    console.log('glist:',glist)
                    glist.forEach(instruction=>{
                        let gcode = templafy(instruction,this.params);
                        console.log('gcode:',gcode)
                        window.cncTX.call(this,gcode); 
                        this.scribe(`< ${gcode}`);
                        if (verbose) console.log(`TX[${b.action}]: ${gcode}`);
                    });
                    break;
                case 'param':
                    if (!('param' in b)) return console.warn('Missing param name!');
                    if ('value' in b) { 
                        this.params[b.param] = b.value;
                    } else if (b.template) {
                        this.params[b.param] = templafy(b.template,this.params);
                    } else {
                        return console.warn(`NO value or template specified for param!`);
                    };
                    if (verbose) console.log(`Param ${b.param} changed to ${this.params[b.param]}!`);
                    break;
                case 'macro':  // equivalent to a series buttons...
                    let macro = (b.macro instanceof Array) ? b.macro : (this.macros?.[b.macro] || []);
                    macro.forEach(m=>this.pickButton(m));
                    break;
                case 'reset':   // Ctrl-x: soft-reset
                    window.cncTX(String.fromCharCode(0x18));
                    this.scribe(`< CTRL-X (soft reset)`);
                    break;
                case 'call':
                    this[b.call].apply(this,b.args);
                    break;
                default: {}
            };
        },
        pickTab(i) {
            this.activeTab = i; this.activeTabView = this.tabs[this.activeTab].view||'buttons'},
        popup(w,s=false) { this.show[w] = s; },
        scribe(p) {
            this.transcript.push(p);
            if (this.transcript.length>(this.params.transcriptLength||50)) this.transcript.shift();
        },
        updateParam(p,v) { this.params[p] = v; }    // reactive
    }
});
VueLib3.applyLibToApp(cnc); // extend app with VueLib3
const cncRoot = cnc.mount('#app');  // provide a window scope reference for Vue app


// Websocket setup...
// websocket object (wsCNC) defined in window scope from script loaded in html
// these functions route text messages between Vue app model and CNC serial via wsCNC

// wrapper function for clarity; sends text from Vue app (cnc) to server serial 
function cncTX(text) { console.log(text); wsCNC.send(text); };

// Add event listener for Vue app to receive server serial text
wsCNC.onRX(cncRoot.cncRX);
// start the websocket, which in turn opens serial port on server
wsCNC.connect(`ws://${window.location.host}/serial`);
