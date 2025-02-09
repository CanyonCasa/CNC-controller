/// WebSocket file server wrapper...

require('./Extensions2JS');
const fsp = require('fs').promises;
const path = require('path');
const os = require('os');
const WebSocket = require('ws');

async function safeStat(spec,lnks) { try { return await (lnks?fsp.stat(spec):fsp.lstat(spec)) } catch(e) { return null; }; };

async function listFolder(src) {
    let { root, meta } = src;
    let accept = meta.accept ? meta.accept.split(/[, \t]+/) : null;
    let folder = meta.folder || '';
    let listing = [];
    if (!root || (folder.startsWith('..'))) return listing;   // prevent backtracking root directory hierarchy
    let dir = path.resolve(path.join(root,folder));
    meta.recursive = meta.recursive===undefined ? true : !!meta.recursive;
    let fsListing = await fsp.readdir(dir);
    for (let f in fsListing) {
        let name = fsListing[f];

        let spec = path.resolve(path.join(root,folder,name));
        let pseudo = meta.label + '/' + path.join(folder,name);
        let stats = await safeStat(spec,meta.links);
        let fso = !stats || stats.isSymbolicLink() ? null :
            { root: meta.root, folder: folder, name: name, size:stats.size, time: stats.mtime, pseudo: pseudo,
            type: stats.isFile()?'file':stats.isDirectory()?'dir':stats.isSymbolicLink()?'link':'unknown' };
        if (fso) {  // valid file system object
            switch (fso.type) {
                case 'file':
                    if (!accept || accept.some(a=>fso.name.endsWith(a))) listing.push(fso);
                    break;
                case 'dir':
                    //fso.listing = [];
                    if (meta.recursive) {
                        let subMeta = Object.assign({},meta,{folder: path.join(folder,fso.name)});
                        let sublisting = await listFolder({root: root, meta: subMeta});
                        if (meta.flat) {
                            listing = [...listing, fso, ...sublisting]; // add fso then its sublisting
                        } else {
                            fso.listing = sublisting;   // fso with hierarchical listing
                            listing.push(fso);
                        };
                    } else {
                        listing.push(fso);  // only the fso itself
                    };
                    break;
                case 'link':
                    if (meta.links) listing.push(fso);
                    break;
                case 'unknown':
                    if (meta.unknown) listing.push(fso);
                    break;
                default: {
                }
            };
        };
    };
    return listing;
};

async function loadFile(src) {
    let spec = path.resolve(path.join(src.root,src.meta.folder,src.meta.name));
    return fsp.readFile(spec,{encoding: 'utf8'});
};

async function saveFile() {
    try {
        return false;
    } catch(e) { return e; }
};

function wsFileServer(cfg,Scribe) {
    this.cfg = cfg;
    this.scribble = Scribe(cfg.scribe);
    // define websock...
    this.wss = new WebSocket.Server({ noServer: true });
    this.wss.on('error',err=>this.scribble.error(`File WebsocketServer (WSS): ${err.toString()}`));
};

wsFileServer.prototype.upgrade = function upgrade(request, socket, head){
    this.wss.handleUpgrade(request, socket, head, (ws)=>{
        this.ws = ws;
        this.wss.emit('connection', ws, request);
        ws.on('error',err=>this.scribble.error(`File Websocket: ${err.toString()}`));
        ws.on('close', ()=>{ this.scribble.warn('File WebSocket closed!') });
        ws.on('message', async (buf)=>{
            try { 
                var msg = JSON.parse(buf.toString()); 
            } catch(e) { 
                this.scribble.warn(`wsFile: Message parsing failed!`);
                ws.send({error: e})
            };
            this.scribble.extra(`wsFile: '${ JSON.stringify(msg).slice(0,60)+'...'}`);
            let root = this.cfg?.root[msg.meta?.root];
            if (!root) {
                msg.error = 'Root undefined!'
            } else {
                if (root.startsWith('~')) root = os.homedir() + root.slice(1);  // bash path expansion
                switch (msg.action) {
                    case 'list':
                        try { 
                            msg.listing = await listFolder({root: root ,meta: msg.meta});
                        } catch(e) { msg.listing = []; msg.error = e.toString() };
                        break;
                    case 'get':
                        try { 
                            msg.contents = await loadFile({root: root ,meta: msg.meta}); 
                        } catch(e) { msg.contents = ''; msg.error = e.toString() };
                        break;
                    case 'put':
                        msg.error = await saveFile({root: root, meta: msg.meta, contents: msg.contents}); 
                        break;
                    default:
                        msg.error =`UNKNOWN[${msg.action}]: file server request action!`
                };
            }
           ws.send(JSON.stringify(msg));
        });
        this.scribble.info('File WebSocket open!');
    });
};

module.exports = wsFileServer;
