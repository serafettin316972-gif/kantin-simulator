const $=id=>document.getElementById(id);
const NAMES={bread:'Tost ekmeği',cheese:'Kaşar',sucuk:'Sucuk',patty:'Köfte',bun:'Hamburger ekmeği',potato:'Patates',lettuce:'Marul',tomato:'Domates',tea:'Çay',cola:'Kola',ayran:'Ayran',dough:'Hamur',doughopen:'Açılmış hamur',sandwich:'Sandviç',gozraw:'Çiğ gözleme',gozleme:'Gözleme',toastraw:'Çiğ tost',toast:'Tost',burger:'Hamburger',friesraw:'Çiğ patates',fries:'Patates kızartması',potatocut:'Doğranmış patates'};
const LV=['çiğ','az pişmiş','normal','fazla pişmiş','yanmış'];
const COL={bread:0xdcb87a,cheese:0xffd23f,sucuk:0xa8322b,patty:0x6b3b22,bun:0xe3a857,potato:0xd9c07a,potatocut:0xe8d27a,lettuce:0x4caf50,tomato:0xd9342b,tea:0x8b3a1a,cola:0x2b1a14,ayran:0xf4f4ee,dough:0xf3e9d2,doughopen:0xf3e9d2,sandwich:0xe8c98a,gozraw:0xf3e9d2,gozleme:0xe2b86b,toastraw:0xdcb87a,toast:0xdcb87a,burger:0xe3a857,friesraw:0xe8d27a,fries:0xf2c33a};
const SH=[1.15,1,.8,.5,.2];
function colOf(k,lv){let c=new THREE.Color(COL[k]||0x888888);if(k==='patty'&&lv===0)return new THREE.Color(0xd88070);if(['toast','patty','burger','fries','gozleme'].includes(k))c.multiplyScalar(SH[lv==null?2:lv]);return c;}
let ws,me,ST=[],TB=[],PRICE={},S0=null,hold=null,inGame=false,code='';
const R=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFShadowMap;$('c').appendChild(R.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xcfe8ff);scene.fog=new THREE.Fog(0xcfe8ff,18,40);
const cam=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,60);scene.add(cam);
scene.add(new THREE.HemisphereLight(0xffffff,0x887766,.75));
const sun=new THREE.DirectionalLight(0xfff3dd,.8);sun.position.set(6,14,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:1,far:35});scene.add(sun);
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8});
function box(w,h,d,c,x,y,z,p){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(p||scene).add(m);return m;}
function label(t){const c=document.createElement('canvas');c.width=256;c.height=48;const g=c.getContext('2d');g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,256,48);g.fillStyle='#fff';g.font='bold 24px sans-serif';g.textAlign='center';g.fillText(t,128,32);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c)}));s.scale.set(1.6,.3,1);return s;}
const SM={},CU={},PL={},MSH={};let ground;
const TOPH={ing:1.2,board:1,cook:1.05,tea:1.2,trash:.9,register:1.1,counter:1.1,phone:1.1,upgrade:1.1,table:.95};
const TCOL={board:0xe8d9b0,cook:0x777b80,tea:0xb0b6bd,trash:0x333333,register:0x2a6fdb,counter:0x6bd36b,phone:0x9a5,upgrade:0xb455d4};
function build(){
 box(20,.2,16,0xcdbf9f,0,-.1,.5).receiveShadow=true;box(20,.1,6.2,0x9aa3ad,0,-.04,-4.1);
 box(20,4,.3,0xf1ead8,0,2,-7.2);box(.3,4,16,0xf1ead8,-10.1,2,.5);box(.3,4,16,0xf1ead8,10.1,2,.5);
 box(16.4,1.1,.5,0x7a4f2a,0,.55,-1.5).position.x=-1.8;box(16.4,.08,.7,0xb7834d,-1.8,1.12,-1.5);
 ST.forEach(s=>{if(s.type==='table'){const t=TB[s.arg];box(1.5,.08,1.5,0xa6713a,t[0],.85,t[1],scene);const top=scene.children[scene.children.length-1];box(.1,.85,.1,0x444444,t[0],.42,t[1]);
  for(const dz of[-1,1])box(.5,.5,.5,0x335c8a,t[0],.3,t[1]+dz*1.1);SM[s.id]={top,grp:null};return;}
  if(['register','counter','phone'].includes(s.type)){const m=box(.9,.45,.6,TCOL[s.type],s.x,s.type==='phone'?1.3:1.35,s.type==='phone'?s.z:-1.5);const l=label(s.label);l.position.set(s.x,2.1,s.type==='phone'?s.z:-1.5);scene.add(l);SM[s.id]={m,grp:new THREE.Group()};SM[s.id].grp.position.set(s.x,1.6,-1.5);scene.add(SM[s.id].grp);return;}
  const h=TOPH[s.type]*1.0,c=s.type==='ing'?COL[s.arg]:TCOL[s.type]||0x888888;
  const m=box(s.type==='cook'?1.7:1.4,h,.9,s.type==='ing'?0xdfe6ea:c,s.x,h/2,s.z);if(s.type==='ing')box(1.2,.35,.05,c,s.x,h*.7,s.z+.47);
  if(s.type==='upgrade'||s.type==='tea')m.material.color.set(c);
  const l=label(s.label);l.position.set(s.x,h+.6,s.z);scene.add(l);const g=new THREE.Group();g.position.set(s.x,h+.05,s.z);scene.add(g);SM[s.id]={m,grp:g,sig:''};});
}
function itemMesh(k,lv,sc){const m=new THREE.Mesh(new THREE.BoxGeometry(.32*sc,.12*sc,.32*sc),mat(0xffffff));m.material.color.copy(colOf(k,lv));if(k==='tea'||k==='cola'||k==='ayran'){m.geometry=new THREE.CylinderGeometry(.09*sc,.09*sc,.28*sc,10);}if(k==='fries')m.geometry=new THREE.BoxGeometry(.3*sc,.22*sc,.2*sc);if(k==='burger'){m.geometry=new THREE.CylinderGeometry(.18*sc,.18*sc,.2*sc,12);}m.castShadow=true;return m;}
function setItems(g,list,sig,s){if(g.userData.sig===sig)return;g.userData.sig=sig;while(g.children.length)g.remove(g.children[0]);list.forEach((it,i)=>{const m=itemMesh(it[0],it[1],1);m.position.set((i%3-1)*.35,.08+Math.floor(i/3)*.14,(Math.floor(i/3)%2)*.1);g.add(m);});}
function person(l){const g=new THREE.Group(),b=new THREE.Mesh(new THREE.CylinderGeometry(.25*l.w,.28*l.w,.9,10),mat(l.sh));b.position.y=.95;g.add(b);
 const lg=new THREE.Mesh(new THREE.BoxGeometry(.4*l.w,.5,.22),mat(0x2a2f55));lg.position.y=.25;g.add(lg);
 const hd=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),mat(l.sk));hd.position.y=1.65;g.add(hd);const ha=new THREE.Mesh(new THREE.SphereGeometry(.21,10,6,0,6.3,0,1.5),mat(l.ha));ha.position.y=1.68;g.add(ha);
 g.traverse(o=>{o.castShadow=true;});g.scale.y=l.h;g.userData={b,hd};return g;}
