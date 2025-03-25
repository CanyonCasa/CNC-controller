/**
 * @module Extensions2JS
 * 
 * Personal JavaScript language extensions...
 * (c) 2025 Enchanted Engineering, MIT license
 * All code in this module directly modifies JavaScript primitives, as such, the module has no exports
 * This module only needs loaded once per application
 * 
 * @example
 *     require('./Extensions2JS');
 */


/// *************************************************************
/// Date Style Extension ...
/**
 * @extends Date#
 * @function style extends Date object defining a function for creating formated date strings
 * @param {string|'form'|'http'|'iso'|'nice'|'stamp'|'NEW:<key>:<VALUE>'} format - output format
 * @param {undefined|string|'utc'|'local'} realm - defines realm of interpretation for datetime value
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
 *  0h:         hour of the day, 12 hour format, padded, i.e. 09
 *  hh:         hour of the day, 24 hour format, padded, i.e. 09
 *  m:          minutes part hour, i.e. 7
 *  mm:         minutes part hour, padded, i.e. 07
 *  s:          seconds past minute, i.e. 5
 *  ss:         seconds past minute, padded, i.e. 05
 *  x:          milliseconds, number, i.e. 234, but always appears in string as 3 digits, i.e. leading zeros
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
 *    'scribe': "MM-DDT0h:mm:ssa", concise format for transcripts
 *    'stamp:   filespec safe timestamp string, '20161207T212211Z'
 *    'NEW'     "NEW:key:value" will define a new format keyword or change an existing format, note iso is not mutable
 *  notes:
 *    1. Add a leading 0 or duplicate field character to pad result as 2 character field [MDNhms], i.e. 0M or MM
 *    2. Use Y or YYYY for 4 year or YY for 2 year
 *    3. Using a defined keyword returns a date in a predefined format
 *    4. A format in the form of 'NEW:<key>:<VALUE>' defines a new keyword format or overrides an existing format
 *       Note: 'iso' format cannot be mutated.
 *    5. An undefined or empty format returns an object of all fields
 * 
 *  realm...
 *    'utc':        (or UTC) treats input as local time and adjusts to UTC before styling
 *    'local':      (or LOCAL) treats input as UTC time and adjusts to local time before styling 
 *    undefined:    (or anything else) no change to input datetime. (Except note 2)
 *  notes:
 *    1. The realm is simply an adjustment and doesn't differentiate actual datetime value provided. That is,
 *       if a localtime value is provide and 'local' realm specified it will (inccorectly) adjust the time
 *    2. If frmt = 'form', assumes 'local' realm (default)
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
if (!Date.prototype.style) Date.prototype.style = function(frmt,realm) {

    const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const RE = /Y(?:YYY|Y)?|[SX][MDZ]|0?([MDNhms])\1?|[aefxz]|([\'\"])(.*?)\2/g;  // Date.prototpye.style parsing pattern
    let styles = {
        iso: 'FYI: UNMUTABLE ISO8601, w/iso-like for local zone',
        form: 'YYYY-MM-DD hh:mm',
        http: 'XD, DD XM YYYY hh:mm:ss "GMT"',
        nice: 'XD XM D YYYY h:mma',
        scribe: 'MM-DDT0h:mm:ssa',
        stamp: 'YMMDDThhmmss'
    };
    let r =  String(realm||'').toLowerCase();   // validate params
    let f = (frmt && frmt.startsWith('NEW')) ? 'NEW' : String(frmt||'').toLowerCase();
    // adjustment sign: local=1; utc=-1; no change=0
    var sign = (r==='local' || (f==='form' && r==='')) ? 1 : r==='utc' ? -1 : 0;
    var dx = new Date(+this-sign*this.getTimezoneOffset()*60*1000); // adjust time to realm
    var zone = dx.toString().split('(')[1].replace(')','');
    var zx = zone.replace(/[a-z ]/g,'');
    var base = dx.toISOString();
    switch (f) {
        case 'iso': return (sign==1) ? base.replace(/z/i,zx) : base;    // ISO (Zulu time) or ISO-like localtime
        case 'form': return dx.style(styles.form).split(' ');     // values for form inputs
        case 'stamp': return dx.style(styles.stamp);              // filespec safe timestamp
        case '':  // object of date field values
            var [Y,M,D,h,m,s,ms] = base.split(/[\-:\.TZ]/);
            let ef = +dx*0.001;
            return { Y:+Y, M:+M, D:+D, h:+h, m:+m, s:+s, x:+ms, e:Math.floor(ef), f: ef, js: +dx, a:h<12 ?"AM":"PM", N:dx.getDay(),
                SM: MONTHS[M-1], XM: MONTHS[M-1].substring(0,3), SD: DAYS[dx.getDay()], XD: DAYS[dx.getDay()].substring(0,3), 
                SZ:zone, XZ: zx, z: -dx.getTimezoneOffset()/60, LY: Y%4==0&&(Y%100==Y%400), ofs: -dx.getTimezoneOffset(),
                dst: !!(new Date(1970,1,1).getTimezoneOffset()-dx.getTimezoneOffset()), iso: dx.toISOString(), 
                styles: styles };
        case 'NEW':
            let fields = frmt.split(':').slice(1);
            let [ key, value ] = [fields[0], fields.slice(1).join(':')];
            if (key!=='iso') styles[key] = value;
            return dx.style(key,realm);
        default:  // other defined or arbitrary formats
            if (f in styles) return dx.style(styles[f]);    // other defined styles
            // any arbitrary format...
            function pad(s,d=2) { return ('00'+s).slice(-d); };
            let tkn = dx.style();   // create substituion tokens object and then embellish
            tkn['YYYY']=tkn.Y; tkn['hh']=pad(tkn['h']); if (tkn['h']>12) tkn['h']%=12; tkn['x']=pad(tkn['x'],3);
            // if match in tkn, replace; if match w/o leading 0 in tkn; replace with padded value; otherwise assume quoted text
            return (frmt).replace(RE,$0=>$0 in tkn ? tkn[$0] : $0.slice(1) in tkn ? pad(tkn[$0.slice(1)]) : $0.slice(1,-1));
    };
};

/**
 * @function humanTime converts a time difference in milliseconds into human readable format
 * @param {number} difference - time difference in milliseconds
 * @return {{}} - human readable string - days, hrs, mins, secs
*/
if (!Date.prototype.humanTime) Date.prototype.humanTime = function(difference) {
    let asTimeStr = t => t>86400000 ? `${Math.floor(t/86400000)} days, ${asTimeStr(t%86400000)}` : 
        t>3600000 ? `${Math.floor(t/3600000)} hrs, ${asTimeStr(t%3600000)}` :
        t>60000 ? `${Math.floor(t/60000)} mins, ${asTimeStr(t%60000)}` : `${t/1000} secs`;
    return asTimeStr(difference);
}

