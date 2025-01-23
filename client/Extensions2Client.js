////////////////////////////////////////////////////////////////
// Extensions to Client Side JavaScript ES5 compatible...
////////////////////////////////////////////////////////////////
///*************************************************************
/// Array/Object Extensions...
///*************************************************************
// function to generate page base path add-on to location variable...
if (!(Array.includes||Array.prototype.includes)) Object.defineProperty(Array.prototype,'includes', {
  value: function(item) { return (this.indexOf(item)!==-1); },
  enumerable: false
});

///*************************************************************
/// Date Style Extension ...
const STYLE = {
  DAYS: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  MONTHS: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  RE: /Y(?:YYY|Y)?|[SX][MDZ]|0?([MDNhms])\1?|[aexz]|([\'\"])(.*?)\2/g,  // Date.prototpye.style parsing pattern
  formats: {
      form: 'YYYY-MM-DD hh:mm',
      http: 'XD, DD XM YYYY hh:mm:ss "GMT"',
      nice: 'XD XM D YYYY h:mma',
      stamp: 'YMMDDThhmmss'
  }
};
if (!Date.prototype.style) 
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
Date.prototype.style = function(frmt,realm) {
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

///*************************************************************
/// Object Extensions...
///*************************************************************
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
            var obj = this; var tmp = {};
            for (var key in obj) if (f(obj[key],key,obj)) tmp[key] = obj[key];
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
            var obj = this; var tmp = {};
            for (var key in obj) tmp[key] = f(obj[key],key,obj);
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
            var isObj = function(obj) { return (typeof obj==='object') && (obj!==null) && !(obj instanceof RegExp); };
            if (isObj(merged)) {
                for (var key of Object.keys(merged).filter(function(k){ return !except.includes(k); })) {
                    if (isObj(merged[key])) {
                        this[key] = this[key] || (merged[key] instanceof Array ? [] : {}); // init new object if doesn't exist
                        this[key].mergekeys(merged[key]); // new object so recursively merge keys
                    } else {
                        this[key] = merged[key];          // just replace with or insert merged key, even if null
                    };
                };
            };
            return this; 
        },
    enumerable: false
});


///*************************************************************
/// General Extensions...
///*************************************************************
// function to generate page base path add-on to location variable...
if ((typeof location!=='undefined')&&!location.base) 
  location.base = location.origin + location.pathname.replace('/'+location.pathname.split('/').pop(),'');

if (!asList) var asList = (x,delim=/,\s*/) => x instanceof Array ? x : (x||'').split(delim);

if (!distinct) var distinct = a => a.filter((v,i,a)=>a.indexOf(v)===i);

if (!jxCopy) var jxCopy = obj => { try { return JSON.parse(JSON.stringify(obj)); } catch(e) { console.log(e,obj); return null; } };
  
// bounds a value between min and max or returns dflt or 0...
if (!bound) var bound = function(min,val,max,dflt) {
  val = Number(isNaN(val) ? (isNaN(dflt) ? 0 : dflt ) : val);
  if (min!==null&&!isNaN(min)) val = (val<min) ? Number(min) : val;
  if (max!==null&&!isNaN(max)) val = (val>max) ? Number(max) : val;
  return val;
};

// returns function to debounce repetitive events such as typing chnages
if (!debounce) function debounce(dbf, wait) {
  var timex;
  return function dbfWrapper() {
    function ping() {
        clearTimeout(timex);
        dbf();
    }
    clearTimeout(timex);
    timex = setTimeout(ping, wait || 1000);
  };
};

// Title Case Conversion...
if (!String.prototype.toTitleCase) 
  String.prototype.toTitleCase = function () { return this.toLowerCase().replace(/(\b[a-z])/g,(m)=>m.toUpperCase()); };

// make a full copy of an object (i.e. no reference to original) using JSON functions...; no circular references possible.
if (!jsonCopy) function jsonCopy(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch(e){ console.log(e,obj); return null; } };

// function to create and populate an array of given size and values, note value can even be a function
if (!makeArrayOf) function makeArrayOf(size,value) { return Array.apply(null, Array(size)).map(function(v,i,a){ return (typeof value=='function') ? value(v,i,a) : value }); };