// input
const keys={};let yaw=0,pitch=0,px=0,pz=-3,locked=false,lastSend=0,target=null;
addEventListener('keydown',e=>{if(!inGame)return;keys[e.code]=1;if(e.code==='Tab'){e.preventDefault();$('inv').classList.remove('hide');}if(e.code==='KeyE'&&locked)doAct(false);});
addEventListener('keyup',e=>{keys[e.code]=0;if(e.code==='Tab')$('inv').classList.add('hide');});
addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.0025;pitch=Math.max(-1.4,Math.min(1.4,pitch-e.movementY*.0025));});
addEventListener('mousedown',e=>{if(!inGame)return;if(!locked){if(e.target.tagName==='CANVAS')R.domElement.requestPointerLock();return;}doAct(e.button===2);});
addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===R.domElement;if(inGame)$('menu').classList.toggle('hide',locked);});
$('resume').onclick=()=>R.domElement.requestPointerLock();
function doAct(alt){if(target&&ws.readyState===1){ws.send(JSON.stringify({t:'act',id:target.id,alt}));beep(alt?300:520,.05);}}
// audio
let AC;function beep(f,d,t){try{AC=AC||new AudioContext();const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;o.type=t||'triangle';g.gain.value=.05;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.stop(AC.currentTime+d);}catch(e){}}
// net
function connect(msg){ws=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host);ws.onopen=()=>ws.send(JSON.stringify(msg));ws.onclose=()=>{if(inGame){inGame=false;document.exitPointerLock();$('lobby').classList.remove('hide');$('err').textContent='Bağlantı koptu.';}};
 ws.onmessage=e=>{const m=JSON.parse(e.data);
  if(m.t==='e')$('err').textContent=m.m;
  else if(m.t==='m')toast(m.m,'#fc6');
  else if(m.t==='w'){me=m.id;ST=m.ST;TB=m.TB;PRICE=m.PRICE;code=m.code;build();inGame=true;$('lobby').classList.add('hide');$('hud').classList.remove('hide');$('mcode').textContent='Oda kodu: '+code;R.domElement.requestPointerLock();}
  else if(m.t==='s'){S0=m;onState(m);}};}
