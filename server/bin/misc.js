/***
 * @module misc.js
 * This modules provides support methods and declarations specific to the CNC server
 * (c) 2025 Enchanted Engineering, MIT license
 * @example
 *   const misc = require('./misc');
 */


///*************************************************************
/// Dependencies...
require('./Extensions2JS');
const frmt = require('util').format;
const fsp = require('fs').promises;
const path = require('path');
const stream = require('stream');

///*************************************************************
/// definitions...
var misc = {};   // container variable

///*************************************************************
/// Process error handling for graceful exit...
let cleanup = {
    callback: (code)=>{
        scribe.write('','flush',[`Graceful exit[${code}]...`]); // default callback
    },
    delay: 400,
    called: false   // flag to prevent circular calls.
};
let gracefulExit = function (code=1) { // graceful exit call...
      if (!cleanup.called) {
        cleanup.called = true;
        cleanup.callback(code);  // do app specific cleaning once before exiting
        setTimeout(process.exit,cleanup.delay,code);  // no stopping!
      };
    };
process.on('beforeExit', function (code) { gracefulExit(code); });  // catch clean exit ...
process.on('exit', function (code) { gracefulExit(code); });        // catch forced exit ...
process.on('SIGINT', function () { gracefulExit(2); });             // catch ctrl+c event
//catch uncaught exceptions, trace, then exit gracefully...
process.on('uncaughtException', function(e) { console.error('Uncaught Exception...\n',e.stack||e); gracefulExit(99); });

///*************************************************************
/// HTTP Error Messaging Service...
const httpCodes = {
    '200': "OK",                        // success messages
    '201': "Created",
    '202': "Accepted",
    '304': "Not Modified",              // Redirection messages
    '400': "Bad Request",
    '401': "NOT Authorized!",           // client errors
    '403': "Forbidden",
    '404': "File NOT found!",
    '405': "Method Not Allowed",
    '413': "Payload Too Large",
    '500': "Internal Server Error",     // server errors
    '501': "Not Supported",
    '503': "Service Unavailable"
};
/**
 * @function httpStatusMsg implements unified (JSON) error message formating for http server responses
 * @param {string|number|object} error - input error code
 * @return {{}} - object suitable for delivery as JSON
 */
misc.httpStatusMsg = error => {
    const validCode = (c) => Object.keys(httpCodes).includes(String(c));
    let c =  validCode(error) ? parseInt(error) : 500;
    let e = { error: c>399, code: c, msg: httpCodes[String(error)]||'UNKNOWN ERROR'};
        e.detail = e.msg=='UNKNOWN ERROR' ? error.toString() : '';
    return e
};

///*************************************************************
/// mime-types lookup ...
let mimes = { // define most common mimeTypes, extend/override with configuration
    'bin': 'application/octet-stream',
    'css': 'text/css', 
    'csv': 'text/csv', 
    'gz': 'application/gzip',
    'gif': 'image/gif',
    'htm': 'text/html',
    'html': 'text/html',
    'ico': 'image/vnd.microsoft.icon',
    'jpg': 'image/jpeg',
    'js': 'text/javascript',
    'json': 'application/json', 
    'md': 'text/markdown',
    'mpg': 'video/mpeg',
    'png': 'image/png', 
    'pdf': 'application/pdf', 
    'txt': 'text/plain',
    'xml': 'application/xml'
};
/**
 * @function mimeType returns the mime-type for a given extension or vice versa
 * @param {string} mime - lookup key
 * @param {*} fallback - default lookup
 * @return {string} - mime-type for extension or extension for mime-type
 */
misc.mimeType = (mime) => mimes[mime.replace('.','')] || mimes['bin'];   // application/octet-stream fallback

///*************************************************************
// scribe color stylings...
var frmtCodes = {
    reset: [0, 0],
  
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29],
  
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    gray: [90, 39],
    grey: [90, 39],
  
    brightRed: [91, 39],
    brightGreen: [92, 39],
    brightYellow: [93, 39],
    brightBlue: [94, 39],
    brightMagenta: [95, 39],
    brightCyan: [96, 39],
    brightWhite: [97, 39],
  
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
  
    bgBrightRed: [101, 49],
    bgBrightGreen: [102, 49],
    bgBrightYellow: [103, 49],
    bgBrightBlue: [104, 49],
    bgBrightMagenta: [105, 49],
    bgBrightCyan: [106, 49],
    bgBrightWhite: [107, 49]
};
function asStyle(styles,txt) {
    styles.forEach(s=>{ txt = (s in frmtCodes ? frmtCodes[s].map(c=>'\u001b[' + c + 'm') : ['','']).join(txt); });
    return txt;
};
  