///*************************************************************
/// Object Extensions...
/**
 * @function filterByKey object equivalent of Array.prototype.filter - calls user function with value, key, and source object
 * @memberof Object
 * @param {function} f - function called for each object field
 * @return {{}} - Modified object (does not mutate input unless filterFunc does)
 * @info result will reference source object if value is an object
  */
 if (!Object.filterByKey) Object.defineProperty(Object.prototype,'filterByKey', {
    value: 
        function(f) {
            let [ obj, tmp ] = [ this, {} ];
            for (let key in obj) if (f(obj[key],key,obj)) tmp[key] = obj[key];
            return tmp;
        },
    enumerable: false
});

/**
 * @function mapByKey object equivalent of Array.prototype.map - calls user function with value, key, and source object
 * @memberof Object
 * @param {function} f - function called for each object field
 * @return {{}} - Modified object (does not mutate input unless mapFunc does)
 * @info result will reference source object if value is an object
  */
 if (!Object.mapByKey) Object.defineProperty(Object.prototype,'mapByKey', {
    value: 
        function(f) {
            let [ obj, tmp ] = [ this, {} ];
            for (let key in obj) tmp[key] = f(obj[key],key,obj);
            return tmp;
        },
    enumerable: false
});

/**
 * @function mergekeys recursively merge keys of an object into an existing object with merged object having precedence
 * @param {{}} merged - object merged into source object, MUST NOT BE CIRCULAR!
 * @return {{}} - object representing merger of source and merged (mutates source, but has no reference to merged) 
 */ 
if (!Object.mergekeys) Object.defineProperty(Object.prototype,'mergekeys', {
    value: 
        function(merged={},except=[]) {
            const isObj = (obj) => (typeof obj==='object') && (obj!==null) && !(obj instanceof RegExp);
            if (isObj(merged)) {
                Object.keys(merged).filter(k=>!except.includes(k)).forEach(key=>{
                    if (isObj(merged[key])) {
                        this[key] = this[key] || (merged[key] instanceof Array ? [] : {}); // init new object if doesn't exist
                        this[key].mergekeys(merged[key]); // new object so recursively merge keys
                    } else {
                        this[key] = merged[key];          // just replace with or insert merged key, even if null
                    };
                });
            };
        return this; 
    },
    enumerable: false
});
