// Basic library of common extensions for Vue3...

var VueLib3 = {

    // convert a comma (or other) delimited string into an array
    asList: (x,delim=/,\s*/) => x instanceof Array ? x : (x||'').split(delim),
    iconResolve: (icon) => `/cdn/icons/${icon}.png`,
    // generates an n(=8) character unique ID of base (b=36, alphanumeric) ...
    uniqueID: (n=8,b=36) => { var u=''; while(u.length<n) u+=Math.random().toString(b).slice(2); return u.slice(-n); },

    // this function adds library remaining elements to the specified app...
    applyLibToApp: function(app) {
        for (let [key,value] of Object.entries(this.config||{})) app.config.globalProperties[key] = value;
        for (let [key,value] of Object.entries(this.directives||{})) app.directive(key,value);
        for (let [key,value] of Object.entries(this.components||{})) app.component(key,value);
        for (let [key,value] of Object.entries(this.plugins||{})) app.use(value);
    },

    components: {

        // expandable block wrapper component...
        'blk-x': {
            data: () => ({expanded: false, opened: false}), // opened fired on first expand
            props: ['hdr', 'inhibit', 'init', 'menu'],
            created() {
                if (!this.init) return;
                this.expanded = true; this.opened = true;
            },
            computed: {
                expandIcon() { return this.inhibit ? 'inhibit' : this.expanded ? 'collapse' : 'expand'; },
                xmenu() { return this.menu || [] }
            },
            methods: {
                expand(state) {
                    if (this.inhibit) return;
                    this.expanded = typeof state==='boolean' ? state : !this.expanded;
                    if (!this.opened && this.expanded) { this.opened = true; this.$emit('load'); };
                },
                resolveIcon(icon) { return VueLib3.iconResolve(icon) }
            },
            template: /* HTML */`
                <div class="blk-x">
                    <div class="blk-x-hdr" @click.stop="expand">
                        <img class="blk-x-icon" :src="resolveIcon(expandIcon)">{{hdr}}
                        <img v-for="i of xmenu" class="blk-x-menu-ico right" :src="resolveIcon(i.icon)" @click.stop=$emit(i.emit)>
                    </div>
                    <div class="blk-x-slot" v-if-class:none="!expanded"><slot>Not defined...</slot></div>
                </div>`
            },

        // obsolete linked expandable block component...
/*        'x-blk': {
            props: ['blk', 'hdr', 'inhibit', 'init', 'xblk'],
            data: ()=>({ expanded: false, opened: false }), // opened fired on first expand
            created() { if (!this.init&&!this.inhibit) return; this.expanded = true; this.opened = true; this.$emit('load','init'); },
            computed: { 
                expandIcon() { return this.inhibit ? 'inhibit' : this.expanded ? 'collapse' : 'expand'; }, 
            },
            methods: {
                expand(state) {
                    if (this.inhibit) return;
                    this.expanded = typeof state==='boolean' ? state : !this.expanded;
                    if (!this.opened && this.expanded) { this.opened = true; this.$emit('load','expand'); };
                    if (state==='self') this.$emit('xblk',this.blk);
                },
                resolveIcon(icon) { return VueLib3.iconResolve(icon) }
            },
            watch: {
                xblk: function(x,lastX) {
                    if (x===this.blk) return;
                    this.expand(x==='all');
                }
            },

            template:
                <div class="x-blk">
                    <div class="x-blk-hdr">
                        <img :src="resolveIcon(expandIcon)" @click.stop="expand('blk')">
                        <span class="hdr-text">{{hdr}}</span>
                        <slot name="menu"></slot>
                        <img class="right" v-if-class:none="inhibit" :src="resolveIcon('menu')" @click.stop="expand('self')">
                    </div>
                    <div class="x-blk-slot" v-if-class:none="!expanded"><slot>Not defined...</slot></div>
                </div>`
            },
*/
// account dialog element to encapsulate user account interface...
        'dialog-account': {
            props: ['show','site','who'],
            data: function() { return {
                account: { email: '', fullname: '', member: '', password: '', phone: '', status: '', username: '',
                    other: Object.assign({},this.site.other) },
                activate: { code: '', msg: '' },
                chgdUser: false,
                chgdUsersSet: new Set(),
                error: false,
                field: {
                    accountTypes: this.site.accountTypes,
                    statusChoices: [["Pending Activation",'PENDING'],["Active User",'ACTIVE'],["Inactive (disabled)",'INACTIVE']],
                },
                fields: { email: '', fullname: '', member: '', password: '', pin: '', phone: '', status: 'INACTIVE', username: '',
                    other: Object.assign({},this.site.other) },
                filter: true,
                group: { name: '', desc: '' },
                groups: [],
                manage: false,
                msg: '',
                other: Object.assign({},this.site.other),
                selectedUser: '',
                users: [],
                validAccountForm: false,
                validActivateForm: false,
                validUsername: false,
                visible: false
            }},
            computed: {
                admin() { return this.isMember('admin',this.who.member); },
                manager() { return this.isMember('admin,manager',this.who.member); },
                mode() { return this.manage ? 'Manage' : this.who.valid ? 'Edit' : 'Create'; },
                usersList() { return this.users.map(u=>({value:u.username, label:u.fullname+' ('+u.username+')'})); },
                valid() { return this.who && this.who.valid; },
                visIcon() { return this.visible ? 'hide' : 'show'; }
            },
            //created() { window.account = this; },
            methods: {
                accountDo() {
                    if (!(this.who || this.who.token)) return;
                    if (this.chgdUser) this.userMerge();
                    if (this.chgdUsersSet.size==0) return;
                    var body = this.manage ? this.users.filter(u=>this.chgdUsersSet.has(u.username)).map(ux=>({ref: ux.username, record: ux})) : 
                    [{ ref: this.account.username, record: this.account }];
                    let hdrs = this.who.token ? {authorization: `Bearer ${this.who.token}`} : {};
                    this.fetchJSON('POST','/user/change/',{ headers: hdrs, body: body } )
                    .then(res=>{ 
                        this.error = res.error || res.jxError;
                        if (this.error) return this.msg=`Account operation failed; username may exist; First login to change existing user.`;
                        let queue = [];
                        res.jx.forEach(u=>{
                        let msg = u[0]=='error' ? `Account operation failed for user ${u[1]} (${u[2].code}:${u[2].msg})` : 
                        `Account operation successful for user ${u[1]}`;
                        queue.push(msg);});
                        this.msg = queue.join('<br>');
                        this.chgdUsersSet.clear(); })
                    .catch(e=>{ this.error=true; this.msg=e.toString(); });
                },
                chg(e) {
                    this.chgdUser = true;
                    this.chgdUsersSet.add(this.selectedUser);
                    this.validateForms();
                },
                chgGroup(action) {
                    if (!this.who || !this.who.token) return;
                    if (action=='name') { this.group.desc = (this.groups[this.group.name]||{}).desc || ''; return; };
                    if ((action=='add') && scanForMatchTo(this.groups,{name: this.group.name},null)) return;  // do not add existing group
                    if ((action=='edit') && !scanForMatchTo(this.groups,{name: this.group.name},null)) return;  // do not edit non-existing group
                    let tmp = [{ref: this.group.name, record: action=='del' ? null : this.group}];
                    switch (action) {
                        case 'edit': this.groups.map((g,i)=>this.groups[i].desc = g.name==this.group.name ? this.group.desc : g.desc); break;
                        case 'add': this.groups.push({name: this.group.name, desc: this.group.desc}); break;
                        case 'del': this.groups = this.groups.filter(g=>g.name!=this.group.name); break;
                    };
                    this.fetchJSON('POST','/user/groups/',{ headers: {authorization: `Bearer ${this.who.token}`}, body: tmp} )
                    .then(res=>{ if (res.error || res.jxError) { console.error('Failed to update groups...'); return; }; })
                    .catch(e=>{ this.error=true; console.error("ERROR: Post groups failed..."); this.msg=e.toString(); });
                },
                chgMember(group,chkd) { this.chgMembers(group,chkd,this.account.username); this.chg(); },
                chgMembers(group,chkd,user) {
                    let usr = scanForMatchTo(this.users,{username:user},{});
                    let ms = new Set(usr.member.split(','));
                    chkd ? ms.add(group) : ms.delete(group);
                    usr.member = [...ms].join(',');
                    this.chgdUsersSet.add(user);
                    if (this.account.username==user) this.account.member = usr.member; 
                    this.validateForms();
                },
                chgOther() { this.account.other = this.other; this.validateForms(); },
                chgUser(user) {
                    if (this.selectedUser!=user) this.selectedUser = user;
                    this.userMerge();
                    let ux = scanForMatchTo(this.users,{username:user},jsonCopy(this.fields));
                    var setAccount = (a,u)=> a.mapByKey((v,k)=>typeof v=='object' ? setAccount(v,u[k]) : u[k]||'');
                    this.account = setAccount(this.fields,ux);
                    this.other = setAccount(this.fields.other,ux.other);
                    this.$nextTick(function() {this.$refs['account-username'].focus()});
                },
                codeCheck() { 
                    this.fetchJSON('POST','/user/code/'+this.account.username+'/'+this.activate.code)
                    .then(res=>{ this.error = !!res.jx.error; this.activate.msg = res.jx.msg; })
                    .catch(e=>{ this.error=true; this.activate.msg=e.toString(); });
                },
                codeRequest() {
                    this.fetchJSON('GET','/user/code/'+this.account.username)
                    .then(res=>{ this.error = !!res.jx.error; this.activate.msg = res.jx.msg; })
                    .catch(e=>{ this.error=true; this.activate.msg=e.toString(); });
                },
                groupNotAdmin(name) { return (name=='admin'||name=='manager')&&!this.admin; },
                groupByName(name) { return scanForMatchTo(this.groups,{name:name},null); },
                groupMembers(name) { return this.users.map(u=>({un:u.username,ckd:this.isMember(name,u.member)})); },
                resolveIcon(icon) { return VueLib3.iconResolve(icon) },
                isMember(ax='',mx='') { return (typeof ax=='string' ? ax.split(',') : ax).some(a=>mx.split(',').includes(a)) },
                listGroupsAndUsers() {
                    if (!this.manager || !this.who || !this.who.token) return;
                    this.fetchJSON('GET','/user/groups',{headers:{authorization: `Bearer ${this.who.token}`}})
                    .then(res=>{ this.groups = res.jxOK&&!res.jx.error ? res.jx : []; })
                    .catch(e=>console.error("listGroupsAndUsers[groups]:",e));
                    this.fetchJSON('GET','/user/users',{headers:{authorization: `Bearer ${this.who.token}`}})
                    .then(res=>{ this.users = res.jxOK&&!res.jx.error ? res.jx : []; })
                    .catch(e=>console.error("listGroupsAndUsers[users]:",e));
                },
                resetPW() { this.account.password = this.account.password ? '' : '#Temp1234'; this.visible=true; this.chg(); },
                see() { this.visible = !this.visible; },
                userMerge() { // merge changes to user if changed
                    if (!this.chgdUser) return;
                    let existingUser = scanForMatchTo(this.users,{username:this.account.username},null);
                    if (existingUser) { existingUser.mergekeys(this.account); } else { this.users.push(jsonCopy(this.account)); };
                    this.chgdUser = false;
                },
                validateForm(form) {
                    id = document.getElementById(form);
                    return (id!==null && this.$refs[form]) ? this.$refs[form].checkValidity() : false;
                },
                validateForms() {
                    // whole account form button enable, and sub forms...
                    this.validAccountForm = this.manage || this.validateForm('account-form');
                    this.validActivateForm = this.validateForm('account-activate-form');
                    this.validUsername = this.validateForm('activate-username');
                },
                wndwClose() { this.$emit('close', 'account'); }
                },
            watch: {
                manager() { this.listGroupsAndUsers(); },
                show() {
                    if (!this.show || !this.valid) return;
                    if (this.users.length==0) this.users = [jsonCopy(this.who)];
                    this.chgUser(this.who.username);
                }
            },
            template: /* HTML */`
                <div class="account-dialog" v-show="show">
                <h3>Account... 
                    <img class="account-icon right" :src="resolveIcon('close')" @click="wndwClose">
                    <img class="account-icon right" v-if-class:none="!manager" :src="resolveIcon('account')"  @click="manage=!manage"></h3>
                <span v-show="!manage" class="account-text text-indent">
                    <p class="text-alert">Privacy Notice: Information used only for account management and not shared with third parties.</p>
                    <p>To change existing account information, please login first...</p>
                </span>
                <h4>{{ !valid ? 'Step 1: Create Account...' : mode+' Account...' }}</h4>
                <div class="account-grid" v-show="manage">
                    <label class="account-label">User:</label>
                    <span class="account-input">
                    <select v-model="selectedUser" @change="chgUser(selectedUser)">
                        <option v-for="u of usersList" :value="u.value">{{u.label}}</option>
                    </select>
                    <img class="account-icon text-icon" :src="resolveIcon('filter')"  @click.prevent="filter=!filter">
                    </span>
                    <label v-show="filter" class="account-label">Filter:</label>
                    <label v-show="filter" class="account-desc">TBD</label>
                </div>
                <form class="account-form" ref="account-form" @keyup="chg">
                    <blk-x hdr="Credentials..." inhibit="true" init="true">
                        <label class="account-label">Username:</label>
                            <label v-show="valid" class="account-input text-bold">{{account.username}}</label>
                            <input v-show="!valid" class="account-input validated" ref="account-username" type="text" 
                            placeholder="username" v-model="account.username" v-pattern:username required autocomplete @input="chg">
                            <span class="account-desc" v-pattern:username.desc></span>
                        <label class="account-label">Password:</label>
                        <span>
                            <input class="account-input account-pw validated" autocomplete="off" ref="account-password" placeholder="password/code" 
                            :type="visible?'text':'password'" v-model="account.password" v-pattern:password :required="!manage" @input="chg">
                            <img class="account-icon" :src="resolveIcon(visIcon)"  @click.prevent="see">
                            <img class="account-icon" v-if-class:none="!manage" :src="resolveIcon('reset')" title="Reset password"   @click.stop="resetPW">
                        </span>
                        <span class="account-desc" v-pattern:password.desc></span>
                    </blk-x>
                    <blk-x hdr="Identity..." init="true">
                        <label class="account-label">Fullname:</label>
                        <input class="account-input validated" type="text" placeholder="fullname" v-model="account.fullname" 
                            v-pattern:fullname required autocomplete @input="chg">
                        <span class="account-desc" v-pattern:fullname.desc></span>
                        <label class="account-label">Email:</label>
                        <input class="account-input validated" type="text" placeholder="email" v-model="account.email" 
                            v-pattern:email required autocomplete @input="chg">
                        <span class="account-desc" v-pattern:email.desc></span>
                        <label class="account-label">Phone:</label>
                        <input class="account-input" v-if-class:validated="!!account.phone" type="text" placeholder="phone" 
                            v-model="account.phone" v-pattern:phone :required="!!account.phone" autocomplete @input="chg">
                        <span class="account-desc" v-pattern:phone.desc></span>
                        <span class="account-desc text-alert">Must be capble of receiving texts!</span>
                        <span class="account-msg">Other...</span>
                        <label class="account-label">Account:</label>
                        <select class="account-input validated" v-model="other.account" required @change="chgOther">
                            <option disabled :selected="other.account==''" value='none'>Please select one ...</option>
                            <option v-for="c of field.accountTypes" :selected="other.account==c[1]" :value="c[1]">{{c[0]}}</option>
                        </select>
                        <span class="account-desc">Please select the appropriate type.</span>
                        <!--<label class="account-label">Reference:</label>
                        <select class="account-input validated" v-model="other.ref" required @change="chgOther">
                            <option disabled :selected="other.account==''" value=''>Please select one ...</option>
                            <option v-for="c of field.refChoices" :selected="other.account==c[1]" :value="c[1]">{{c[0]}}</option>
                        </select>
                        <span class="account-desc">Please select the appropriate reference.</span>-->
                    </blk-x>
                    <blk-x v-if="manage" hdr="Administrative...">
                        <label class="account-label">Status:</label>
                        <select class="account-input validated" v-model="account.status" @change="chg">
                            <option v-for="c of field.statusChoices" :value="c[1]">{{c[0]}}</option>
                        </select>
                        <span class="account-msg">Group Membership (Permissions)...</span>
                        <template v-for="g in groups">
                            <span class="account-label">          
                            <label class="account-group text-small" v-if-class:text-alert="g.name==group.name" 
                            @click.stop="group.mergekeys(g)">{{g.name}}</label>
                            <input type="checkbox" name="member" :checked="isMember(g.name,account.member)" :disabled="groupNotAdmin(g.name)" 
                            @change="chgMember(g.name,$event.target.checked)">
                            </span>
                            <span class="account-desc" v-if-class:text-alert="g.name==group.name">{{g.desc}}</span>
                        </template>
                        <template v-show="admin">
                            <span class="account-msg">Edit Group...</span>        
                            <label class="account-label">Name:</label>
                            <input class="account-input validated" type="text" placeholder="Group" v-model="group.name" v-pattern="/[a-z]+/"
                            @click.stop @keyup.stop v-debounce.input="()=>chgGroup('name')">
                            <label class="account-label">Desc:</label>
                            <input class="account-input stretch validated" type="text" placeholder="Description" v-model="group.desc" 
                            v-pattern:text @click.stop @keyup.stop>
                            <label class="account-label">Members:</label>
                            <span class="account-desc" v-show="group.name">
                                <label class="text-no-wrap" v-for="m in groupMembers(group.name)">
                                <input type="checkbox" name="gm" :checked="m.ckd" :disabled="groupNotAdmin(group.name)" 
                                    @change="chgMembers(group.name,$event.target.checked,m.un)">:
                                <span v-if-class:text-bold="m.ckd">{{m.un}}</span></label>
                            </span>
                            <span class="account-input">
                                <img class="icon-small" :src="resolveIcon('add')" title="Add new group" @click="chgGroup('add')">
                                <img class="icon-small" :src="resolveIcon('edit')" title="Edit named group" @click="chgGroup('edit')">
                                <img class="icon-small" v-if-class:none="!groupByName(group.name)" :src="resolveIcon('del')" title="Delete named group" @click="chgGroup('del')">
                            </span>        
                            <span class="account-msg">Changed...</span>        
                            <label class="account-input text-bold">{{Array.from(chgdUsersSet).join(',')}}</label>
                        </template>
                    </blk-x>
                    <input type="button" class="account-button" :disabled="!validAccountForm" @click.stop="accountDo" 
                        :value="valid?'EDIT ACCOUNT'+((chgdUsersSet.size==1)?'':'S'):'SIGN UP'">
                    <div class="text-small"  v-if-class:text-error="error">{{ msg }}</div>
                </form>
                <div  v-if="!valid">
                <h3>Step 2: Activate Account...</h3>
                <form ref="account-activate-form" class="account-grid" @keyup="chg">
                    <label class="account-label">Username:</label>
                    <input class="account-input validated" type="text" placeholder="username" v-pattern:username required 
                        ref="activate-username" v-model="account.username">
                    <span class="account-desc text-small" v-pattern:username.desc></span>
                    <label class="account-label">Code:</label>
                    <input class="account-input validated" type="text" placeholder="challenge code" ref="account-code" v-model="activate.code"
                        v-pattern:code required @keyup.enter="codeCheck">
                    <span class="account-desc text-small" v-pattern:code.desc></span>
                    <span class="account-desc text-small">
                    <button class="account-button" type="button" :disabled="!validUsername" @click="codeRequest">Get Code</button>
                    <button class="account-button" type="button" :disabled="!validActivateForm" @click="codeCheck">Activate</button>
                    </span>
                    <span class="account-desc text-alert text-small" v-if-class:error="error">{{ activate.msg }}</span>
                </form>
                </div> 
                </div>`
        },

        // login dialog element to encapsulate user login interface...
        'dialog-login': {
            props: ['show', 'who'],
            data: ()=>({
                error: false,
                formValid: false,
                msg: '',
                password: '',
                token: '',
                username: '',
                usernameValid: false,
                visible: false
            }),
            mounted() { this.restoreCreds(); },
            computed: {
                eyeIcon() { return VueLib3.iconResolve(this.visible ? 'hide' : 'show') }
            },
            methods: {
                chg(dx) {
                    this.usernameValid=this.$refs["login-username"].checkValidity();
                    this.formValid=this.$refs["login-dialog"].checkValidity();
                    if (this.formValid && this.$refs["login-password"].matches(':-webkit-autofill')) this.login(); // autocomplete detection!
                },
                getCode() {
                    this.fetchJSON('GET','/user/code/'+this.username)
                        .then(res=>{ this.error = !!res.jx.error; this.msg = res.jx.msg; })
                        .catch(e=>{ console.error(e); this.error = true; this.msg = e.toString(); });
                },
                login(token) {
                    var auth = token ? `Bearer ${token}` : `Basic ${btoa(this.username+":"+this.password)}`;// authorization header
                    var creds = { payload: {}, token: '', error: true, msg: '', valid: false }; // default failure
                    this.fetchJSON('GET','/login',{headers: {authorization: auth}})
                        .then(res=>{
                            creds.mergekeys(res.jx).mergekeys({ error: !!res.jx.error, msg: res.jx.msg||'' }); 
                            creds.valid = verifyThat(creds.payload,'isNotEmpty');
                            this.notify(creds);
                            if (creds.valid && this.show) this.$emit('close'); })
                        .catch(e=>{
                            creds.msg = e.toString();
                            this.notify(creds);
                        });
                },
                logout() {  // called when logout event emitted by parent
                    if (!this.token) return;  // only logout if user is logged in
                    this.fetchJSON('GET','/logout',{headers: {authorization: `Bearer ${this.token}`}})
                        .then(res=>{
                            this.notify(res.jx);
                        })
                        .catch(e=>{ console.error(e); this.$emit('error',e); });
                },
                notify(creds={},restored) {
                    this.error = creds.error || false;  // set local variables and store payload and token - valid or not
                    this.msg = creds.msg || '';
                    this.token = creds.token || '';
                    this.storage.local =  { jwt: creds.valid ? { token: creds.token, payload: creds.payload } : undefined };
                    let user = { member: '', token: this.token, valid: !!creds.valid }.mergekeys(creds.payload);   // define user
                    this.username = user.username || '';  // update username field
                    this.$emit('user',user,restored);     // pass user credentials to parent level
                },
                restoreCreds() {
                    if (!this.storage.jwt) return;
                    let { payload, token } = this.storage.jwt;
                    let valid = payload && 1000*(payload.iat+payload.exp) > new Date().valueOf();
                    let creds = valid ? { valid: true, token: token, payload: payload, error: false, msg: '' } :
                        { valid: false, error: true, msg: 'Invalid or Expired login token' };
                    this.notify(creds,valid);
                    if (valid && payload.ext) this.login(token);    // login extendable?, do so in background
                }
            },
            template: /* HTML */ `
                <form class="login-dialog" ref="login-dialog" v-show="show">
                    <span class="login-text">Sign in... <img class="login-close" @click="$emit('close')"></span>
                    <span class="login-desc text-italic">Enter a valid username and password/code...</span>
                    <input ref="login-username" class="login-input validated" type="text" placeholder="username" v-model="username" 
                        v-pattern:username required autocomplete="username" @input="chg">
                    <span class="login-desc" v-pattern:username.desc></span>
                    <input ref="login-password" class="login-input login-pw validated" :type="visible?'text':'password'" placeholder="password/code" v-model="password" 
                        v-pattern:password required autocomplete="current-password" @input="chg" @keyup.enter="login()">
                    <img class="login-icon" :src="eyeIcon" @click.prevent="visible = !visible" :title="visible?'Hide Password':'Show Password'">
                    <span class="login-desc" v-pattern:password.desc></span>
                    <input type="button" class="login-button" :disabled="!usernameValid" @click.stop="getCode()" value="Get Code">
                    <input type="button" class="login-button right" :disabled="!formValid" @click.stop="login()" value="SIGN IN">
                    <span class="login-msg text-small"  v-if-class:text-error="error">{{ msg }}</span>
                </form>`,
            watch: {
            //    show() { if (this.show) this.$nextTick(function() {this.$refs['login-username'].focus()}); }
            }
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
            template: /* HTML */`
                <div ref="flt">
                    <div class="floater-hdr move" ref="fltHdr">
                        <img  v-show="close" class="right" src="/cdn/icons/close.png" @click="$emit('close')">
                        <span>{{title}}</span>
                    </div>
                    <slot>Content Goes Here!</slot>
                </div>`
        },

        // page layout default sections...
        generic: {
            props: ['def',"show", "user"],
            template: /* HTML */`<div v-html="def.content||'Loading (Generic), please wait...'" v-show="show"></div>`
        },

        // wrapper for text input for passswords and such with public or private display of the value...
        'private-input': {
            props: {
                auto: { type: Object, default: () => ({}) },
                modelValue: { type: String, default: '' },
                private: { type: Boolean, default: true }
            },
            data: function() { return { 
                autocap: this.auto.capitalize || 'off',
                autocrct: this.auto.correct || 'off',
                selected:{ isSelected: false, start: 0, end: 0 }, 
                temp: '', //holds the modelValue (with changes)
                text: '', // value displays in text field
                timex: null} },
            created() { this.temp = this.modelValue; this.text = '*'.repeat(this.temp.length); },
            methods: {
                chg(evt) {
                    let ch = evt.data || '';
                    // handle selected text, backspace key, or new character...
                    let [start,end] = this.selected.isSelected ? [this.selected.start+1,this.selected.end+1] : [evt.target.selectionStart,evt.target.selectionEnd];
                    this.temp = (evt.inputType==='deleteContentBackward') ? this.temp.slice(0,start) + this.temp.slice(end+1) :
                        this.temp.slice(0,start-1) + ch + this.temp.slice(end-1);
                    this.selected.isSelected = false;
                    if (this.timex) {
                        clearTimeout(this.timex);
                        this.timex = null;
                    };
                    if (this.private) { // provides the temporary display of characters then displays a * string
                        this.timex = setTimeout(()=>{ this.updateText(); this.timex = null; this.$emit('update:modelValue', this.temp); },300); 
                    } else { // not private displays the actual value
                        this.text = this.temp;
                        this.$emit('update:modelValue', this.temp);
                    };
                },
                slct(evt) { // mark selected text...
                    let [start,end] = [evt.srcElement.selectionStart,evt.srcElement.selectionEnd];
                    this.selected = { isSelected: true, start, end };
                },
                updateText() { this.text = this.private ? '*'.repeat(this.temp.length) : this.temp; }
            },
            template: `<input class="private-input" ref="elmt" type="text" :value="text" :autocapitalize="autocap" :autocorrect="autocrct" @select="slct" @input="chg">`,
            watch: {
                modelValue: function(mv) { if (mv!==this.temp) this.temp = mv; this.updateText(); },
                private: function(p) { this.updateText(); }
            }
        },

        'toggle-button': {
            props: ['init',"labels"],
            data: function() { return {
                state: Number(!!this.init),
                lbls: this.labels ? VueLib3.asList(this.labels) : ['OFF','ON']
            }},
            methods: {
                change(state) {
                    this.state = state===undefined ? 1-this.state : state ? 1 : 0;
                    this.$emit('state',!!this.state);
                }
            },
            template: /* HTML */`<button class="toggle-button" type="button" @click="change()">{{ lbls[state] }}</button>`
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

        // automatically loads dependencies before generating content...
        // dependencies: array of objects with type and src properties
        // returns array of [error_flag, result_object]
        lazyLoader: {
            install: (app, options) => {

                async function lazyLoader(dependencies=[]) {

                    let trap = (evt) => {
                        evt.preventDefault();
                        const event = new CustomEvent('catch',{detail: {message: `${evt.filename} not found or syntax error`}});
                        let src = dependencies.map(d=>d.src).filter(s=>evt.filename.includes(s))[0];
                        let target = document.querySelector(`script[src="${src}"]`);
                        target.dispatchEvent(event);
                    };
                    window.addEventListener('error',trap);
                    let loads = await Promise.all(dependencies.map((d,i)=>new Promise(resolve=>{
                        switch (d.type) {
                            case 'js':
                                // scripts may load but fail parsing so require (window error) trapping and fallback timeout...
                                let timex = setTimeout((d) => resolve([true, 
                                    `${d.src} timeout: possible missing LibReady event`]), 5000, d);
                                let elmtJResolve = (x) => {  clearTimeout(timex); timex = null; resolve(x); }
                                let elmtJ = document.createElement('script');
                                elmtJ.async = 'async' in d ? d.async : elmtJ.async;
                                if (d.vue) {
                                    elmtJ.addEventListener('LibReady', evt => elmtJResolve([false,d]));
                                } else {
                                    elmtJ.onload = evt => elmtJResolve([false, d]);
                                }
                                elmtJ.addEventListener('catch',evt => elmtJResolve([true, evt.detail.message]));
                                elmtJ.onerror = e => elmtJResolve([true, e]);
                                elmtJ.src = d.src;
                                document.head.appendChild(elmtJ);
                                break;
                            case 'css':
                                let elmtC = document.createElement('link');
                                let attrs = { rel: 'stylesheet', type: 'text/css', href: d.src };
                                Object.keys(attrs).forEach(k => elmtC.setAttribute(k, attrs[k]));
                                elmtC.onload = evt => resolve([false, d]);
                                elmtC.onerror = e => resolve([true, e]);
                                document.head.appendChild(elmtC);
                                break;
                            default:
                                resolve([true, `Unsupported dependency type ${d.type} for ${d.src}`])
                        };
                    })));
                    window.removeEventListener('error', trap);
                    return loads;
                }

                app.config.globalProperties.lazyLoader = lazyLoader;  // attach to app (i.e. this)

            }

        },

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

                // logging routine wrapper...
                function scribble(verbose, id) {
                    function scribe (stage,prompt,detail) { console.log(`##${id} fetch[${stage}]:`, prompt, detail); };
                    return verbose ? scribe : // true
                        verbose===false ? ()=>{} : //false
                        (stage,prompt,detail) =>{if (stage==='request'||stage==='response') scribe(stage,prompt,detail)}; // undefined                
                }

                // fetch function attached to app...
                async function fetchJSON(method,url,options={}) {
                    options.id = options.id || VueLib3.uniqueID(4,10);
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

            }
        },

        // wrapper function to evaluate template literals...
        templafy: {
            install: (app) => {
                function templafy(template, vars = {}) {    
                    try {
                        let [keyList,values] = [Object.keys(vars).join(','),Object.values(vars)];
                        let literal = new Function('exprs','let func=('+keyList+')=>`'+template+'`; return func(...exprs)');
                        return literal(values);
                    } catch(e) { 
                        console.error(`VueLib3.templafy[${template}]: ${e}`);
                        return ''; 
                    }
                }
            app.config.globalProperties.templafy = templafy;      // attach to app (i.e. this)
            }
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