// scribe  i.e. application logger, singleton object (worker)...
var scribe = {
    buffer: '',
    busy: false,
    format: (prompt$,vars) => new Function("let ctx=this; return `"+prompt$+"`;").call(vars), // ctx->vars->this->ctx
    label: 'SCRIBE  ',  // tag formatted for output
    level: 4,           // rank equivalent for defined mask
    // note levels, styles, and text must track
    levels: ['dump', 'extra', 'trace', 'debug', 'log', 'info', 'warn', 'error', 'fatal', 'note', 'flush'],
    mask: lvl => { if (scribe.levels.includes(lvl)) scribe.level = scribe.rank(lvl); return scribe.levels[scribe.level]; },
    rank: lvl => scribe.levels.indexOf(lvl),
    saveTranscript: async function() {
        if (scribe.busy) return;       // already in process of saving transcript, just buffer new input
        scribe.busy = true;
        let tmp = scribe.buffer;
        scribe.buffer = '';
        let stat = {};
        try { stat = await fsp.stat(scribe.transcript.file); } catch(e) {};   // undefined if not found
        if ((stat.size+tmp.length)>scribe.transcript.fsize) {   // roll the transcript log on overflow
            let dx = new Date().style('stamp','local');
            let parts = path.parse(scribe.transcript.file);
            let bak = path.normalize(parts.dir + '/' + parts.name +'-' + dx + parts.ext);
            await fsp.rename(scribe.transcript.file,bak);     // rename log to backup
            scribe.write(scribe.label,'trace',[`Rolled log: ${bak} [${stat.size}]`]);
        };
        await fsp.writeFile(scribe.transcript.file,tmp,{encoding:'utf8',flag:'a'});   // write tmp buffer to transcript file
        scribe.busy=false;
    },
    styles: [['gray','dim'], ['magenta'], ['magenta','bold'], ['cyan','bold'], ['white'], ['green'], 
        ['yellow','bold'], ['red'], ['bgRed','white','bold'], ['brightBlue'], ['bgCyan','black']],
    tag: 'scribe',
    text: ['DUMP ', 'EXTRA', 'TRACE', 'DEBUG', 'LOG  ', 'INFO ', 'WARN ', 'ERROR', 'FATAL', 'NOTE ', 'FLUSH'],
    toTranscript: function(text,flush) {
        scribe.buffer += text + (flush ? '\n\n' : '\n');    // extra linefeed for "page-break" when flushing
        if ((scribe.buffer.length>scribe.transcript.bsize) || flush) 
          scribe.saveTranscript().catch(e=>{ console.error(`Transcripting ERROR: ${e.message||e.toString()}`); });
    },
    transcript: {
        file: 'scribe.log',
        bsize: 10000,
        fsize: 100000
    },
    verbose: false,
    write: function(label,level,args) {
        let stamp = new Date().style('iso','local');
        let rank = scribe.rank(level);
        let msg = frmt.apply(this,args);
        let prefix = [stamp,scribe.text[rank],label||scribe.label].join(' ') + ' ';
        let lines = frmt.apply(this,args).replace(/\n/g,'\n'+' '.repeat(prefix.length));  // break msg lines and add blank prefix
        if (rank >= scribe.level || level=='note') console.log(asStyle(scribe.styles[rank],prefix + lines));
        if (level!='note') scribe.toTranscript(prefix + msg.replace(/\n/g,'|'), level=='fatal'||level=='flush');
    }
};
scribe.mask('log'); // default level
// scribe instance object prototype
const scribePrototype = {
    format: scribe.format,
    mask: scribe.mask,
    dump: function(...args) { if (scribe.verbose) scribe.write(this.label,'dump',args) },   // always transcript only, no console output
    extra: function(...args) { scribe.write(this.label,'extra',args) }, // verbose trace
    trace: function(...args) { scribe.write(this.label,'trace',args) }, // verbose debug
    debug: function(...args) { scribe.write(this.label,'debug',args) },
    log: function(...args) { scribe.write(this.label,'log',args) },
    info: function(...args) { scribe.write(this.label,'info',args) },
    warn: function(...args) { scribe.write(this.label,'warn',args) },
    error: function(...args) { scribe.write(this.label,'error',args) },
    fatal: function(...args) { scribe.write(this.label,'fatal',args); process.exit(100); },     // always halts program!
    note: function(...args) { scribe.write(this.label,'note',args) },   // always to console (only), no transcript output
    flush: function(...args) { scribe.write(this.label,'flush',args) }  // flush, always writes transcript to empty the buffer
};
/**
 * @function scribe creates transcripting instances from scribe prototype
 * @param {object} config - main configuration, overrides defaults
 * @return {oject} a scribe object wrapper to a sribe singleton
 */
misc.Scribe = function Scribe(config={}) {
    if (typeof config !== 'string') {   // then override any defaults with defined values of object
        scribe.tag = config.tag || scribe.tag;
        scribe.verbose = config.verbose || scribe.verbose;
        scribe.mask(config.mask);
        scribe.transcript.mergekeys(config.transcript||{});
    };
    let tag = (typeof config == 'string') ? config : scribe.tag;
    return Object.create(scribePrototype).mergekeys({
        tag: tag,
        file: scribe.transcript.file,
        x: scribe.transcript,
        label: (tag.toUpperCase()+'        ').slice(0,8)
    });
};

/**
 * @function sniff creates a passthru stream for watching a streaming file
 * @param {function} callback - callback to process buffer chunk
 * @return {pipe} input piped to output
 */
misc.sniff = function sniff(callback) { // passthrough stream
    return new stream.Transform({ 
        objectMode: false,
        transform(chunk, encoding, done) { callback(Buffer.from(chunk, encoding)); this.push(chunk); done(); }, 
        flush(done) { done(); }
    });
};

/**
 * @function stat valid file stat function
 * @param {string} spec - resolved path to file
 * @return {object} - stat object or error object 
 */
misc.stat = async function stat(spec) { try { return await fsp.stat(spec) } catch(e) { throw 404; }; };


module.exports = misc;
