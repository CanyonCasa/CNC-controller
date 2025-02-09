// Vue3 functional model for cnc server ...
// (C) 2025 Enchanted Engineering
//const VERSION = 1.00;   // 20250126 dvc Initial release
//const VERSION = 1.10;   // 20250129 dvc Port to RPi
const VERSION = 1.20;   // 20250205 dvc Working remote file access


// Vue app definition...
const cnc = Vue.createApp({
    data: function() { return {
        tabs: cncModelData.tabs,
        buttons: cncModelData.buttons,
        params: cncModelData.params,
        macros: cncModelData.macros,
        activeTab: 0,
        activeTabView: 'buttons',
        cmd: '',
        cmdHistory: [],
        cmdHistoryIndex: 0,
        reportSet: {},
        show: {
            info: '',
            listing: '',
            rpi: ''
        },
        transcript: [],
        transcriptLevel: verbose ? 2 : 1,   // 0: minimal; 1: normal; 2: verbose
        transcriptLast: '',
        job : {
            active: false,
            lines: [],
            lineIndex: 0,
            sent: [],
        },
        listing: [],
        listingOffset: 0
        }},
    computed: {
        activeButtons() { 
            let tab = this.tabs[this.activeTab];
            let buttons = ('shift' in tab) ? tab.buttons[tab.shift] : tab.buttons;
            if (tab.view==='keyboard') return buttons.map(b=>b==='' ? {} : this.buttons[b]||{action:'key',key:b});
            return buttons.map(b=>b==='' ? {} : this.buttons[b]||{label:`${b}?`});
        },
        fileButtons() { return Object.keys(this.params.fileButtons).map(k=>this.buttons[this.params.fileButtons[k]]); },
        fileDetails() { return (this.params.fileOverlayTemplates || []).map(t=>this.templafy(t,this.params.file)); },
        listingSorted() {
            return [...(this.listing.map((f,i)=>(f.type==='dir'?{i:i,n:`[${f.name}]`}:null)).filter(x=>x)),
                    ...(this.listing.map((f,i)=>(f.type==='file'?{i:i,n:f.name}:null)).filter(x=>x))];
        },
        subListing() { return [...this.listingSorted.slice(this.listingOffset*6),...[{},{},{},{},{},{}]].slice(0,6); },
        overlay() { return this.tabs[this.activeTab].overlay || '' },
        report() { return 'Machine Report...\n' + Object.entries(this.reportSet).map(e=>`  ${e[0]}: ${e[1]}`).join('\n')+'\n...End of Report'; },
        script() { return this.transcript.join('\n'); },
        status() { return (this.params.statusTemplates || []).map(t=>this.templafy(t,this.params)); },
        wsMsg() { return this.params.wsEnabled ? 'OFF' : 'ON' }
    },
    created() {
        // websocket setup... these functions route text/JSON messages between Vue app and endpoint websockets
        this.wsCNC = this.wsFactory({tag:'CNC',url:'/serial',mode:'text',listener:this.cncRX});
        this.wsFile = this.wsFactory({tag:'File',url:'/file',mode:'JSON',listener:this.fileResponse});
        this.wsRFS = this.params.wsRemote ? this.wsFactory({tag:'RFS',url:'/remote',mode:'JSON',listener:this.fileResponse}) : null;
        this.wsRPi = this.params.wsRPi ? this.wsFactory({tag:'RPi',url:'/rpi',mode:'JSON',listener:this.rpiResponse}) : null;
    },
    methods: {
        cncRX(text) {
            let last = '';
            if (verbose) console.log(`[cncRX]> ${text}`);
            if (text==='ok') { 
                this.params.error = 'OK';
                this.params.alarm = 'OK';
                if (this.job.active) this.runJob('ok');
                last = 'ok';
            } else if (text.startsWith('<')) {
                let state = ('state:'+text.slice(1,-1)).split('|')
                    .reduce((x,s,i,a)=>{let [k,v]=s.split(':'); x[k.toLowerCase()]=v; return x},{});
                Object.keys(state).forEach(k=>{this.params[k] = state[k];});
                last = ('wco' in state) ? 'wco' : null;
                if (!this.job.active && this.params.autoQuery && !('wco' in state)) setTimeout(()=>this.pickButton(this.buttons[this.params.autoQuery],1000));
            } else if (text.startsWith('[')) { 
                let msg = text.slice(1,-1);
                if (msg.match(/G[0-9]+|TL0|PRB|VER|OPT/)) {
                    let [k,v] = msg.split(':');
                    this.reportSet[k] = v;
                } else {
                    this.params.msg = msg;
                };
            } else if (text.match(/\$N|\$[0-9]+/)) {
                let [k,v] = text.split('=');
                this.reportSet[k] = v;
            } else if (text.startsWith('ALARM')) { 
                alarm = text.split(':')[1];
            } else if (text.startsWith('error')) { 
                this.params.error = text.split(':')[1];
                if (this.job.active) this.runJob('error');
            } else if (text.startsWith('Grbl')) { 
                this.params.version = text.split(' ')[1];
            } else { 
                console.warn(`cncRX[UNKNOWN MESSAGE]: ${text}`);
            };
            this.scribe(last, `> ${text}`);
        },
        async clip(tag) {
            try {
                let text = document.getElementById(tag).innerText;
                await navigator.clipboard.writeText(text);
            } catch(err) {
                console.error('Copy to clipboard failed!');
            };
        },
        filePick(index){
            switch (index) {
                case 'next':
                    if (this.listingSorted.length > 6*(this.listingOffset+1)) this.listingOffset += 1;
                    break;
                case 'previous':
                    if (this.listingOffset > 0) this.listingOffset -= 1;
                    break;
                case 'close':
                    this.show.listing = '';
                    this.listingOffset = 0;
                    break;
                default:
                    let file = this.listing[index];
                    switch (file.type) {
                        case 'file':
                            this.show.listing = '';
                            this.listingOffset = 0;
                            let rqst = {action: 'get', meta: file}
                            if (file.root==='remote') { this.wsRFS.send(rqst) } else { this.wsFile.send(rqst) };
                            break;
                        case 'dir':
                            this.listing = file.listing;
                            this.listingOffset = 0;
                            break;
                    };
            };
        },
        fileResponse(msg) {
            if (msg.error) {
                console.error('fileResponse',error);
                this.params.error = 'WS?';
            } else if (verbose) {
                console.log('fileResponse:',msg);
            };
            switch (msg.action) {
                case 'list':
                    this.listing = msg.listing || [];
                    this.show.listing = 'listing';
                    break;
                case 'get':
                    let d = new Date(msg.meta.time);
                    msg.meta.date = new Date(+d-d.getTimezoneOffset()*60*1000).toISOString().replace(/:[^:]+$/,'');
                    msg.meta.lines = msg.contents.split(/\r?\n/);
                    msg.meta.count = msg.meta.lines.length;
                    this.params.file = msg.meta;
                    break;
                case 'put':
                    break;
            }
        },
        filesDialog(ref) {
            let msg = {action: 'list',  meta: this.params[ref]};
            if (msg.meta.root==='remote') { this.wsRFS.send(msg); } else { this.wsFile.send(msg); };
        },
        async pickButton(b) {
            if (b.disabled) return;
            if (verbose) console.log('Button:',b)
            switch (b.action) {
                case 'gcode':
                    let glist = b.gcode.split(',');
                    glist.forEach(instruction=>{
                        let gcode = this.templafy(instruction,this.params).trim();
                        window.cncTX(gcode);
                        this.scribe('', `< ${gcode}`);
                        if (verbose) console.log(`TX[${b.action}]: ${gcode}`);
                    });
                    break;
                case 'param':
                    if (!('param' in b)) return console.warn('Missing param name!');
                    if ('value' in b) { 
                        this.params[b.param] = b.value;
                    } else if (b.template) {
                        this.params[b.param] = this.templafy(b.template,this.params);
                    } else {
                        return console.warn(`NO value or template specified for param!`);
                    };
                    if (verbose) console.log(`Param ${b.param} changed to ${this.params[b.param]}!`);
                    break;
                case 'macro':  // equivalent to a series buttons...
                    let macro = (b.macro instanceof Array) ? b.macro : (this.macros?.[b.macro] || []);
                    for (m of macro) this.pickButton(m);
                    break;
                case 'reset':   // Ctrl-x: soft-reset
                    window.cncTX(String.fromCharCode(0x18));
                    this.scribe('', `< CTRL-X (soft reset)`);
                    break;
                case 'wait':
                    await ((wt) =>(new Promise(res=>setTimeout(()=>res,wt))))(b.wait);
                    break;
                case 'call':
                    this[b.call].apply(this,b.args);
                    break;
                case 'key':
                    switch (b.key) {
                        case 'bksp': this.cmd = this.cmd.slice(0,-1); break;
                        case 'enter': 
                            await this.pickButton({action: 'gcode', gcode: this.cmd}); 
                            this.cmdHistory.push(this.cmd);
                            if (this.cmdHistory.length>this.params.cmdHistoryLength) this.cmdHistory.shift();
                            this.cmd = '';
                            this.cmdHistoryIndex = this.cmdHistory.length;
                            break;
                        case 'hback':
                            this.cmdHistoryIndex = Math.max(0,this.cmdHistoryIndex-1);
                            this.cmd = this.cmdHistory[this.cmdHistoryIndex] || '';
                            break;
                        case 'hadv':
                            this.cmdHistoryIndex = Math.min(this.cmdHistory.length+1,this.cmdHistoryIndex+1);
                            this.cmd = this.cmdHistory[this.cmdHistoryIndex] || '';
                            break;
                        default: 
                            this.cmd += b.key;
                    };                 
                    break;
                case 'shift':
                    let tab = this.tabs[this.activeTab];
                    tab.shift = (tab.shift + 1) % tab.buttons.length;
                    break;
                default: {
                    console.log(`UNKONW button action: '${b.action}`);
                }
            };
        },
        pickTab(i) {
            this.activeTab = i; 
            this.activeTabView = this.tabs[i].view||'buttons';
        },
        popup(w,s=false) { this.show[w] = s; },
        rpi(action) {
            switch (action) {
                case 'reboot':
                case 'halt':
                case 'server':
                case 'client':
                    if (this.wsRPi) this.wsRPi.send({action: action});
                    break;
                case 'reload':
                    window.location.reload();
                    break;
                case 'ws':
                    this.params.wsEnabled = !this.params.wsEnabled;
                    if (this.params.wsEnabled) { this.wsCNC.connect(); } else { this.wsCNC.disconnect(); };
                    break;
                case 'close':
                    this.show.rpi = '';
                    break;
            };
        },
        rpiResponse(msg) { if (msg.error) {console.error(msg.error)} else {console.log(msg.msg)}; },
        async runJob(action) {
            switch (action) {
                case 'init':
                    this.job = { // initialize job
                        active: true,
                        lines: this.params.file.lines.slice(0),    // copy lines from active file
                        lineIndex: 0,
                        sent: []
                    };
                    if (!this.job.lines.length) {
                        this.job.active = false;
                        alert('No job appears loaded!');
                    }  else {
                        this.transcript = [];
                        this.scribe('', `# Running job ${this.params.file.pseudo}...`);
                        setTimeout(()=>this.runJob(),0);
                    };
                    break;
                case 'ok':
                    this.job.sent.shift();
                    break;
                case 'error':
                    this.job.active = false;
                    this.scribe('', `# Error returned for line ${this.job.sent[0]}`);
                    alert('Job terminated with ERROR! See GCODE log!');
                    break;
                default: // process job...
                    while (this.job.lineIndex < this.job.lines.length) { 
                        let line = this.job.lines[this.job.lineIndex].replace(/ +|;.*$/g,'').trim(); // get current line, stripping comments and whitespace
                        if (!line) { // ignore blank lines
                            this.job.lineIndex++;
                        } else { // load buffer uf line fits
                            let bufSpace = this.params.cncBufferLength - this.job.sent.reduce((sum,lx)=>sum+lx.length+2,0); // total of lines sent + \r\n for each line
                            if (bufSpace > line.length+2) {    // room in CNC buffer to send next line.
                                this.job.sent.push(line);
                                window.cncTX(line);
                                this.scribe('', `< ${line}`);
                                this.job.lineIndex++;
                            } else {
                                break; // while
                            };
                        };
                    };
                    if (this.job.lineIndex < this.job.lines.length) { // not done yet
                        setTimeout(()=>this.runJob(),0);
                    } else { // wait for queue to clear
                        let wait = (wt,x) => new Promise(res=>setTimeout(()=>res(x),wt));
                        await Promise.race([
                            wait(2000,'timeout'),
                            new Promise(async res=>{ while(this.job.sent.length > 0) {await wait(0);}; res('done'); }) // looping check empty queue
                        ]);
                        this.job.active = false;
                        this.scribe('', '# Job completed successfully!');
                        alert('Job completed successfully!')
                    };
            };
        },
        save(what,where) {
            where = where || this.params.fileSave;
            let meta = { root: where, folder: '' };
            switch (what) {
                case 'report':
                case 'log':
                    msg.contents = document.getElementById(what).innerText;
                    break;
                case 'file':
                    // TBD
            };
            window.fileRequest({action: 'put', meta: meta })
        },
        scribe(tag, line) {
            if (tag===null || !line) return;
            if (tag && this.transcriptLast===tag  && this.transcriptLevel<2 && !this.job.active) return;  // filter
            this.transcriptLast = tag;
            this.transcript.push(line);
            if (!this.job.active && this.transcript.length>(this.params.transcriptLength||50)) this.transcript.shift();
        },
        templafy (template, vars = {}) {    // wrapper function to evaluate template literals...
            try {
                let [keyList,values] = [Object.keys(vars).join(','),Object.values(vars)];
                let literal = new Function('exprs','let func=('+keyList+')=>`'+template+'`; return func(...exprs)');
                return literal(values);
            } catch(e) { 
                console.error(`templafy[${template}]: ${e}`);
                return ''; 
            }
        },
        trash() { this.transcript = []; },
        wsFactory(cfg) {    // generic websocket wrapper: cfg:{tag:'CNC',url:'/seral',mode:'text', listener: this.cncRX, auto: true}
            let tmp = {
                listener: cfg.listener,
                mode: cfg.mode==='JSON' ? 'JSON' : 'text',
                connected: false,
                reconnect: cfg.reconnect!==false,
                tag: cfg.tag || 'Generic',
                url: (cfg.url.startsWith('ws:')) ? cfg.url : `ws://${window.location.host}${cfg.url}`,
                ws: null,
                connect: function connect() {
                    if (tmp.ws) tmp.ws = null;          // destroy any previous websocket
                    tmp.ws = new WebSocket(tmp.url);    // create a new websocket
                    if (verbose) console.log(`${tmp.tag} websocket created...`);
                    tmp.ws.addEventListener('error',(e)=>console.error);
                    tmp.ws.addEventListener('message',(msg)=>{
                        console.log(msg.data)
                        let text = msg.data.replace(/\r?\n|\r/,'');
                        if (verbose) console.log(`>[${tmp.tag}] ${text}`);
                        let data = tmp.mode==='JSON' ? JSON.parse(text) : text;
                        if (tmp.listener) tmp.listener(data);
                    });
                    tmp.ws.addEventListener('open',()=>{ tmp.connected=true; console.log(`${tmp.tag} websocket connected`); });
                    tmp.ws.addEventListener('close',()=>{
                        tmp.connected = false;
                        console.log(`${tmp.tag} websocket disconnected`);
                        if (tmp.reconnect) setTimeout(tmp.connect,1000);
                });
                },
                disconnect: function () {
                    tmp.ws.close();
                    if (verbose) console.log(`${tmp.tag} websocket destroyed!`);
                },
                send: function (data) {
                    let text = tmp.mode==='JSON' ? JSON.stringify(data) : data + '\r\n';
                    if (verbose) console.log(`<[${tmp.tag}] ${text}`);
                    tmp.ws.send(text);
                }
            };
            if (cfg.auto!==false) tmp.connect();
            return tmp;
        }
    }
});
VueLib3.applyLibToApp(cnc); // extend app with VueLib3
const cncRoot = cnc.mount('#app');  // provide a window scope reference for Vue app
