/***
 * This module implementws a transcription object
 * (c) 2025 Enchanted Engineering, MIT license
 * @example
 *   const scribe = require('./scribe')(cfg.scribe);
 */

///*************************************************************
/// Dependencies...
require('./Extensions2JS');
const frmt = require('util').format;
const fsp = require('fs').promises;
const path = require('path');

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
        file: '../logs/scribe.log',
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
 * @function Scribe creates transcripting instances from scribe prototype
 * @param {object} config - main configuration, overrides defaults
 * @param {string} config - tag name reference for scribe instances, (8 character max) 
 */
function Scribe(config={}) {
    if (typeof config !== 'string') {   // then override any defaults with defined values of object
        scribe.tag = config.tag || scribe.tag;
        scribe.verbose = config.verbose || scribe.verbose;
        scribe.mask(config.mask);
        scribe.transcript = ({}).mergekeys(scribe.transport).mergekeys(config.transcript||{});
    };
    let tag = (typeof config == 'string') ? config : scribe.tag;
    return Object.create(scribePrototype).mergekeys({
        tag: tag,
        file: scribe.transcript.file,
        label: (tag.toUpperCase()+'        ').slice(0,8)
    });
};

module.exports = Scribe;
