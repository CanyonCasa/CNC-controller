// Basic library of common extensions for Vue3...


// convert a comma (or other) delimited string into an array
let asList = (x,delim=/,\s*/) => x instanceof Array ? x : (x||'').split(delim);
// generates an n(=8) character unique ID of base (b=36, alphanumeric) ...
let uniqueID = (n=8,b=36) => { var u=''; while(u.length<n) u+=Math.random().toString(b).slice(2); return u.slice(-n); };

var VueLib3 = {

    // this function adds library remaining elements to the specified app...
    applyLibToApp: function(app) {
        for (let [key,value] of Object.entries(VueLib3.config||{})) app.config.globalProperties[key] = value;
        for (let [key,value] of Object.entries(VueLib3.directives||{})) app.directive(key,value);
        for (let [key,value] of Object.entries(VueLib3.components||{})) app.component(key,value);
        for (let [key,value] of Object.entries(VueLib3.plugins||{})) app.use(value);
    },

    components: {

        // automatically loads dependencies as needed before generating contents...
        'lazy-loader': {
            data: ()=>({ ready: false }),
            props: ['required', 'show'],
            methods: {
                done(x) { this.ready=x; this.$emit('ready',x); },
                load() { this.loader().then(this.done).catch(e=>console.error(e)); },
                loader: async function() {
                    //console.log('lazy-loader:',this.required);
                    if (!this.$$lazy || (!'files' in this.$lazy)) return false;
                    if (this.$$lazy.files[this.required].loaded) return true; // previously loaded maybe by different instance
                    // load could be single src or list of dependent sources; loads defines a list of file reference keys
                    let loads = (this.$$app.lazy.files[this.required].sources||[this.required]).filter(s=>!this.$$app.lazy.files[s].loaded);
                    let status = await Promise.all(loads.map(f=>{ // resolve unloaded dependencies
                        switch (this.$$app.lazy.files[f].type) {
                            case 'script': return this.loadScript(this.$$app.lazy.files[f].src);
                            case 'stylesheet': return this.loadCSS(this.$$app.lazy.files[f].src);
                            default: return false;
                        };
                    }));
                    loads.map((f,i)=>{ this.$$app.lazy.files[f].loaded = status[i]; }); // update load status and run any callbacks
                    for (let d of loads.map(f=>this.$$app.lazy.files[f].loaded && this.$$app.lazy.files[f].done).filter(Boolean))
                        { await this.$$app.lazy[d] };
                    let done = !this.$$app.lazy.files[this.required].loaded && this.$$app.lazy.files[this.required].done;
                    if (status.every(Boolean)) {
                        if (done)  await this.$$app.lazy[done](); 
                        this.$$app.lazy.files[this.required].loaded = true;
                        return true;
                    } else {
                        loads.filter(f=>!this.$$app.lazy.files[f].loaded).map(f=>console.warn(`Load failed: ${f}`));
console.warn('autoload incomplete:',this.$$app.lazy.files);
                    return false;
                    };
                },
                loadCSS(link) {
                    let elmt = document.createElement('link');
                    let attrs = { rel: 'stylesheet', type: 'text/css', href: link };
                    Object.keys(attrs).forEach(k=>elmt.setAttribute(k,attrs[k]));
                    return new Promise((resolve,reject)=>{
                        elmt.onload = evt => { resolve(true); };
                        elmt.onerror = e => { console.error('loadCSS Error:', e); reject(e); };
                        document.querySelector('head').appendChild(elmt);
                    })
                },
                loadScript(script) {
                    let elmt = document.createElement('script');
                    return new Promise((resolve,reject)=>{
                        elmt.onload = evt => { resolve(true); };
                        elmt.onerror = e => { console.error('loadScript Error:', e); reject(e); };
                        elmt.src = script;
                        document.querySelector('head').appendChild(elmt);
                    })
                },
            },
            watch: {
                show() { if (this.show&&!this.ready) this.load(); }
            },
            template: `
                <div v-show="show">
                    <slot v-if="ready">Content Goes Here!</slot>
                    <span v-if="!ready">Autoloading, please wait...</span>
                </div>`
        },
  
        // expandable block wrapper component...
        'blk-x': {
            data: () => ({expanded: false, opened: false}), // opened fired on first expand
            props: ['hdr', 'inhibit', 'init', 'menu'],
            created() {
                if (!this.init) return;
                this.expanded = true; this.opened = true;
            },
            computed: {
                expandIcon() { return this.inhibit ? 'ico-star-empty' : this.expanded ? 'expand_less' : 'expand_more'; },
                menuIcons() { return this.menu || [] }
            },
            methods: {
                expand(state) {
                    if (this.inhibit) return;
                    this.expanded = typeof state==='boolean' ? state : !this.expanded;
                    if (!this.opened && this.expanded) { this.opened = true; this.$emit('load'); };
                },
            },
            template: `
                <div class="blk-x">
                <div class="blk-x-hdr" @click.stop="expand"><i v-icon:[expandIcon]></i>{{hdr}}
                    <i v-for="i of menuIcons" class="blk-x-menu-ico right" v-icon:[i.icon] @click.stop=$emit(i.emit)></i>
                </div>
                <div class="blk-x-slot" v-if-class:none="!expanded"><slot></slot></div>
                </div>`
            },

        // linked expandable block component...
        'x-blk': {
            props: ['blk', 'hdr', 'inhibit', 'init', 'xblk'],
            data: ()=>({ expanded: false, opened: false }), // opened fired on first expand
            created() { if (!this.init&&!this.inhibit) return; this.expanded = true; this.opened = true; this.$emit('load','init'); },
            computed: { 
                expandIcon() { return this.inhibit ? 'more_horiz' : this.expanded ? 'expand_less' : 'expand_more'; }, 
            },
            methods: {
                expand(state) {
                    if (this.inhibit) return;
                    this.expanded = typeof state==='boolean' ? state : !this.expanded;
                    if (!this.opened && this.expanded) { this.opened = true; this.$emit('load','expand'); };
                    if (state==='self') this.$emit('xblk',this.blk);
                },
            },
            watch: {
                xblk: function(x,lastX) {
                    if (x===this.blk) return;
                    this.expand(x==='all');
                }
            },
            template: /*html*/`
                <div class="x-blk">
                    <div class="x-blk-hdr"><i v-icon:[expandIcon] @click.stop="expand('blk')"></i>
                    <span class="hdr-text">{{hdr}}</span>
                        <slot name="menu"></slot>
                        <i class="right" v-if-class:none="inhibit" v-icon:unfold_more.rotate45 @click.stop="expand('self')"></i>
                    </div>
                    <div class="x-blk-slot" v-if-class:none="!expanded"><slot>Not defined...</slot></div>
                </div>`
            },

        // component to add a floating element over window
        floater: {
            data: ()=>({}),
            props: ['close','title'],
            mounted() {
                function dragElement(el,anchor) {
                    function dragStart(e) {
                        e = e || window.event;
                        e.preventDefault();
                        ({ clientX:x, clientY:y } = e);     // get the mouse cursor position at startup:
                        if (adjX===undefined)
                            ([ adjX, adjY ] = [ el.offsetLeft-el.parentElement.offsetLeft, el.offsetTop-el.parentElement.offsetTop ]);
                        document.onmouseup = dragEnd;
                        document.onmousemove = dragMe;      // call a function whenever the cursor moves:
                    }
                    function dragMe(e) {
                        e = e || window.event;
                        e.preventDefault();
                        ({ clientX:newX, clientY:newY } = e);   // new cursor location
                        ({ offsetLeft:left, offsetTop:top } = el);    // last element position
                        [ x, y, dx, dy ] = [ newX, newY, newX-x, newY-y ];  // update position
                        el.style.left = (left-adjX + dx) + "px";        // set the element's new position:
                        el.style.top = (top-adjY + dy) + "px";
                    }
                    function dragEnd() {                              // stop moving when mouse button is released:
                        document.onmouseup = null;
                        document.onmousemove = null;
                    }
                    var [ x, y, dx, dy, adjX, adjY ] = [ 0, 0, 0, 0 ];  // adjX,adjY account for margin offset defined after el placement
                    (anchor||el).onmousedown = dragStart;
                };
                dragElement(this.$refs['flt'],this.$refs['fltHdr']);
            },
            template: `
                <div ref="flt">
                    <div class="floater-hdr move" ref="fltHdr">
                    <i v-show="close" class="right" v-icon:close @click="$emit('close')"></i>
                    <i class="left move" v-icon:open_with></i>
                    <span>{{title}}</span>
                    </div>
                    <div>
                    <slot>Content Goes Here!</slot>
                    </div>
                </div>`
        },

        // page layout default sections...
        generic: {
            props: ['page',"show", "user"],
            template: `<div v-html="page.content||'Loading (Generic), please wait...'" v-show="show"></div>`
        },

        'toggle-button': {
            props: ['init',"labels"],
            data: function() { return {
                state: Number(!!this.init),
                lbls: this.labels ? asList(this.labels) : ['OFF','ON']
            }},
            methods: {
                change(state) {
                    this.state = state===undefined ? 1-this.state : state ? 1 : 0;
                    this.$emit('state',!!this.state);
                }
            },
            template: `<button class="toggle-button" type="button" @click="change()">{{ lbls[state] }}</button>`
        }
    },

    directives: {

        // directive syntax: v-directive:arg.modifier="value"
        // custom directive to autosize a textarea element
        // <textarea v-autosize></textarea>
        autosize: {
            beforeMount(el) {
                let listener=function(e) {
                    if (e.type!=='input') e.target.style.height=0; // reset for mouseover to resize smaller if needed
                    if (e.target.scrollHeight!==e.target.clientHeight) e.target.style.height=32+e.target.scrollHeight+'px';
                };
                el.addEventListener('input',listener);
                el.addEventListener('mouseover',listener);
            }
        },

        // custom directive to obfuscate email contacts on web pages
        // <span v-contact:[me]>Optional initial text here</span>
        // where me represents an object: 
        //   who (i.e. dave), tld (i.e. com) and host (i.e.gmail), or domain (i.e. gmail.com) 
        //   and optional subject or subj; 
        // event defaults to click
        contact: {
            beforeMount(el, binding) {
                var ct = binding.arg;
                var mail = `${ct.who}@${ct.domain || ct.host+'.'+ct.tld}`;
                var subject = ct.subject || ct.subj || '';
                function self() {
                    if (el.innerHTML != mail) el.innerHTML = mail;  // on first click
                    window.location.href = `mailto:${mail}?subject=${subject}`;
                };
                if (!el.innerHTML) el.innerHTML = ct.who;
                const events = Object.keys(binding.modifiers).length ? Object.keys(binding.modifiers) : ['click'];
                events.forEach(e=>el.addEventListener(e,self));
            }
        },

        // directive to debounce input keystrokes; sends a single event (500ms) after typing ends 
        // example (defaults: keyup event and 500ms delay): <input type="text" v-debounce="chg">
        // example: <input type="text" v-debounce:1s.click="chg">
        // note: wrap event function with anonymous function, e.g. "()=>chg('me')"
        debounce: {
            beforeMount(el, binding) {
                function db(fn,dly) {
                    var timex=null;
                    return (...args)=>{
                        clearTimeout(timex);
                        timex = setTimeout(()=>fn.apply(binding.instance,args),dly);
                    }
                }
                const wait = Number(String(binding.arg).replace('ms','').replace('s','000')) || 500;
                const dbCB = db(binding.value,wait);
                const events = Object.keys(binding.modifiers).length ? Object.keys(binding.modifiers) : ['keyup'];
                events.forEach(e=>el.addEventListener(e,dbCB));
            }
        },
  
        // custom directive to selectively hide elements based on expiration date
        // <element v-expires='2019-06-06T12:00:00.000Z'></element>
        expires: 
            function (el, binding) {
                var now = new Date().toISOString();
                if ((binding.value||now)<now) el.style.display = 'none';
        },
        
        // custom directive to simplify icon definition across sources; 
        //   supports Google Material Design and icomoon.io custom woff
        // examples: <i v-icon:icon_name></i>
        //           <i v-icon:[expression]></i>
        //           <i v-icon="'name with spaces'"></i>
        icon: 
            function (el,binding) { // mounted and updated...
                var icon = binding.arg || binding.value || '';
                if (icon.startsWith('ico-')) {  // icomoon icons
                    if (el.dataset.icon) el.classList.remove(el.dataset.icon);
                    el.dataset.icon = icon;
                    el.classList.add(icon);
                } else {                        // material design icons
                    if (!el.classList.contains('material-icons')) el.classList.add('material-icons');
                    el.innerHTML = icon;
                };
                Object.keys(binding.modifiers).forEach(m=> el.classList.add(m));
        },

        // custom directive to conditionally add a class to an element
        // example: <element v-if-class:extra_class="test"></element>
        'if-class':
            function (el, binding) {
                if (binding.value) { el.classList.add(binding.arg); } 
                    else { el.classList.remove(binding.arg); };
        },

        // custom directive to add 'name-based' regular expression patterns to inputs and optionally filter your input to comply...
        // example: <input v-pattern:username> ==> <input pattern='[a-z0-9]{3,15}]' />
        // or dynamically assign by an expression as in 
        //   <input v-pattern="expression">, for example "<input v-pattern="['\\d{6}','6-digit code',/\\d*/]">"
        //     where expression resolves to a pattern name or defines a custom pattern array [validation_regex,description,filter_match_pattern]
        // a 'desc' modifuer returns the description as HTML content, e.g. <span v-pattern:text></span> ==> <span>Any general text input</span>
        // other modifiers filter the user input
        pattern: (function() {
            const patterns = {
                ascii: ['[\x00-\x7F]*', 'ASCII characters only',/[\x00-\x7F]*/],
                code: ['\\d{4,8}','4-8 digit activation/authorization code',/\d*/],
                email: ['^[A-Za-z0-9._#$%&+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$','Legal email address required'],
                fullname: ['[A-Za-z\\- ]+','Enter your fullname'],
                pass: ['^(?=.*\\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[\\W_]).{8,}$|\\d{4,8}','password or passcode'],
                pw: ['[A-Za-z0-9]{6,}|.{8,}','Account password/code required'],
                password: ['^(?=.*\\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[\\W_]).{8,}$','>7 characters, including lower and upper case letter, number, and special character'],
                phone: ['(?:\\+1)?\\d{10}','Enter a 10 digit phone number'],
                tag: ['[a-z0-9]{4,8}','Private security tag, 4-8 letters and/or numbers'],
                text: ["[^\\\/<>]*",'Any general text input',/[^\\\/<>]*/],
                username: ['[a-z][a-z0-9]{2,15}','Username may contain 3-16 (lowercase) letters and numbers beginning with a letter']
            };
            const mfunc = { // binding modifiers...
                lc: v=>v.toLowerCase(),                                 // force lowercase of input
                uc: v=>v.toUpperCase(),                                 // force uppercase of input
                tc: v=>v.toTitleCase(),                                 // return title case of input
                num: v=>parseFloat(v)?parseFloat(v):0,                  // force number input
                pat: v=>pattern[2] ? v.match(pattern[2])[0]||'' : v,    // test against the filter pattern, if defined
                asc: v=>v.match(patterns.ascii[2])?.[0]||''             // force ascii input only, no extended UTF8 characters 
            };
            let arg = null;
            let pattern = ['.*','default','.*']; 
            return {
                beforeMount(el, binding) {
                arg = binding.arg || binding.value;
                pattern = arg instanceof Array ? arg : patterns[arg] || pattern;
                if (binding.modifiers.desc) return el.innerHTML=pattern[1]||'';  // 'desc' modifier sets content
                el.pattern = pattern[0] || '.*'; // otherwise set pattern and title
                el.title = pattern[1] || '';
                },
                updated(el,binding) {
                    Object.keys(binding.modifiers).map(m => {if (mfunc[m]) el.value=mfunc[m](el.value)});
                }
            };
        })(),

        tip: {
            beforeMount(el, binding) {
                let tip = typeof binding.value == 'string' ? binding.value.toUpperCase() : 'bad tip' ;
                let attr = binding.modifiers.alt ? 'data-tip-alt' : 'data-tip';
                el.setAttribute(attr,tip);
            }
        }
  
    },

    plugins: {

        // fetchJSON: Plugin to add browser promise based fetch function directly to Vue app 
        // optimized (i.e. simplified) for direct GET/POST/PUT of JSON data...
        fetchJSON: {
            install: (app, options) => {
                // extract headers into object for convenience
                function getHeaders(response) {
                    var hdrs={};
                    for (var k of response.headers.keys()) { hdrs[k]=response.headers.get(k); };
                    return hdrs;
                }
    
                // safely parse raw text into json...
                // jxOK indicates successful parsing; jxError: indicates if message contains error
                function safeParseJSON(txt='') {
                    var jx={}; var jxOK=false;
                    try { jx=JSON.parse(txt); jxOK=true; } catch(e) {};
                    var jxError = jx && 'error' in jx;  // could be null
                    return {jx:jx, jxOK:jxOK, jxError:jxError};
                }

                // logging routine...
                function scribble(verbose, id) {
                    function scribe (stage,prompt,detail) { console.log(`##${id} fetch[${stage}]:`, prompt, detail); };
                    return verbose ? scribe : // true
                        verbose===undefined ? (stage,prompt,detail) =>{if (stage==='request'||stage==='response') scribe(stage,prompt,detail)} :                
                        ()=>{}; //false
                }

                // fetch function attached to app...
                async function fetchJSON(method,url,options={}) {
                    options.id = options.id || uniqueID(4,10);
                    const scribe = scribble(options.verbose,options.id);
                    options.method = method;  // add method to options, required.
                    options.url = url;        // save url to options for return with result
                    if (!options.direct) {
                        // assume json data post, format request properly with content headers...
                        if (('body' in options) && (typeof options.body=='object')) options.body = JSON.stringify(options.body);
                        options.headers = options.headers || {};
                        // automatically add json headers
                        options.headers['Accept'] = 'application/json, text/plain, */*';  
                        options.headers['Content-Type'] = 'application/json';
                    };
                    // optionally log for info...
                    scribe('request',`${options.method} ${url}`,options);
                    // make request, pass request options to response and perform post process parsing...
                    try {
                        var response = await fetch(url,options);
                    } catch (e) { 
                        response={hdrs:{}}; // failed response 
                        scribe('catch',e.toString()); 
                    };
                    // parse response...
                    scribe('response',!(response.error||response.jxError)?'OK':'ERROR',response);
                    response.request = options; // add request (options, including method and URL) to result
                    scribe('status',`${response.status} ==> ${response.statusText}`, '');
                    response.error = !response.ok ? response.status : false;
                    if (response.ok) {
                        response.hdrs = getHeaders(response);
                        scribe('headers',`(${Object.keys(response.hdrs).length})`, `${JSON.stringify(response.hdrs,null,2)}`);
                        response.raw = await response.text(); // text() returns a promise
                    };
                    var j = safeParseJSON(response.raw);
                    Object.assign(response,j);
                    scribe('json','['+(j.jxOK?'OK':'ERROR')+']', JSON.stringify(j.jx,null,2));
                    return response;
                }

                app.config.globalProperties.fetchJSON = fetchJSON;  // attach to app (i.e. this)

            },

        },

        // calls an file element to launch 'File Open' dialog, reads the returned file accordingly, 
        //  processes file info, returns result as a promise...
        // for example:
        //  <input type="file" id="data-file" class="hidden" data-type="text" accept=".json,.csv" />
        //  <button @click='getData'>Load Data</button>
        //  getData() { this.fileReadDialog('data-file','text').then( ... ).catch( ... )}
        //      Note: type (text,dataURL,array,buffer) may be passed using data- attribute or as 2nd arg to call
        //      Note: designed to use a hidden file element with a separate event function
        fileReadDialog: {
            install: (app, options) => {

                async function fileRead(file,type) {
                    const readFile = file => {
                        const fReader = new FileReader();
                        return new Promise((resolve,reject)=>{
                            fReader.onerror = (e)=>{ fReader.abort(); reject(`Problem reading file ${file.name}: ${e.toString()}`) };
                            fReader.onload = (x)=>{ resolve(fReader.result) };
                            switch (type) {
                                case 'text': fReader.readAsText(file); break;
                                case 'dataURL': fReader.readAsDataURL(file); break;
                                case 'binary': fReader.readAsBinaryString(file); break;
                                case 'buffer': 
                                default: 
                                    fReader.readAsArrayBuffer(file);
                            };
                        });
                    };
                    let temp = { file: file };
                    if (!temp.file) return console.warn('File read cancelled or file undefined...');
                    temp.date = new Date(temp.file.lastModified).style('YYYY-MM-DDTh:mm:ss a z','local');
                    temp.name = temp.file.name;
                    temp.saveAs = temp.file.name.replaceAll(' ','_').toLowerCase();
                    temp.size = temp.file.size;
                    temp.type = temp.file.type;
                    temp.contents = await readFile(temp.file);
                    return temp;
                };

                // called programatically with id of input type=file
                function fileReadDialog(id,type='text') {
                    return new Promise((resolve,reject)=>{
                        try {
                            let el = document.getElementById(id);
                            el.addEventListener('change', async function callFileRead(evt) {
                                let file = evt.target.files[0];
                                let result = await fileRead(file,el.dataset.type||type);
                                resolve(result);
                            });
                            el.click();
                        } catch(e) { reject(e) };
                    })
                }

                app.config.globalProperties.fileReadDialog = fileReadDialog;      // attach to app (i.e. this)

            }
        },

        // launches 'File SaveAs' dialog, saves the data...
        // for example:
        //  <input type="file" id="data-file" class="hidden" data-type="text" accept=".json,.csv" />
        //  <button @click='getData'>Load Data</button>
        //  getData() { this.fileReadDialog('data-file','text').then( ... ).catch( ... )}
        //      Note: type (text,dataURL,array,buffer) may be passed using data- attribute or as 2nd arg to call
        //      Note: designed to use a hidden file element with a separate event function
        fileWriteDialog: {
            install: (app, options) => {

                // called programatically with file object containing, contents, type (mime-type)...
                function fileWriteDialog(fileObj) {
                    let blob = typeof fileObj.contents==='blob' ? fileObj.contents : new Blob([fileObj.contents],{type: fileObj.type});
                    let a = document.createElement('a');
                    a.href = window.URL.createObjectURL(blob);
                    a.download = fileObj.name || fileObj.saveAs;
                    a.click();
                }

                app.config.globalProperties.fileWriteDialog = fileWriteDialog;      // attach to app (i.e. this)

            }
        },

        // stores: Add local and session storage directly to Vue app instance
        // optimized for JSON; adds getters and setters to store objects vs just strings, 
        // adds a direct access key for each object key (local and session keys get aggregated);
        //   i.e. use unique keys between local and session storage to avoid collisions
        stores: {
            install: function(app,options) {
                function safeParse(s) { try { return JSON.parse(s) } catch(e) { return undefined; } };
                let storage = {
                    get local() {
                        var ls = {};
                        Object.keys(localStorage).map(k=>ls[k]=safeParse(localStorage[k]));
                        return ls;
                    },
                    set local(obj) {
                        Object.keys(obj).forEach((k) => {
                            if (obj[k]!==undefined) {
                                localStorage[k] = JSON.stringify(obj[k]);
                                // define direct access getter/setter for each key
                                if (!(k in storage)) 
                                    Object.defineProperty(storage,k,{
                                        get() { return safeParse(localStorage[k]); },
                                        set(v) { v===undefined ? localStorage.removeItem(k) : localStorage[k] = JSON.stringify(v); }
                                    });
                            } else {
                                localStorage.removeItem(k);
                            };
                        });
                    },

                    get session() {
                        var ls = {};
                        Object.keys(sessionStorage).map(k=>ls[k]=safeParse(sessionStorage[k]));
                        return ls;
                    },
                    set session(obj) {
                        Object.keys(obj).forEach((k) => {
                            if (obj[k]!==undefined) {
                                sessionStorage[k] = JSON.stringify(obj[k]);
                                // define direct access getter/setter for each key
                                if (!(k in storage)) 
                                    Object.defineProperty(storage,k,{
                                        get() { return safeParse(sessionStorage[k]); },
                                        set(v) { v===undefined ? sessionStorage.removeItem(k) : sessionStorage[k] = JSON.stringify(v); }
                                    });
                            } else {
                                sessionStorage.removeItem(k);
                            };
                        });
                    }
                }
                // initialization: 'gets' previously stored values and then 'sets' them, which creates direct access keys...
                storage.local = storage.local;
                storage.session = storage.session;

                app.config.globalProperties.storage = storage;      // attach to app (i.e. this)
            }
        }
 
    }

};