// function to correctly join an array of path parts, excluding "empty, null, or undefined parts", into a valid path...
if (!makePath) function makePath() { return Array.from(arguments).filter(function(e){ return e; }).join('/').replace(/\/{2,}/g,'/').replace(/:\//,'://'); };

// formats JSON as HTML for pretty printing in color... 
//   requires css class definitions for colors: .json (wrap everything), .json-key, .json-value, .json-string, .json-boolean
// original code source: Dem Pilafian
//   fixed problems: spaces in keys, empty objects, changed quoted strings styling, added boolean styling
//   https://blog.centerkey.com/2013/05/javascript-colorized-pretty-print-json.html
if (!JSON.prettyHTML) Object.defineProperty(JSON,'prettyHTML',{
  value: function(obj,spaces) {
    spaces = spaces || 1;
    var pattern = /^( *)("[$\w ]+":)? ?("[^"]*"|[\w.+-]*)?([,[{}\]]+)?$/mg;
    function replacer(match, indent, key, val, term) {
      var tag = function(style,content,quote) { 
        quote = quote || '';
        return quote+"<span class='json-"+style+"'>"+content+'</span>'+quote; 
      };
      var line = indent || '';  // build the line piecewise from wrapped fields
      line += (key) ? tag('key',key.replace(/[":]/g, '')) + ': ' : '';
      line += (val) ? (val.startsWith('"') ? tag('string',val.replace(/"/g, ''),'"') : ((val=='false'||val=='true') ? tag('boolean',val) : tag('value',val))) : '';
      return line + (term || '');
    };
    return JSON.stringify(obj, null, spaces)
      .replace(/\\"/g, '&quot;')                    // escaped quotes inside JSON string values
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')  // html tag escapes, current browsers seem ok with quotes and ampersands
      .replace(pattern, replacer);                  // parse and wrap fields with tags
  },
  enumerate: false
});

// recursively search an ojbect to look for a contained object matching specified properties...
if (!scanForMatchTo) function scanForMatchTo (object, match={},dflt={}) {
  const isObj = (x) => (typeof x==='object') && (x!==null);
  const matches = (obj,x) => Object.keys(x).every(k=>(k in obj)&&(obj[k]===x[k]));
  if (!isObj(match)) return dflt;       // match is not an object
  if (matches(object,match)) return object; // check the object itself for match
  for (var k of Object.keys(object)) {    // check any objects it contains recursively
    if (isObj(object[k])) { var m=scanForMatchTo(object[k],match,null); if (m) return m; };
  };
  return dflt;  // default
};

// generates an n(=8) character unique ID of base (b=36, alphanumeric) ...
if (!uniqueID) function uniqueID(n=8,b=36) { var u=''; while(u.length<n) u+=Math.random().toString(b).substr(2,8); return u.slice(-n); };

// function to determine a number of complex variable types...
if (!verifyThat) function verifyThat(variable,isType) {
  switch (isType) {
    case 'isTrueObject': return (typeof variable=='object') && (variable!==null)  && !(variable instanceof Array);
    case 'isArray': return (variable instanceof Array);
    case 'isArrayOfTrueObjects': return (variable instanceof Array) && verifyThat(variable[0],'isTrueObject');
    case 'isArrayOfAnyObjects': return (variable instanceof Array) && (typeof variable[0]==='object');
    case 'isArrayOfArrays': return (variable instanceof Array) && (variable[0] instanceof Array);
    case 'isEmptyObject': return Object.keys(variable).length==0;
    case 'isScalar': return (typeof variable=='string') || (typeof variable=='number');
    case 'isNotEmpty': return (typeof variable=='object') && (variable!==null) && (Object.keys(variable).length>0);
    case 'isEmpty': return (variable===undefined) || (variable==='') || !verifyThat(variable,'isNotEmpty');
    case 'isDefined' : return (variable!==undefined) && (variable!==null);
    case 'isNotDefined' : return (variable===undefined) || (variable===null);
    default: throw `verifyThat: Unknown type '${isType}' specified`;
  };
};
