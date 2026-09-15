((LitElement) => {

console.info('NUMBERBOX_CARD 4.18');
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
class NumberBox extends LitElement {

constructor() {
	super();
	this.bounce = false;
	this.pending = false;
	this.rolling = false;
	this.editing = false;
	this.state = 0;
	this.old = {state: NaN, t:{}, h:''};
}

render() {
	if(!this.stateObj){return html`<ha-card>Missing:'${this.config.entity}'</ha-card>`;}
	
	const k={name:'friendly_name',icon:'icon',picture:'entity_picture',unit:'unit_of_measurement'};
	for(const n of Object.keys(k)) {
		if( this.config[n] === undefined && this.stateObj.attributes[k[n]] ){
			this.config[n]=this.stateObj.attributes[k[n]];
		}
	}

	const d={min:0,max:9e9,step:1,toggle:null};
	for(const j of Object.keys(d)) {
		const b=j+'_entity';
		if(b in this.config && this.config[b] in this._hass.states ) {
			const c=this._hass.states[this.config[b]]; this.old.t[this.config[b]]=c.last_updated
			if( d[j]!==null && !isNaN(parseFloat(c.state)) ){this.config[j]=c.state;}
			if(j=='toggle'){this.config[j]=c;}
		}
		if(d[j]!==null){
			if(this.config[j] === undefined){ this.config[j]=this.stateObj.attributes[j];}
			if(this.config[j] === undefined && this.attrs && this.attrs[j]){ this.config[j]=this.stateObj.attributes[this.attrs[j]];}
			if(isNaN(parseFloat(this.config[j]))){this.config[j]=d[j];}
		}
	}

	return html`
	<ha-card class="${(!this.config.border)?'noborder':''} ${this.config.align?'align-'+this.config.align:''}" style="${this.cardStyle()}">
		${(this.config.icon || this.config.picture || this.config.name) ? html`<div class="${this.config.toggle?'gridt':'grid'}">
		<div class="grid-content grid-left" @click="${() => this.moreInfo()}">
			${this.config.picture ? html`
				<state-badge
				.overrideImage="${this.config.picture}"
				></state-badge>` : this.config.icon ? html`
				<state-badge
				.overrideIcon="${this.config.icon}"
				.stateObj=${this.stateObj}
				></state-badge>` : null }
			<div class="info">
				${this.config.name?this.config.name:''}
				${this.secondaryInfo()}
			</div>
		</div><div class="grid-content grid-right">${this.renderNum()}</div>
		${this.config.toggle ? html`<div class="grid-content grid-right"><ha-entity-toggle .stateObj="${this.config.toggle}"
		.hass="${this._hass}"></ha-entity-toggle></div>` : null }
		</div>` : this.renderNum() }
		${this.renderBar()}
	</ha-card>
`;
}

updated(x) {
	if(this.old.h !=''){
		const a=this.renderRoot.querySelector('.secondary');
		if(a){a.innerHTML=this.old.h;}
	}
	if(this.editing){
		const i=this.renderRoot.querySelector('.num-input');
		if(i && this.renderRoot.activeElement !== i){
			i.focus();
			if(i.select){i.select();}
		}
	}
}

secondaryInfo(){
	let s=this.config.secondary_info;
	if(!s){return;}
	const lu='last_updated last_changed last-updated last-changed'.split(' ');
	let ret=s;
	if(lu.indexOf(s)>-1){
		s='%'+this.config.entity+':'+(s.replace('-','_'));
	}
	let r=[];
	if(s.indexOf('%')> -1){
		ret='';
		const j=s.split(' ');
		while(j.length){
			let t=j.shift();
			if(t[0]=='%'){
				let f=NaN;
				t=t.substring(1).split(':');
				let b=this._hass.states;
				for (let d=0; d<t.length; d++){
					if(lu.indexOf(t[d])>1){t[d]=t[d].replace('-','_');}
					const id = t[d];
					if(id[0]=='~'){
						f=Number(id.substring(1));
						if(!isNaN(f)){
							let g=parseFloat(b);
							if(isNaN(g)){f=NaN;}else{b=g;}
						}
						break;
					}
					if(b.hasOwnProperty(id)){
						b=b[id];
						if(!d){
							this.old.t[id]=b.last_updated;
						}
						if(lu.indexOf(id)> -1){
							if(ret){
								const div = document.createElement('div');
								div.innerHTML=ret+' ';
								r.push(html`${div}`);
								ret = '';
							}
							r.push(html`<ha-relative-time .datetime=${new Date(b)} .hass=${this._hass} ></ha-relative-time> `);
							b='';
							break;
						}
					}
				}
				ret += (typeof b !== 'object')? (isNaN(f)?b:b.toFixed(f)) : '?';
			}else{
				ret += t;
			}
			ret += ' ';
		}
	}
	ret=ret.trim();
	if(ret){
		const d2=document.createElement('div');
		d2.innerHTML=ret;
		r.push(html`${d2}`);
	}
	return html`<div class="secondary">${r}</div>`;
}

renderNum(){
	const l=this.lim();
	const b=this.config.button_style?' btn-'+this.config.button_style:'';
	const n=this.config.name||this.config.entity;
	return html`
	<section class="body">
	<div class="main">
		<div class="cur-box">
		<ha-icon class="padl${b} ${l.max?'atlimit':''}" tabindex="0" role="button"
			aria-label="${n} +${this.config.step}"
			aria-disabled="${l.max?'true':'false'}"
			icon="${this.config.icon_plus}" 
			@click="${() => this.setNumb(1)}" 
			@mousedown="${() => this.Press(1)}"
			@keydown="${(k) => this.Press(1,k)}"
			@touchstart="${() => this.Press(1)}"
			@mouseup="${() => this.Press(2)}"
			@touchend="${() => this.Press(2)}"
		>
		</ha-icon>
		<div class="cur-num-box ${this.config.show_limits?'col':''}" @click="${() => this.numClick()}" >
			${this.editing ? html`<input class="num-input"
				type="${this.isTime()?'text':'number'}"
				inputmode="${this.isTime()?'text':'decimal'}"
				step="${this.config.step}"
				.value="${this.editVal()}"
				aria-label="${n}"
				@click="${(e) => e.stopPropagation()}"
				@keydown="${(e) => this.editKey(e)}"
				@blur="${(e) => this.editDone(e)}"
			>` : html`<h3 class="cur-num ${(this.pending===false)? '':'upd'}"> ${this.niceNum()} </h3>`}
			${this.config.show_limits ? html`<div class="limits">${this.limText()}</div>` : null}
		</div>
		<ha-icon class="padr${b} ${l.min?'atlimit':''}" tabindex="0" role="button"
			aria-label="${n} -${this.config.step}"
			aria-disabled="${l.min?'true':'false'}"
			icon="${this.config.icon_minus}"
			@click="${() => this.setNumb(0)}"
			@mousedown="${() => this.Press(0)}"
			@keydown="${(k) => this.Press(0,k)}"
			@touchstart="${() => this.Press(0)}"
			@mouseup="${() => this.Press(2)}"
			@touchend="${() => this.Press(2)}"
		>
		</ha-icon>
		</div>
	</div>
	</section>`;
}

cardStyle(){
	const c=this.config;
	const p=(v)=>(v===undefined||v===null||v==='')?null:(isNaN(v)?String(v):v+'px');
	const s=[];
	const add=(n,v)=>{if(v!==null&&v!==undefined&&v!==''&&v!==false){s.push(n+':'+v);}};
	add('--numberbox-font-size',p(c.font_size));
	add('--numberbox-font-weight',c.font_weight!==undefined?c.font_weight:(c.bold?'bold':null));
	add('--numberbox-color',c.color);
	add('--numberbox-pending-color',c.pending_color);
	add('--numberbox-icon-size',p(c.icon_size));
	add('--numberbox-icon-color',c.icon_color);
	add('--numberbox-button-color',c.button_color);
	add('--numberbox-progress-color',c.progress_color);
	return s.join(';');
}

curNum(){
	let v=this.pending;
	if(v===false){v=this.timeNum(this.state);}
	v=Number(v);
	return isNaN(v)?NaN:v;
}

lim(){
	const r={min:false,max:false,pct:null};
	const v=this.curNum();
	const mn=Number(this.config.min), mx=Number(this.config.max);
	const st=Number(this.config.step)||0;
	if(isNaN(v)||isNaN(mn)||isNaN(mx)){return r;}
	r.max=(Math.round((v+st)*1e9)/1e9) > mx;
	r.min=(Math.round((v-st)*1e9)/1e9) < mn;
	if(mx>mn && mx<9e9){r.pct=Math.max(0,Math.min(100,(v-mn)*100/(mx-mn)));}
	return r;
}

renderBar(){
	if(!this.config.progress){return null;}
	const p=this.lim().pct;
	if(p===null){return null;}
	return html`<div class="bar"><div class="bar-fill" style="width:${p}%"></div></div>`;
}

limText(){
	const mn=Number(this.config.min), mx=Number(this.config.max);
	if(isNaN(mn)||isNaN(mx)||mx>=9e9){return '';}
	const f=(x)=>this.isTime()?this.numTime(x,1,this.config.unit):x;
	return f(mn)+' – '+f(mx);
}

isTime(){
	const u=this.config.unit;
	return (u=='time'||u=='timehm');
}

editVal(){
	const v=this.curNum();
	if(isNaN(v)){return '';}
	return this.isTime()? this.numTime(v,0,this.config.unit) : String(v);
}

numClick(){
	if(this.config.edit && !this.editing){
		clearTimeout(this.bounce);
		this.editing=true;
		return;
	}
	this.moreInfo();
}

editKey(e){
	e.stopPropagation();
	if(e.key=='Enter'){this.editDone(e);}
	else if(e.key=='Escape'){this.editing=false;}
}

editDone(e){
	if(!this.editing){return;}
	this.editing=false;
	let v=this.timeNum(e.target.value);
	if(e.target.value==='' || isNaN(v)){return;}
	const mn=Number(this.config.min), mx=Number(this.config.max);
	if(!isNaN(mn)){v=Math.max(mn,v);}
	if(!isNaN(mx)){v=Math.min(mx,v);}
	v=Math.round(v*1e9)/1e9;
	if(v===this.curNum()){return;}
	this.pending=v;
	this.haptic();
	clearTimeout(this.bounce);
	this.publishNum(this);
}

haptic(t){
	if(!this.config.haptic){return;}
	const e=new Event('haptic',{bubbles:true,composed:true});
	e.detail=(typeof this.config.haptic=='string')?this.config.haptic:(t||'light');
	this.dispatchEvent(e);
}



Press(v,k) {
	if( k && (k.keyCode == 13 || k.keyCode == 32) ){
		this.setNumb(v); return;
	}
	if( this.config.speed>0 ){
		clearInterval(this.rolling);
		if(v<2){this.rolling = setInterval(() => this.setNumb(v), this.config.speed, this);}
	}
}

timeNum(x,s,m){
	x=x+'';
	if(x.indexOf(':')>0){
		if(x.indexOf('T')>0){x=x.split('T').pop();}
		if(x.indexOf(' ')>0){x=x.split(' ').pop();}
		if(x.indexOf('+')>0){x=x.split('+')[0];}
		x = x.split(':');s = 0; m = 1;
		while (x.length > 0) {
			s += m * parseInt(x.pop(), 10);
			m *= 60;
		}
		x=s;
	}
	return Number(x);
}

numTime(x,f,t,u){
	if(t=="timehm"){u=1;f=1;}
	x=Math.round(x);
	t = (x>=3600 || f)? Math.floor(x/3600).toString().padStart(2,'0') + ':' : '';
	t += (Math.floor(x/60)-Math.floor(x/3600)*60).toString().padStart(2,'0');
	if( !u ){
		t += ':' + Math.round(x%60).toString().padStart(2,'0');
	}
	return t;
}

setNumb(c){
	let v=this.pending;
	if( v===false ){ v=this.timeNum(this.state); v=isNaN(v)?this.config.min:v;}
	let adval=c?(v + Number(this.config.step)):(v - Number(this.config.step));
	adval=Math.round(adval*1e9)/1e9;
	if(adval==this.state){
		clearTimeout(this.bounce);this.pending=false;
	}else{
		if(adval <= Number(this.config.max) && adval >= Number(this.config.min)){
			this.pending = adval;
			this.haptic();
			if(this.config.delay){
				clearTimeout(this.bounce);
				this.bounce = setTimeout(this.publishNum, this.config.delay, this);
			}else{
				this.publishNum(this);
			}
		}
	}
}

publishNum(dhis){
	if(dhis.pending===false){return;}
	const s=dhis.config.service.split('.');
	let p=dhis.config.param;
	if(s[0]=='input_datetime'){
		dhis.pending=dhis.numTime(dhis.pending,1);
		const a=dhis.stateObj?dhis.stateObj.attributes:{};
		if(p=='time' && a.has_date && a.has_time){
			const day=(dhis.stateObj.state+'').split(' ')[0];
			if(/^\d{4}-\d{2}-\d{2}$/.test(day)){
				p='datetime';
				dhis.pending=day+' '+dhis.pending;
			}
		}
	}
	const v = { ...dhis.config.service_params, [p]: dhis.pending };
	dhis.pending=false;
	dhis.old.state=dhis.state;
	dhis._hass.callService(s[0], s[1], v);
}

niceNum(){
	let fix=0; let v=this.pending;
	if( v === false ){
		v=this.state;
		if(v=='unavailable' || v === null || ( v=='unknown' && this.config.initial === undefined ) ){return '?';}
		v=this.timeNum(v);
		if(isNaN(v) && this.config.initial !== undefined){
			v=Number(this.config.initial);
			if(isNaN(v)){return this.config.initial;}
		}
	}	
	let stp=Number(this.config.step) || 1;
	if( Math.round(stp) != stp ){
		fix=stp.toString().split(".")[1].length || 1; stp=fix;
	}else{ stp=fix; }
	fix = v.toFixed(fix);
	const u=this.config.unit;
	if( u=="time" || u=="timehm"){
		let t = this.numTime(fix,0,u);
		return html`${t}`;
	}
	if(isNaN(Number(fix))){return '?';}
	if(typeof u == 'string' && u.startsWith('(')){
		let value = fix; value = eval(u);
		return html`${value}`;
	}

	const lang={language:this._hass.language, comma_decimal:['en-US','en'], decimal_comma:['de','es','it'], space_comma:['fr','sv','cs'], system:undefined};
	let g=this._hass.locale.number_format || 'language';
	if(g!='none'){
		g=lang.hasOwnProperty(g)? lang[g] : lang.language;
		fix = new Intl.NumberFormat(g, {maximumFractionDigits: stp, minimumFractionDigits: stp}).format(Number(fix));
	}
	return u===false ? fix: html`${fix}<span class="cur-unit">${u}</span>`;
}



moreInfo() {
	const i = this.config.moreinfo;
	if(!i){return;}
	let v = 'hass-more-info'; let d = {entityId: this.config.moreinfo};
	if(i[0] == '/'){
		v = 'location-changed'; d = {replace:false};
		history.pushState(null, "", i);
	}
	const e = new Event(v, {bubbles: true, cancelable: true, composed: true});
	e.detail = d;
	this.dispatchEvent(e);
	return e;
}

static get properties() {
	return {
		_hass: {},
		config: {},
		stateObj: {},
		bounce: {},
		rolling: {},
		pending: {},
		editing: {},
		state: {},
		old: {},
	};
}

static get styles() {
	return css`
	ha-card{
		-webkit-font-smoothing:var(--paper-font-body1_-_-webkit-font-smoothing);
		font-size:var(--paper-font-body1_-_font-size);
		font-weight:var(--paper-font-body1_-_font-weight);
		line-height:var(--paper-font-body1_-_line-height);
		padding:4px 0}
	state-badge{flex:0 0 40px;}
	ha-card.noborder{padding:0 !important;margin:0 !important;
		box-shadow:none !important;border:none !important}
	.body{
		display:grid;grid-auto-flow:column;grid-auto-columns:1fr;
		place-items:center}
	.main{display:flex;flex-direction:row;align-items:center;justify-content:center}
	.cur-box{display:flex;align-items:center;justify-content:center;flex-direction:row-reverse}
	.cur-num-box{display:flex;align-items:center}
	.cur-num-box.col{flex-direction:column;justify-content:center}
	.cur-num{
		font-size:var(--numberbox-font-size,var(--paper-font-subhead_-_font-size));
		line-height:var(--numberbox-line-height,var(--paper-font-subhead_-_line-height));
		color:var(--numberbox-color,inherit);
		font-weight:var(--numberbox-font-weight,normal);
		margin:0;white-space:nowrap}
	.cur-unit{font-size:var(--numberbox-unit-size,80%);
		opacity:var(--numberbox-unit-opacity,0.5);padding-left:2px}
	.upd{color:var(--numberbox-pending-color,#f00)}
	.padr,.padl{padding:8px;cursor:pointer;border-radius:50%;
		color:var(--numberbox-icon-color,inherit);
		--mdc-icon-size:var(--numberbox-icon-size,24px);
		transition:background-color .15s ease-in-out,transform .1s ease-in-out,opacity .15s ease-in-out}
	.padr:hover,.padl:hover{background-color:var(--numberbox-hover-color,rgba(127,127,127,0.15))}
	.padr:active,.padl:active{transform:scale(0.88)}
	.padr:focus-visible,.padl:focus-visible{
		outline:2px solid var(--primary-color,#03a9f4);outline-offset:1px}
	.atlimit{opacity:0.3;cursor:default}
	.btn-outlined,.btn-filled,.btn-square{margin:2px 4px}
	.btn-outlined{border:1px solid var(--divider-color,rgba(127,127,127,0.4))}
	.btn-filled{background-color:var(--numberbox-button-color,var(--secondary-background-color))}
	.btn-square{border-radius:6px}
	.btn-square.btn-square{border-radius:6px}
	.num-input{
		font-size:var(--numberbox-font-size,var(--paper-font-subhead_-_font-size));
		font-family:inherit;font-weight:var(--numberbox-font-weight,normal);
		color:var(--primary-text-color);background:var(--card-background-color,transparent);
		border:1px solid var(--primary-color,#03a9f4);border-radius:4px;
		width:4.5em;max-width:100%;text-align:center;padding:2px 4px;margin:0;
		-moz-appearance:textfield;appearance:textfield}
	.num-input::-webkit-outer-spin-button,.num-input::-webkit-inner-spin-button{
		-webkit-appearance:none;margin:0}
	.limits{font-size:11px;line-height:1.2;padding:0 4px;
		color:var(--secondary-text-color);white-space:nowrap}
	.bar{height:var(--numberbox-progress-height,3px);margin:2px 12px 2px;border-radius:3px;
		background-color:var(--numberbox-progress-track,rgba(127,127,127,0.25));overflow:hidden}
	.bar-fill{height:100%;border-radius:3px;
		background-color:var(--numberbox-progress-color,var(--primary-color,#03a9f4));
		transition:width .2s ease-in-out}
	ha-card.align-left .body{justify-items:start}
	ha-card.align-right .body{justify-items:end}
	@media (prefers-reduced-motion: reduce){
		.padr,.padl,.bar-fill{transition:none}
		.padr:active,.padl:active{transform:none}
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, auto);
	}
	.gridt {
		display: grid;
		grid-template-columns: repeat(3, auto);
	}
	.grid-content {
		display: grid; align-items: center;
	}
	.grid-left {
		cursor: pointer;
		flex-direction: row;
		display: flex;
		overflow: hidden;
	}
	.info{
		margin-left: 16px;
		margin-right: 8px;
		text-align: left;
		font-size: var(--paper-font-body1_-_font-size);
		flex: 1 0 30%;
	}
	.info, .info > * {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.grid-right .body{margin-left:auto}
	.grid-right {
		text-align: right
	}
	.secondary{
		color:var(--secondary-text-color);
		white-space: normal;}
	`;
}

getCardSize() {
	return 1;
}

setConfig(config) {
	if (!config.entity) throw new Error('Please define an entity.');
	const c=config.entity.split('.')[0];
	const dom=NumberBox.domains()[c];
	if (!(config.service || c == 'input_number' || c == 'number' || dom)){
		throw new Error('Please define a number entity.');
	}
	const pre=dom?{...dom}:{};
	this.attrs=(!config.param || config.param==pre.param) ? (pre.attrs||{}) : {};
	delete pre.attrs;
	this.config = {
		icon_plus: "mdi:plus",
		icon_minus: "mdi:minus",
		service: c + ".set_value",
		param: "value",
		delay: 1000,
		speed: 0,
		refresh: 0,
		initial: undefined,
		moreinfo: config.entity,
		service_params: {entity_id: config.entity},
		...pre,
		...config
	};
	if(this.config.service.split('.').length < 2){
		this.config.service=c +'.'+this.config.service;
	}
}

set hass(hass) {
	if (hass && this.config) {
		this.stateObj = this.config.entity in hass.states ? hass.states[this.config.entity] : null;
	}
	this._hass = hass;
	if(this.stateObj){
		this.state=this.stateObj.state;
		if(this.config.state){this.state=this.stateObj.attributes[this.config.state];}
	}
}

shouldUpdate(changedProps) {
	if(changedProps.has('editing')){ return true; }
	if(this.editing){ return false; }
	const o = this.old.t;
	for(const p in o){if(p in this._hass.states && this._hass.states[p].last_updated != o[p]){ return true; }}
	if( changedProps.has('config') || changedProps.has('stateObj') || changedProps.has('pending') ){
		if(this.old.state != this.state || this.config.refresh){ return true; }
	}
}

static getConfigElement() {
	return document.createElement("numberbox-card-editor");
}

static getStubConfig() {
	return {border: true};
}

static domains() {
	return {
		cover:{service:'cover.set_cover_position',param:'position',state:'current_position',
			min:0,max:100,step:10,unit:'%',icon_plus:'mdi:arrow-up',icon_minus:'mdi:arrow-down'},
		fan:{service:'fan.set_percentage',param:'percentage',state:'percentage',
			min:0,max:100,step:10,unit:'%'},
		light:{service:'light.turn_on',param:'brightness',state:'brightness',
			min:0,max:255,step:25,unit:false},
		media_player:{service:'media_player.volume_set',param:'volume_level',state:'volume_level',
			min:0,max:1,step:0.05,unit:false},
		climate:{service:'climate.set_temperature',param:'temperature',state:'temperature',
			attrs:{min:'min_temp',max:'max_temp',step:'target_temp_step'}},
		input_datetime:{service:'input_datetime.set_datetime',param:'time',
			unit:'time',min:0,max:86340,step:60},
		timer:{service:'timer.start',param:'duration',state:'duration',
			unit:'time',min:0,max:86340,step:60}
	};
}

} customElements.define('numberbox-card', NumberBox);

//Editor
const fireEvent = (node, type, detail = {}, options = {}) => {
	const event = new Event(type, {
		bubbles: options.bubbles === undefined ? true : options.bubbles,
		cancelable: Boolean(options.cancelable),
		composed: options.composed === undefined ? true : options.composed,
	});
	event.detail = detail;
	node.dispatchEvent(event);
	return event;
};

class NumberBoxEditor extends LitElement {

async Pick(){
	const c="ha-entity-picker";
	if(!customElements.get(c)){
		const r = "partial-panel-resolver";
		await customElements.whenDefined(r);
		const p = document.createElement(r);
		p.hass = {panels: [{url_path: "tmp", component_name: "config"}]};
		p._updateRoutes();
		await p.routerOptions.routes.tmp.load();
		const d=document.createElement("ha-panel-config");
		await d.routerOptions.routes.automation.load();
	}
	const a=document.createElement(c);
	this.render();
}
static get properties() {
	return { hass: {}, config: {} };
}

static get styles() {
	return css`
.side {
	display:flex;
	align-items:center;
}
.side > * {
	flex:1;
	padding-right:4px;
}	
`;
}
get _border() {
	if (this.config.border) {
		return true;
	} else {
		return false;
	}
}
setConfig(config) {
	this.config = config;
	this.Pick();
}

render() {
	if (!this.hass){ return html``; }
	return html`
<div class="side">
	<ha-entity-picker
		label="Entity (required)"
		.hass=${this.hass}
		.value="${this.config.entity}"
		.configValue=${'entity'}
		.includeDomains=${['input_number','number']}
		@change="${this.updVal}"
		allow-custom-entity
	></ha-entity-picker>
	<ha-formfield label="Show border?">
		<ha-switch
			.checked=${this._border}
			.configValue="${'border'}"
			@change=${this.updVal}
		></ha-switch>
	</ha-formfield>
</div>
<div class="side">
	<ha-textfield
		label="Name (Optional, false to hide)"
		.value="${(this.config.name!==undefined)?this.config.name:''}"
		.configValue="${'name'}"
		@input="${this.updVal}"
	></ha-textfield>
	<ha-icon-picker
		label="Icon (Optional, false to hide)"
		.value="${(this.config.icon!==undefined)?this.config.icon:''}"
		.configValue="${'icon'}"
		@value-changed="${this.updVal}"
	></ha-icon-picker>
</div>
<div class="side">
	<ha-textfield
		label="Secondary Info (Optional)"
		.value="${(this.config.secondary_info!==undefined)?this.config.secondary_info:''}"
		.configValue="${'secondary_info'}"
		@input="${this.updVal}"
	></ha-textfield>
</div>
<div class="side">
	<ha-textfield
		label="Picture url(Optional, false to hide)"
		.value="${(this.config.picture!==undefined)?this.config.picture:''}"
		.configValue="${'picture'}"
		@input="${this.updVal}"
	></ha-textfield>
</div><div class="side">
	<ha-icon-picker
		label="Icon Plus"
		.value="${(this.config.icon_plus)?this.config.icon_plus:'mdi:plus'}"
		.configValue=${'icon_plus'}
		@value-changed=${this.updVal}
	></ha-icon-picker>
	<ha-icon-picker
		label="Icon Minus"
		.value="${(this.config.icon_minus)?this.config.icon_minus:'mdi:minus'}"
		.configValue=${'icon_minus'}
		@value-changed=${this.updVal}
	></ha-icon-picker>
</div>			
<div class="side">
	<ha-textfield
		label="Initial [?]"
		.value="${(this.config.initial!==undefined)?this.config.initial:'?'}"
		.configValue=${'initial'}
		@input=${this.updVal}
		type="number"
		step="any"
	></ha-textfield>
	<ha-textfield
		label="Unit (false to hide)"
		.value="${(this.config.unit!==undefined)?this.config.unit:''}"
		.configValue=${'unit'}
		@input=${this.updVal}
	></ha-textfield>
</div>
<div class="side">
	<ha-textfield
		label="Update Delay (ms)"
		.value="${(this.config.delay!==undefined)?this.config.delay:'1000'}"
		.configValue=${'delay'}
		@input=${this.updVal}
		type="number"
	></ha-textfield>
	<ha-textfield
		label="Long press Speed (ms)"
		.value="${(this.config.speed!==undefined)?this.config.speed:'0'}"
		.configValue=${'speed'}
		@input=${this.updVal}
		type="number"
	></ha-textfield>
</div>
<div><b>Display</b></div>
<div class="side">
	<ha-textfield
		label="Value font size (eg 26 or 1.8em)"
		.value="${(this.config.font_size!==undefined)?this.config.font_size:''}"
		.configValue=${'font_size'}
		@input=${this.updVal}
	></ha-textfield>
	<ha-textfield
		label="Value color (eg green, #ff0)"
		.value="${(this.config.color!==undefined)?this.config.color:''}"
		.configValue=${'color'}
		@input=${this.updVal}
	></ha-textfield>
</div>
<div class="side">
	<ha-textfield
		label="Button icon size (px)"
		.value="${(this.config.icon_size!==undefined)?this.config.icon_size:''}"
		.configValue=${'icon_size'}
		@input=${this.updVal}
		type="number"
	></ha-textfield>
	<ha-textfield
		label="Button icon color"
		.value="${(this.config.icon_color!==undefined)?this.config.icon_color:''}"
		.configValue=${'icon_color'}
		@input=${this.updVal}
	></ha-textfield>
</div>
<div class="side">
	<ha-textfield
		label="Button style (outlined/filled/square)"
		.value="${(this.config.button_style!==undefined)?this.config.button_style:''}"
		.configValue=${'button_style'}
		@input=${this.updVal}
	></ha-textfield>
	<ha-textfield
		label="Align (left/center/right)"
		.value="${(this.config.align!==undefined)?this.config.align:''}"
		.configValue=${'align'}
		@input=${this.updVal}
	></ha-textfield>
</div>
<div class="side">
	<ha-formfield label="Bold value">
		<ha-switch
			.checked=${this.config.bold===true}
			.configValue="${'bold'}"
			@change=${this.updVal}
		></ha-switch>
	</ha-formfield>
	<ha-formfield label="Progress bar">
		<ha-switch
			.checked=${this.config.progress===true}
			.configValue="${'progress'}"
			@change=${this.updVal}
		></ha-switch>
	</ha-formfield>
</div>
<div class="side">
	<ha-formfield label="Show min/max">
		<ha-switch
			.checked=${this.config.show_limits===true}
			.configValue="${'show_limits'}"
			@change=${this.updVal}
		></ha-switch>
	</ha-formfield>
	<ha-formfield label="Type value">
		<ha-switch
			.checked=${this.config.edit===true}
			.configValue="${'edit'}"
			@change=${this.updVal}
		></ha-switch>
	</ha-formfield>
	<ha-formfield label="Haptic">
		<ha-switch
			.checked=${this.config.haptic===true}
			.configValue="${'haptic'}"
			@change=${this.updVal}
		></ha-switch>
	</ha-formfield>
</div>
<div><b>Advanced Config</b> <a target="_blank" href="https://github.com/htmltiger/numberbox-card#configuration">more info</a></div>
<div class="side">
	<ha-textfield
		label="min"
		.value="${(this.config.min!==undefined)?this.config.min:''}"
		.configValue="${'min'}"
		@input="${this.updVal}"
		type="number"
		step="any"
	></ha-textfield>
	<ha-textfield
		label="max"
		.value="${(this.config.max!==undefined)?this.config.max:''}"
		.configValue="${'max'}"
		@input="${this.updVal}"
		type="number"
		step="any"
	></ha-textfield>
	<ha-textfield
		label="step"
		.value="${(this.config.step!==undefined)?this.config.step:''}"
		.configValue="${'step'}"
		@input="${this.updVal}"
		type="number"
		step="any"
	></ha-textfield>
</div>
<div class="side">
	<ha-entity-picker
		label="min_entity"
		.hass=${this.hass}
		.value="${this.config.min_entity}"
		.configValue=${'min_entity'}
		@change="${this.updVal}"
		allow-custom-entity
	></ha-entity-picker>
	<ha-entity-picker
		label="max_entity"
		.hass=${this.hass}
		.value="${this.config.max_entity}"
		.configValue=${'max_entity'}
		@change="${this.updVal}"
		allow-custom-entity
	></ha-entity-picker>
</div>
<div class="side">
	<ha-entity-picker
		label="step_entity"
		.hass=${this.hass}
		.value="${this.config.step_entity}"
		.configValue=${'step_entity'}
		@change="${this.updVal}"
		allow-custom-entity
	></ha-entity-picker>
	<ha-entity-picker
		label="toggle_entity"
		.hass=${this.hass}
		.value="${this.config.toggle_entity}"
		.configValue=${'toggle_entity'}
		@change="${this.updVal}"
		allow-custom-entity
	></ha-entity-picker>
</div>
<div class="side">
	<ha-entity-picker
		label="moreinfo"
		.hass=${this.hass}
		.value="${this.config.moreinfo}"
		.configValue=${'moreinfo'}
		@change="${this.updVal}"
		allow-custom-entity
	></ha-entity-picker>
</div>
<div class="side">
	<ha-textfield
		label="service"
		.value="${(this.config.service!==undefined)?this.config.service:''}"
		.configValue="${'service'}"
		@input="${this.updVal}"
	></ha-textfield>
	<ha-textfield
		label="param"
		.value="${(this.config.param!==undefined)?this.config.param:''}"
		.configValue="${'param'}"
		@input="${this.updVal}"
	></ha-textfield>
	<ha-textfield
		label="state"
		.value="${(this.config.state!==undefined)?this.config.state:''}"
		.configValue="${'state'}"
		@input="${this.updVal}"
	></ha-textfield>
</div>

`;
}


updVal(v) {
	if (!this.config || !this.hass) {return;}
	const { target } = v;
	if (this[`_${target.configValue}`] === target.value) {
		return;
	}
	if (target.configValue) {
		if (target.value === '') {
			try{delete this.config[target.configValue];}catch(e){}
		} else {
			const reg = new RegExp(/^-?\d*\.?\d+$/);
			if (target.value === 'false') {
				target.value = false;
			}else if(reg.test(target.value)){
				target.value=Number(target.value);
			}
			this.config = {
				...this.config,
				[target.configValue]: target.checked !== undefined ? target.checked : target.value,
			};
		}
	}
	fireEvent(this, 'config-changed', { config: this.config });
}

}
customElements.define("numberbox-card-editor", NumberBoxEditor);

})(window.LitElement || Object.getPrototypeOf(customElements.get("hui-masonry-view") ));

window.customCards = window.customCards || [];
window.customCards.push({
	type: 'numberbox-card',
	name: 'Numberbox Card',
	preview: false,
	description: 'Replace number/input_number sliders with plus and minus buttons'
});