$('cr').onclick=()=>{let load=null;if($('ld').checked)try{load=JSON.parse(localStorage.getItem('kt_save'));}catch(e){}connect({t:'create',name:$('nm').value||'Oyuncu',load});};
$('jn').onclick=()=>connect({t:'join',name:$('nm').value||'Oyuncu',code:$('cd').value});
function toast(t,c){const d=document.createElement('div');d.textContent=t;d.style.color=c;$('msgs').appendChild(d);setTimeout(()=>d.remove(),5000);if($('msgs').children.length>6)$('msgs').firstChild.remove();}
let lastSave=0;
function fmt(s){const m=8*60+Math.floor(s/300*360);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
function onState(s){s.m.forEach(m=>{toast(m.m,m.c);if(m.m.includes('+'))beep(880,.2);});
 const my=s.pl.find(p=>p.id===me);hold=my&&my.h;
 $('top').innerHTML=`<span>💰 ${s.money}₺</span><span>Gün ${s.day} ${fmt(s.tm)} (${s.pn})</span><span>⭐ İtibar ${s.rep}</span><span>Seviye ${s.lv}</span><span>Sırada: ${s.qn}</span>${s.dl?'<span>🚚 Tedarik yolda</span>':''}`;
 $('ords').innerHTML=s.or.map(o=>`<div class="o"><b>#${o.no} ${o.n}</b> <small>${o.ty} • ${o.pay}</small><br>${o.it.map(k=>{const done=!o.need.includes(k);return`<span style="${o.need.filter(x=>x===k).length?'':'text-decoration:line-through;opacity:.5'}">${NAMES[k]}</span>`}).join(', ')}<div style="height:3px;background:#333;margin-top:3px"><div style="height:3px;width:${Math.min(100,o.w/o.pat*100)}%;background:${o.w>o.pat?'#f55':'#6c6'}"></div></div></div>`).join('');
 $('held').textContent=hold?`✋ ${NAMES[hold.k]||hold.k}${['toast','patty','burger','fries','gozleme'].includes(hold.k)?' ('+LV[hold.lv]+')':''}`:'✋ Elin boş';
 $('inv').innerHTML='<b>STOK</b><br>'+Object.entries(s.stock).map(([k,v])=>`<div style="color:${v<6?'#f77':'#fff'}">${NAMES[k]}: ${v}</div>`).join('');
 if(s.rp){const r=s.rp;$('report').classList.remove('hide');$('report').innerHTML=`<h1>Gün ${r.day} Raporu</h1><div>Müşteri: ${r.cust} • Kaybedilen: ${r.lost}</div><div>Satış: ${r.sales}₺ • Gider: ${r.exp}₺ • Kâr: ${r.profit}₺</div><div>İsraf: ${r.waste} • Memnuniyet: %${r.sat} • Temizlik: ${r.clean}</div><div>Kasa: ${r.money}₺</div><small>Yeni gün birazdan başlıyor...</small>`;}else $('report').classList.add('hide');
 if(Date.now()-lastSave>15000){lastSave=Date.now();try{localStorage.setItem('kt_save',JSON.stringify({money:s.money,day:s.day,rep:s.rep,level:s.lv,stock:s.stock}));}catch(e){}}
 // stations visuals
 for(const st of ST){const v=SM[st.id],d=s.sd[st.id];if(!v||!d)continue;
  if(st.type==='board')setItems(v.grp,d.p,JSON.stringify(d.p));
  else if(st.type==='cook'){setItems(v.grp,d.k?[[d.k==='toast'||d.k==='toastraw'?'toast':d.k,d.lv]]:[],d.k+':'+d.lv);v.m.material.color.set(d.br?0x992222:0x777b80);}
  else if(st.type==='tea'){v.m.material.color.set(d.st?(d.el>=9?0x66cc66:0xcc9933):0xb0b6bd);}
  else if(st.type==='table')v.top.material.color.set(d.dirty?0x5a3a1a:0xa6713a);}
 // floor mess
 const MS_=S0.ms||[],mseen={};for(const m of MS_){mseen[m[0]]=1;if(!MSH[m[0]]){const b=box(.7,.02,.5,0x4a3520,m[1],.02,m[2]);b.rotation.y=m[0];MSH[m[0]]=b;}}for(const id in MSH)if(!mseen[id]){scene.remove(MSH[id]);delete MSH[id];}
 // customers
 const seen={};for(const c of s.cu){seen[c.id]=1;let o=CU[c.id];if(!o){o={g:person(c.l),tx:c.x,tz:c.z,c};o.g.position.set(c.x,0,c.z);scene.add(o.g);CU[c.id]=o;}o.tx=c.x;o.tz=c.z;o.c=c;}
 for(const id in CU)if(!seen[id]){scene.remove(CU[id].g);delete CU[id];}
 const ps={};for(const p of s.pl){if(p.id===me)continue;ps[p.id]=1;let o=PL[p.id];if(!o){const g=person({w:1,h:1,sk:0xf1c27d,sh:[0xdd3333,0x33aa55,0x3366dd,0xdd9922][Object.keys(PL).length%4],ha:0x222222});const nl=label(p.n);nl.position.y=2.3;g.add(nl);o=PL[p.id]={g,hm:null,hk:''};scene.add(g);}o.tx=p.x;o.tz=p.z;o.ry=p.ry;
  const k=p.h?p.h.k+p.h.lv:'';if(k!==o.hk){o.hk=k;if(o.hm)o.g.remove(o.hm);if(p.h){o.hm=itemMesh(p.h.k,p.h.lv,1.5);o.hm.position.set(0,1.3,.5);o.g.add(o.hm);}}}
 for(const id in PL)if(!ps[id]){scene.remove(PL[id].g);delete PL[id];}
 if(held&&!hold){}
 updateHeld();}
let hm=null,hk='';function updateHeld(){const k=hold?hold.k+hold.lv:'';if(k===hk)return;hk=k;if(hm)cam.remove(hm);hm=null;if(hold){hm=itemMesh(hold.k,hold.lv,2);hm.position.set(.35,-.3,-.7);cam.add(hm);}}
function solid(x,z){for(const s of ST){if(['register','counter','phone'].includes(s.type))continue;const r=s.type==='table'?.9:s.type==='cook'?1:.8;if(Math.abs(x-s.x)<r&&Math.abs(z-(s.type==='table'?TB[s.arg][1]:s.z))<(s.type==='table'?.9:.6))return true;}
 if(z>-1.9&&z<-1.1&&x<8.2)return true;return x<-9.6||x>9.6||z<-6.8||z>8.6;}
function promptOf(s){if(s.type==='mess')return'[E] Yerdeki kiri temizle (paspas)';const d=S0.sd[s.id];switch(s.type){
 case'ing':return`[E] ${s.label} al (stok ${S0.stock[s.arg]})`;
 case'board':return hold?'[E] Tahtaya koy':d.p.length?'[E] Hazırla/al   [Sağ tık] Doğra / hamur aç':'Boş tahta';
 case'cook':return d.br?'[E] Tamir et':d.k?'[E] Çıkar'+(d.k?` (${LV[d.lv]})`:''):hold?'[E] Yerleştir':'Boş'+(s.id==='fryer'?` • Yağ %${Math.round(d.oil)} [Sağ tık] değiştir`:'');
 case'tea':return d.st?(d.el>=9?'[E] Çayı al':'Demleniyor...'):'[E] Çay demle';
 case'trash':return'[E] Çöpe at';case'register':return'[E] Sıradaki müşterinin siparişini al';case'counter':return'[E] Ürünü teslim et';
 case'phone':return'[E] Tedarik siparişi ver';case'upgrade':return`[E] İşletmeyi yükselt (${600*S0.lv}₺)`;case'table':return d.dirty?'[E] Masayı temizle':'Temiz masa';}return'';}
let prev=performance.now();
function loop(){requestAnimationFrame(loop);const now=performance.now(),dt=Math.min(.05,(now-prev)/1000);prev=now;
 if(inGame&&S0){let f=(keys.KeyW?1:0)-(keys.KeyS?1:0),r=(keys.KeyD?1:0)-(keys.KeyA?1:0);if(locked&&(f||r)){const sp=(keys.ShiftLeft?5:3)*dt,l=Math.hypot(f,r);f/=l;r/=l;
  const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*sp,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*sp;if(!solid(px+dx,pz))px+=dx;if(!solid(px,pz+dz))pz+=dz;}
  cam.position.set(px,1.6+(f||r?Math.sin(now/130)*.03:0),pz);cam.rotation.set(pitch,yaw,0,'YXZ');
  if(now-lastSend>66&&ws.readyState===1){lastSend=now;ws.send(JSON.stringify({t:'mv',x:px,z:pz,ry:yaw}));}
  let best=null,bd=2.6;const fx=-Math.sin(yaw),fz=-Math.cos(yaw);
  for(const s of ST){const sz=s.type==='table'?TB[s.arg][1]:(['register','counter','phone'].includes(s.type)?s.z:s.z),dx=s.x-px,dz=sz-pz,d=Math.hypot(dx,dz);if(d<bd&&(d<1.3||(dx*fx+dz*fz)/d>.45)){bd=d;best=s;}}
  if(S0.ms)for(const m of S0.ms){const d=Math.hypot(m[1]-px,m[2]-pz);if(d<bd&&d<1.8){bd=d;best={id:'m:'+m[0],type:'mess',x:m[1],z:m[2]};}}
  if(target&&SM[target.id]&&SM[target.id].m)SM[target.id].m.material.emissive&&SM[target.id].m.material.emissive.set(0);
  target=best;if(best){const v=SM[best.id];if(v&&v.m)v.m.material.emissive.set(0x333300);$('prompt').textContent=promptOf(best);$('prompt').classList.remove('hide');}else $('prompt').classList.add('hide');
  const k=Math.min(1,dt*8);
  for(const id in CU){const o=CU[id],g=o.g,dx=o.tx-g.position.x,dz=o.tz-g.position.z,mv=Math.hypot(dx,dz)>.02;g.position.x+=dx*k;g.position.z+=dz*k;
   const st=o.c.st;if(st==='eat'){g.position.y=-.25;g.userData.hd.position.y=1.65+Math.sin(now/200)*.04;g.rotation.y=Math.PI;}else{g.position.y=mv?Math.abs(Math.sin(now/120+o.c.s))*.05:0;if(mv)g.rotation.y=Math.atan2(dx,dz);else if(st==='queue'||st==='wait')g.rotation.y=Math.PI;}}
  for(const id in PL){const o=PL[id],g=o.g;g.position.x+=(o.tx-g.position.x)*k;g.position.z+=(o.tz-g.position.z)*k;g.rotation.y=o.ry+Math.PI;}}
 R.render(scene,cam);}
loop();
