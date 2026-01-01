// Vue3 functional model for cnc server ...
// (C) 2025 Enchanted Engineering
//const VERSION = 1.00;   // 20250126 dvc Initial release
//const VERSION = 1.10;   // 20250129 dvc Port to RPi
//const VERSION = 1.20;   // 20250205 dvc Working remote file access
//const VERSION = 1.30;   // 20251202 dvc UI updates
const VERSION = '2.00:20260101';   // 20260101 dvc Added runtime estimate and viewer

// Vue app definition...
const cnc = Vue.createApp({
    data: function() { return {
        tabs: cncModelData.tabs,
        buttons: cncModelData.buttons,
        params: cncModelData.params,
        machine: cncModelData.machine,
        macros: cncModelData.macros,
        grblErrors: cncModelData.grblErrors,
        activeTab: 0,
        activeTabView: 'buttons',
        alert: {
            msg: '',
            style: '',
            timex: null
        },
        cmd: '',
        cmdHistory: [],
        cmdHistoryIndex: 0,
        macroBusy: false,
        reportSet: {},
        show: {
            alert: false,
            info: false,
            listing: false,
            rpi: false,
            viewer: false
        },
        transcript: [],
        transcriptLevels: ['MINIMAL','NORMAL','VERBOSE'],
        transcriptLevel: verbose ? 2 : 1,   // 0: minimal; 1: normal; 2: verbose
        view: {
            button: 'REPORT',
            info: 'log'
        },
        job : {
            active: false,
            bufSpace: cncModelData.params.cncBufferLength,
            elapsed: 0,
            line: '',
            lines: [],
            lineIndex: 0,
            processed: 0,
            sent: [],
            start: null,
            waiting: null
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
        fileDetails() { return (this.params.fileOverlayTemplate || []).map(t=>this.templafy(t,this.params.file)); },
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
        this.params.msg = `VER: ${VERSION}`;
        this.wsCNC = this.wsFactory({tag:'CNC',url:'/serial',mode:'text',listener:this.cncRX});
        this.wsFile = this.wsFactory({tag:'File',url:'/file',mode:'JSON',listener:this.fileResponse});
        this.wsRFS = this.params.wsRemote ? this.wsFactory({tag:'RFS',url:'/remote',mode:'JSON',listener:this.fileResponse}) : null;
        this.wsRPi = this.params.wsRPi ? this.wsFactory({tag:'RPi',url:'/rpi',mode:'JSON',listener:this.rpiResponse}) : null;
    },
    methods: {
        cncRX(text) {
            if (this.job.active) return this.runJob('rx',text);
            if (verbose) console.log(`[cncRX]> ${text}`);
            if (text==='ok') { 
                this.params.error = 'OK';
                this.params.alarm = 'OK';
            } else if (text.startsWith('<')) {
                let state = ('state:'+text.slice(1,-1)).split('|')
                    .reduce((x,s,i,a)=>{let [k,v]=s.split(':'); x[k.toLowerCase()]=v; return x},{});
                Object.keys(state).forEach(k=>{this.params[k] = state[k];});
                if (this.params.autoQuery && !('wco' in state)) setTimeout(()=>this.pickButton(this.buttons[this.params.autoQuery],1000));
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
                this.params.msg = this.grblErrors[this.params.error] || this.grblErrors['default'];
            } else if (text.startsWith('Grbl')) { 
                this.params.version = text.split(' ')[1];
            } else { 
                console.warn(`cncRX[UNKNOWN MESSAGE]: ${text}`);
            };
            this.scribe(`> ${text}`);
        },
        async clip(tag) {
            try {
                let text = document.getElementById(tag).innerText;
                await navigator.clipboard.writeText(text);
            } catch(err) {
                console.error('Copy to clipboard failed!');
            };
        },
        drawGCODE(tx,ty) { // draw GCODE in viewer canvas
            let drawStyle= (style) =>style==='MOVE' ? 'red' : 'blue';
            let limits = emulator.prepViewLimits();  // this provides the scaling info
            let instructions = emulator.prepViewData(); // this converts loaded job gcode into drawing instructions
            let canvas = document.getElementById('gcviewer'); // prep the canvas for a new drawing
            let size = { width: canvas.width, height: canvas.height};
            let ctx = canvas.getContext('2d');
            ctx.reset();
            // auto scale the drawing...
            let scale = Math.trunc(Math.min(size.width/limits.box.dx, size.height/limits.box.dy)*10)/10;
            ctx.scale(scale,-scale); // scale and flip the Y-axis for true cartesian system
            // compute origin location for auto centering image...
            tx = tx!==undefined ? tx : size.width/2/scale-limits.drawn.x;
            ty = ty!==undefined ? ty : size.height/2/scale+limits.drawn.y;
            ctx.translate(tx,-ty);
            // now draw the image in the viewer, instruction by instruction...
            for (let ix of instructions) {
                ctx.beginPath();
                ctx.moveTo(...ix.moveTo);
                if (ix.geometry==='arc') {
                    ctx.arc(...ix.arc);
                } else {
                    ctx.lineTo(...ix.lineTo);
                };
                ctx.strokeStyle = drawStyle(ix.stroke);
                ctx.stroke();
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
                    this.show.listing = false;
                    this.listingOffset = 0;
                    break;
                default:
                    let file = this.listing[index];
                    switch (file.type) {
                        case 'file':
                            this.show.listing = false;
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
                    this.show.listing = true;
                    break;
                case 'get':
                    let d = new Date(msg.meta.time);
                    msg.meta.date = new Date(+d-d.getTimezoneOffset()*60*1000).toISOString().replace(/:[^:]+$/,'');
                    msg.meta.lines = msg.contents.split(/\r?\n/);
                    msg.meta.count = msg.meta.lines.length;
                    this.params.file = msg.meta;
                    this.params.file.runtime = emulator.processGCODE(msg.meta.lines);
                    this.drawGCODE();
                    break;
                case 'put':
                    break;
            }
        },
        filesDialog(ref) {
            let msg = {action: 'list',  meta: this.params[ref]};
            if (msg.meta.root==='remote') { this.wsRFS.send(msg); } else { this.wsFile.send(msg); };
        },
        humanTime(difference) {    // converts a time difference in milliseconds into human readable format
            let asTimeStr = t => t>86400000 ? `${Math.floor(t/86400000)} days, ${asTimeStr(t%86400000)}` : 
                t>3600000 ? `${Math.floor(t/3600000)} hrs, ${asTimeStr(t%3600000)}` :
                t>60000 ? `${Math.floor(t/60000)} mins, ${asTimeStr(t%60000)}` : `${t/1000} secs`;
            return asTimeStr(difference);
        },
        async pickButton(b) {
            if (b.disabled) return;
            if (verbose) console.log('Button:',b)
            switch (b.action) {
                case 'gcode':
                    let glist = b.gcode.split(',');
                    glist.forEach(instruction=>{
                        let gcode = this.templafy(instruction,this.params).trim();
                        //window.cncTX(gcode);
                        this.wsCNC.send(gcode,this.params.cncTermination);
                        if (gcode!='?') this.params.msg = `< ${gcode}`
                        this.scribe(`< ${gcode}`);
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
                case 'macro':  // equivalent to a series of buttons...
                    let macro = (b.macro instanceof Array) ? b.macro : (this.macros?.[b.macro] || []);
                    for (m of macro) this.pickButton(m);
                    break;
                case 'reset':   // Ctrl-x: soft-reset
                    //window.cncTX(String.fromCharCode(0x18));
                    this.wsCNC.send(String.fromCharCode(0x18),this.params.cncTermination);
                    this.scribe(`< CTRL-X (soft reset)`);
                    break;
                case 'wait':
                    await this.wait(b.wait);
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
                case 'debug':
                    this.transcriptLevel = (this.transcriptLevel+1) % 3;
                    this.verbose = this.transcriptLevels[this.transcriptLevel]=='VERBOSE';
                    this.params.msg = `Transcript Level: ${this.transcriptLevels[this.transcriptLevel]}`
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
        postAlert(msg, style='ok', delay=4) {
            this.alert.msg = msg;
            this.alert.style = style;
            this.show.alert = true;
            console.log(JSON.stringify(this.alert,null,2));
            clearTimeout(this.alert.timex);
            this.alert.timex = setTimeout(
                ()=>{clearTimeout(this.alert.timex);this.popup('alert');this.alert.timex=null;},delay*1000);
        },
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
                    this.show.rpi = false;
                    break;
            };
        },
        rpiResponse(msg) { if (msg.error) { console.error(msg.error) } else { console.log(msg.msg)}; },
        async runJob(action, text) {
            switch (action) {
                case 'init': // initialize job
                    this.job = {
                        active: true,
                        elapsed: '',
                        lines: this.params.file.lines.slice(0),    // copy lines from active file
                        lineIndex: 0,
                        processed: 0,
                        sent: [],
                        start: + new Date()
                    };
                    if (!this.job.lines.length) {
                        this.job.active = false;
                        this.postAlert('No job appears loaded!','error');
                    }  else {
                        this.transcript = [];
                        this.scribe(`# Running job ${this.params.file.pseudo}...`);
                        setTimeout(this.runJob,100,'run');
                    };
                    break;
                case 'rx': // CNC feedback...
                    if (text==='ok') { 
                        let done = this.job.sent.shift() || 'empty';
                        this.scribe(`- ok: ${done}`);
                        this.updateJobStatus();
                    } else if (text.startsWith('<')) {
                        let state = ('state:'+text.slice(1,-1)).split('|')
                            .reduce((x,s,i,a)=>{let [k,v]=s.split(':'); x[k.toLowerCase()]=v; return x},{});
                        this.scribe(`# bf: ${state['bf']}`);
                    } else if (text.startsWith('error')) {
                        this.job.active = false;
                        let errNum = text.split(':')[1]
                        let error = this.grblErrors[errNum] || this.grblErrors['default'];
                        let line = this.job.sent[0];
                        this.scribe(`# Error returned for line ${line}`);
                        this.postAlert(`Job terminated with ERROR[${errNum}]: ${error}\n${line} (See GCODE log!)`,'error',10);
                    } else {
                        this.scribe(`~ ${text}`);
                        this.postAlert(`~ ${text}`);
                    };
                    break;
                case 'run': // process job... will be called repeatedly
                    while (this.job.lineIndex < this.job.lines.length) { 
                        this.job.line = this.job.lines[this.job.lineIndex].replace(/ +|;.*$/g,'').trim(); // get current line, stripping comments and whitespace
                        if (!this.job.line) { // ignore blank lines
                            this.job.lineIndex++;
                            this.updateJobStatus();
                            continue
                        } else if (this.job.line.startsWith('(') /* && this.job.line.endsWith(')' -- a FreeCAD comment*/) {
                            this.job.lineIndex++;
                            this.updateJobStatus();
                            this.scribe(`- [${this.job.lineIndex}]: ${this.job.line}`); // log the comment for reference
                        } else { // try to send the line...
                            // used buffer portion is total of lines+termination in sent queue...
                            let bufUsed = this.job.sent.reduce((sum,lx)=>sum+lx.length+this.params.cncTermination.length,0);
                            this.job.bufSpace = this.params.cncBufferLength - bufUsed;
                            if (this.job.bufSpace < this.job.line.length) {
                                if (!this.job.waiting) this.updateJobStatus('wait');
                                break; // leave while, not enough room in buffer to send line, wait for buffer to clear space
                            } else {
                                if (this.job.waiting) this.updateJobStatus('proceed');
                                this.wsCNC.send(this.job.line,this.params.cncTermination);
                                this.job.lineIndex++;
                                this.job.sent.push(this.job.line);
                                this.scribe(`< ${this.job.line}`);
                            };
                        };
                    };
                    if (this.job.lineIndex < this.job.lines.length) { // not done yet, wait for buffer to empty a bit and continue
                        setTimeout(this.runJob,this.params.cncBufferPause||5,'run','wait');
                    } else { // job sent, waiting on queue to clear
                        while (this.job.sent.length>0) await this.wait(10);
                        this.job.active = false;
                        this.job.elapsed = this.humanTime(+ new Date() - this.job.start)
                        this.scribe(`# Job completed successfully in ${this.job.elapsed}!`);
                        this.postAlert(`Job completed successfully in ${this.job.elapsed}!`);
                        this.updateJobStatus('done');
                    };
                    break;
                case 'abort':
                    break;
            };
        },
        save(what,where) {
            where = where || this.params.fileSave;
            let meta = { root: where, folder: '', name: 'gcode.log' };
            let contents = '';
            switch (what) {
                case 'report':
                    return
                case 'log':
                    contents = document.getElementById(what).innerText;
                    break;
                case 'file':
                    // TBD
                    return
            };
            window.fileRequest({action: 'put', meta: meta, contents: contents })
        },
        scribe(line) {
            if (!line) return;
            if (this.transcriptLevel<2 && !this.job.active) return;  // filter
            this.transcript.push(line);
            if (this.job.active) return; // don't limit transcript length
            if (this.transcript.length>(this.params.transcriptLength||50)) this.transcript.shift();
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
        updateJobStatus(bufferAction) {
            switch (bufferAction) {
                case 'wait':
                    this.job.waiting = + new Date();
                    this.scribe(`# (${this.job.lineIndex+1}): line[${this.job.line.length}] > Job buffer[${this.job.bufSpace}] waiting!`);
                    break;
                case 'proceed':
                    let after = + new Date() - this.job.waiting;
                    this.scribe(`# (${this.job.lineIndex+1}): Job buffering proceeding after ${after} ms`);
                    this.job.waiting = null;
                    break;
                case 'done':
                    this.params.msg = 'Job complete!';
                    break
                default:
                    this.job.processed++;
                    this.params.msg = `Processed: ${this.job.processed}/${this.job.lineIndex+1} (${this.job.lines.length})`;
            };
        },
        viewInfo(view) { // set or toggle log and report contents
            this.view = view=='report' ? {info:'report', button:'LOG'} : 
                view=='log' ? {info:'log', button:'REPORT'} :
                this.view.info=='log' ? {info:'report', button:'LOG'} : {info:'log', button:'REPORT'};
        },
        wait(wt,x) { return new Promise(res=>setTimeout(()=>res(x),wt)); },
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
                        //console.log(msg.data)
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
                send: function (data, termination='\r\n') {
                    let text = tmp.mode==='JSON' ? JSON.stringify(data) : data;
                    if (verbose) console.log(`<[${tmp.tag}] ${text}\n`);
                    tmp.ws.send(text + termination);
                }
            };
            if (cfg.auto!==false) tmp.connect();
            return tmp;
        }
    }
});
VueLib3.applyLibToApp(cnc); // extend app with VueLib3
const cncRoot = cnc.mount('#app');  // provide a window scope reference for Vue app
