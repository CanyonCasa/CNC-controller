// Vue3 functional model for cnc server ...

// import or Date style extension...
/// *************************************************************
/// Date Style Extension ...
/**
 * @lends Date#
 * @function style extends Date object defining a function for creating formated date strings
 * @param {string|'iso'|'form'} format - output format
 *  format string meta-characters...
 *  Y:          4 digit year, i.e. 2016
 *  M:          month, i.e. 2
 *  D:          day of month, i.e. 4
 *  N:          day of the week, i.e. 0-6
 *  SM:         long month name string, i.e. February
 *  SD:         long day name string, i.e. Sunday
 *  SZ:         long time zone name string, i.e. Mountain Standard Time
 *  LY:         leap year flag, true/false (not usable in format)
 *  h:          hour of the day, 12 hour format, unpadded, i.e. 9
 *  hh:         hour of the day, 24 hour format, padded, i.e. 09
 *  m:          minutes part hour, i.e. 7
 *  s:          seconds past minute, i.e. 5
 *  x:          milliseconds, i.e. 234
 *  a:          short meridiem flag, i.e. A or P
 *  z:          short time zone, i.e. MST
 *  e:          Unix epoch, seconds past midnight Jan 1, 1970
 *  dst:        Daylight Savings Time flag, true/false (not usable in format)
 *  ofs:        Local time offset (not usable in format)
 *  'text':     quoted text preserved, as well as non-meta characters such as spaces
 *  defined format keywords ...
 *    'form':   ["YYYY-MM-DD","hh:mm:ss"], needed by form inputs for date and time (defaults to local realm)
 *    'http':   HTTP Date header format, per RFC7231
 *    'iso':    "YYYY-MM-DD'T'hh:mm:ssZ", JavaScript standard
 *    'stamp:   filespec safe timestamp string, '20161207T212211Z'
 *  notes:
 *    1. Add a leading 0 or duplicate field character to pad result as 2 character field [MDNhms], i.e. 0M or MM
 *    2. Use Y or YYYY for 4 year or YY for 2 year
 *    3. An undefined or empty format returns an object of all fields
 * @param {'local'|'utc'} realm - flag to adjust input time to local or UTC time before styling
 *    'local':  treats input as UTC time and adjusts to local time before styling (default)
 *    'utc':    treats input as local time and adjusts to UTC before styling
 *    undefined:    leaves time unchanged, unless frmt = 'form', which assumes local
 * @return {string} - date string formatted as specified
 * 
 * @example...
 *    d = new Date();      // 2016-12-07T21:22:11.262Z
 *    d.style();           // { Y: 2016, M: 12, D: 7, h: 21, m: 22, s: 11, x: 262, z: 'MST', e:1481145731.262, a:'PM', N:3, 
 *                              SM: 'December', SD: 'Wednesday', SZ: 'Mountain Daylight Time', LY:true, dst:false, ofs: -420 }
 *    d.style().e;         // 1481145731.262
 *    d.style("MM/DD/YY"); // '12/07/16'
 *    d.style('hh:mm:ss','local')  // '14:22:11', adjusts UTC input time (d) to local time (e.g. h = 22 - 7 = 14 )
 *    d.style('hh:mm:ss','utc')    // '04:22:11', treats input time as local and adjusts to UTC (e.g. h = 21+7 % 24 = 4)
 *    d.style('SD, DD SM YYYY hh:mm:ss "GMT"').replace(/[a-z]{4,}/gi,($0)=>$0.slice(0,3))   
 *      // HTTP header date, RFC7231: 'Wed, 07 Dec 2016 21:22:11 GMT'
 *          
 */
///*************************************************************
/// Date Style Extension ...
/**
* @lends Date#
* @function style extends Date object defining a function for creating formated date strings
* @param {string|'form'|'http'|'iso'|'nice'|'stamp'|'NEW:<key>:<VALUE>'} format - output format
* @param {string|'utc'|'local'} realm - defines realm of interpretation for datetime value
* @return {string|object} - date string formatted as specified or object containing all fields
*  format string meta-characters... (note date fields in uppercase, time fields in lowercase)
*  Y:          4 digit year, i.e. 2016
*  M:          month, i.e. 2
*  D:          day of month, i.e. 4
*  N:          day of the week, i.e. 0-6
*  SM:         long month name string, i.e. February
*  SD:         long day name string, i.e. Sunday
*  SZ:         long time zone string
*  XM:         short month name string, i.e. February
*  XD:         short day name string, i.e. Sunday
*  XZ:         short time zone string
*  LY:         leap year flag, true/false (not usable in format)
*  h:          hour of the day, 12 hour format, unpadded, i.e. 9
*  hh:         hour of the day, 24 hour format, padded, i.e. 09
*  m:          minutes part hour, i.e. 7
*  mm:         minutes part hour, padded, i.e. 07
*  s:          seconds past minute, i.e. 5
*  ss:         seconds past minute, padded, i.e. 05
*  x:          milliseconds, i.e. 234
*  a:          meridiem flag, i.e. AM or PM
*  z:          time zone offset from UTC in hours, i.e. -6
*  e:          Unix epoch, seconds past midnight Jan 1, 1970
*  f:          fractional seconds past midnight Jan 1 1970, i.e. w/milliseconds (not usable in format)
*  js:         milliseconds past midnight Jan 1 1970, i.e. JavaScript time (not usable in format)
*  dst:        Daylight Saving Time flag, true/false (not usable in format)
*  ofs:        Local time offset (not usable in format)
*  'text':     quoted text preserved, as well as non-meta characters such as spaces
*  defined format keywords ...
*    'form':   ["YYYY-MM-DD","hh:mm:ss"], needed by form inputs for date and time (defaults to local realm)
*    'http':   HTTP Date header format, per RFC7231
*    'iso':    "YYYY-MM-DD'T'hh:mm:ssZ", JavaScript standard, not mutable
*    'nice':   "XD XM" D YYYY h:mma", concise human readable format, i.e Sun Apr 7 2024 8:37AM 
*    'stamp:   filespec safe timestamp string, '20161207T212211Z'
*    'NEW'     "NEW:key:value" will define a new format keyword or change an existing format, note iso is not mutable
*  notes:
*    1. Add a leading 0 or duplicate field character to pad result as 2 character field [MDNhms], i.e. 0M or MM
*    2. Use Y or YYYY for 4 year or YY for 2 year
*    3. Using a defined keyword returns a date in a predefined format
*    4. A format in the form of 'NEW:<key>:<VALUE>' defines a new keyword format or overrides an existing format
*       Note: 'iso' format cannot be mutated.
*    5. An undefined or empty format returns an object of all fields
*  realm...
*    undefined:    no change to input datetime, unless frmt = 'form', which assumes local (default)
*    'utc':        (or UTC) treats input as local time and adjusts to UTC before styling
*    'local':      (or any truthy value other than utc) treats input as UTC time and adjusts to local time before styling 
*  notes:
*    1. The realm is simply an adjustment and doesn't differentiate actual datetime value provided.
*
* @example...
*    d = new Date();      // 2016-12-07T21:22:11.262Z
*    d.style();           // { Y: 2016, M: 12, D: 7, h: 21, m: 22, s: 11, x: 262, e: 1481145731, f: 1481145731.262, js: 1481145731262,
*                              a:'PM', N:3, SM: 'December', XM: 'Dec', SD: 'Wednesday', XD: 'Wed', SZ: 'Mountain Daylight Time', XZ: 'MST',
*                              z: -6, LY:true, ofs: -420, dst:false, iso: '2016-12-07T21:22:11.262Z' }
*    d.style().e;         // 1481145731
*    d.style("MM/DD/YY"); // '12/07/16'
*    d.style('hh:mm:ss')           // '21:22:11', no adjustment to input time 
*    d.style('hh:mm:ss','local')   // '14:22:11', adjusts UTC input time (d) to local time (e.g. h = 22 - 7 = 14 )
*    d.style('hh:mm:ss','utc')     // '04:22:11', treats input time as local and adjusts to UTC (e.g. h = 21+7 % 24 = 4, next day)
*    d.style('http')   // HTTP header date, RFC7231: 'Wed, 07 Dec 2016 21:22:11 GMT'
*    d.style('form')   // HTML datetime input: [ '2016-12-07', '14:22' ]
*    d.style('NEW:short:hh:mm:ssa')    // defines a new custom format: '21:22:11PM'
*    d.style('short')                  // using the new custom format: '21:22:11PM'
*          
*/
if (!Date.prototype.style) Date.prototype.style = function(frmt,realm) {
    const STYLE = {
      DAYS: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
      MONTHS: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      RE: /Y(?:YYY|Y)?|[SX][MDZ]|0?([MDNhms])\1?|[aexz]|([\'\"])(.*?)\2/g,  // Date.prototpye.style parsing pattern
      formats: {
          form: 'YYYY-MM-DD hh:mm',
          http: 'XD, DD XM YYYY hh:mm:ss "GMT"',
          nice: 'XM D YYYY h:mma',
          stamp: 'YMMDDThhmmss'
      }
    };
    let sign = (realm || frmt=='form') ? (String(realm).toLowerCase()=='utc' ? -1 : 1) : 0; // to utc, to local, or no change
    let dx = sign ? new Date(this-sign*this.getTimezoneOffset()*60*1000) : this;
    let zone = dx.toString().split('(')[1].replace(')','');
    let zx = zone.replace(/[a-z ]/g,'');
    let base = dx.toISOString();
    switch (frmt||'') {
        case 'form': return dx.style(STYLE.formats.form).split(' '); // values for form inputs
        case 'iso': return (realm && sign==1) ? base.replace(/z/i,zx) : base;   // ISO (Zulu time) or ISO-like localtime
        case 'stamp': return dx.style(STYLE.formats.stamp)+((realm && sign==1)?'z':'Z');    // filespec safe timestamp
        case '':  // object of date field values
            let [Y,M,D,h,m,s,ms] = base.split(/[\-:\.TZ]/);
            let f = +dx*0.001;
            return { Y:+Y, M:+M, D:+D, h:+h, m:+m, s:+s, x:+ms, e:Math.floor(f), f: f, js: +dx, a:h<12 ?"AM":"PM", N:dx.getDay(),
                SM: STYLE.MONTHS[M-1], XM: STYLE.MONTHS[M-1].substring(0,3), SD: STYLE.DAYS[dx.getDay()], XD: STYLE.DAYS[dx.getDay()].substring(0,3), 
                SZ:zone, XZ: zx, z: -dx.getTimezoneOffset()/60, LY: Y%4==0&&(Y%100==Y%400), ofs: -dx.getTimezoneOffset(),
                dst: !!(new Date(1970,1,1).getTimezoneOffset()-dx.getTimezoneOffset()), iso: dx.toISOString() };
        default:  // other defined or arbitrary formats
            if (frmt in STYLE.formats) return dx.style(STYLE.formats[frmt]);    // other defined styles
            if (frmt.startsWith('NEW:')) {                                      // creates a new defined style
                let fields = frmt.split(':').slice(1);
                STYLE.formats[fields[0]] = fields.slice(1).join(':');
                return dx.style(STYLE.formats[fields[0]]);
            };
            // any arbitrary format...
            let pad = (s) => ('0'+s).slice(-2);
            let tkn = dx.style(); tkn['YYYY']=tkn.Y; tkn['hh']=('0'+tkn['h']).substr(-2); if (tkn['h']>12) tkn['h']%=12;
            return (frmt).replace(STYLE.RE,$0=>$0 in tkn ? tkn[$0] : $0.slice(1) in tkn ? pad(tkn[$0.slice(1)]) : $0.slice(1,-1));
    };
  };
  

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
        cmd: '',
        reportSet: {},
        show: {
            info: false,
            log: false,
            report: false
        },
        transcript: [],
        transcriptLevel: verbose ? 2 : 1,   // 0: minimal; 1: normal; 2: verbose
        transcriptLast: ''
    }},
    computed: {
        activeButtons() { 
            let tab = this.tabs[this.activeTab];
            let buttons = ('shift' in tab) ? tab.buttons[tab.shift] : tab.buttons;
            if (tab.view==='keyboard') return buttons.map(b=>b==='' ? {} : this.buttons[b]||{action:'key',key:b});
            return buttons.map(b=>b==='' ? {} : this.buttons[b]||{label:`${b}?`});
        },
        fileDetails() { return (this.params.fileOverlayTemplates || []).map(t=>templafy(t,this.params.file)); },
        overlay() { return this.tabs[this.activeTab].overlay || '' },
        report() { return 'Machine Report...\n' + Object.entries(this.reportSet).map(e=>`  ${e[0]}: ${e[1]}`).join('\n')+'\n...End of Report'; },
        script() { return this.transcript.join('\n'); },
        status() { return (this.params.statusTemplates || []).map(t=>templafy(t,this.params)); },
    },
    methods: {
        cncRX(text) {
            let last = '';
            if (verbose) console.log(`> ${text}`);
            if (text==='ok') { 
                this.params.error = 'OK';
                this.params.alarm = 'OK';
                last = 'ok';
            } else if (text.startsWith('<')) {
                let state = ('state:'+text.slice(1,-1)).split('|')
                    .reduce((x,s,i,a)=>{let [k,v]=s.split(':'); x[k.toLowerCase()]=v; return x},{});
                Object.keys(state).forEach(k=>{this.params[k] = state[k];});
                last = ('wco' in state) ? 'wco' : null;
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
            } else if (text.startsWith('Grbl')) { 
                this.params.version = text.split(' ')[1];
            } else { 
                console.warn(`cncRX[UNKNOWN MESSAGE]: ${text}`);
            };
            this.scribe(last, `> ${text}`);
        },
        fileResponse(msg) {
            console.log(typeof(msg),msg);
            switch (msg.action) {
                case 'list':
                    window.fileRequest({action: 'get', meta: msg.listing[3]});
                    break;
                case 'get':
                    msg.meta.lines = msg.contents.split(/\r?\n/).length;
                    msg.meta.date = (new Date(msg.meta.time)).style('nice','local');
                    this.params.file = msg.meta;
                    this.params.file.contents = msg.contents;
                    break;
                case 'put':
                    break;
            }
        },
        async filesDialog(ref) {
            window.fileRequest({action: 'list',  meta: this.params[ref]});
        },
        async pickButton(b) {
            if (b.disabled) return;
            if (verbose) console.log('Button:',b)
            switch (b.action) {
                case 'gcode':
                    let glist = b.gcode.split(';');
                    glist.forEach(instruction=>{
                        let gcode = templafy(instruction,this.params).trim();
                        window.cncTX.call(this,gcode);
                        this.scribe('', `< ${gcode}`);
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
                    for (m of macro) await this.pickButton(m);
                    break;
                case 'reset':   // Ctrl-x: soft-reset
                    window.cncTX(String.fromCharCode(0x18));
                    this.scribe('', `< CTRL-X (soft reset)`);
                    break;
                case 'wait':
                    await ((wt) =>(new Promise(res=>setTimeout(res,wt))))(b.wait);
                    break;
                case 'call':
                    this[b.call].apply(this,b.args);
                    break;
                case 'key':
                    switch (b.key) {
                        case 'bksp': this.cmd = this.cmd.slice(0,-1); break;
                        case 'enter': await this.pickButton({action: 'gcode', gcode: this.cmd}); this.cmd = ''; break;
                        default: this.cmd += b.key;
                    };                 
                    //window.document.getElementById('cmd').value = this.cmd;
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
            this.activeTab = i; this.activeTabView = this.tabs[i].view||'buttons'},
        popup(w,s=false) { this.show[w] = s; },
        scribe(tag, line) {
            if (tag===null || !line) return;
            if (tag && this.transcriptLast===tag  && this.transcriptLevel<2) return;  // filter
            this.transcriptLast = tag;
            this.transcript.push(line);
            if (this.transcript.length>(this.params.transcriptLength||50)) this.transcript.shift();
        },
        wsStatus() {
            this.params.wsEnabled = !this.params.wsEnabled;
            if (this.params.wsEnabled) { wsCNC.connect(); } else { wsCNC.disconnect(); };
        }
    }
});
VueLib3.applyLibToApp(cnc); // extend app with VueLib3
const cncRoot = cnc.mount('#app');  // provide a window scope reference for Vue app


// Websocket setup...
// websocket objects (wsCNC,wsFile) defined in global scope from script loaded in html
// these functions route text messages between Vue app model and websockets

// wrapper function for clarity; sends text from Vue app (cnc) to server serial 
function cncTX(text) { wsCNC.send(text); };
// Add event listener for Vue app to receive server serial text
wsCNC.onData(cncRoot.cncRX);
// start the websocket, which in turn opens serial port on server
wsCNC.connect(`ws://${window.location.host}/serial`);

// wrapper function for clarity; sends JSON req from Vue app (cnc) to file server 
function fileRequest(req) { wsFile.send(req); };
// Add event listener for Vue app to receive file server response
wsFile.onData(cncRoot.fileResponse);
// start the websocket, which in turn opens serial port on server
wsFile.connect(`ws://${window.location.host}/file`);
