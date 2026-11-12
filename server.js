const express=require('express'),http=require('http'),{WebSocketServer}=require('ws');
const app=express();app.use(express.static(__dirname+'/public'));
const server=http.createServer(app),wss=new WebSocketServer({server});
const ING={bread:['Tost ekmeği',3],cheese:['Kaşar',5],sucuk:['Sucuk',6],patty:['Köfte',15],bun:['Hamburger ekmeği',4],potato:['Patates',4],lettuce:['Marul',2],tomato:['Domates',2],tea:['Çay',1],cola:['Kola',8],ayran:['Ayran',6],dough:['Hamur',5]};
const PRICE={toast:45,burger:90,fries:40,tea:10,cola:25,ayran:20,sandwich:35,gozleme:55};
const MENU=Object.keys(PRICE);
const ST=[];const S=(id,type,x,z,label,arg)=>ST.push({id,type,x,z,label,arg});
['bread','cheese','sucuk','patty','bun','potato','lettuce','tomato'].forEach((k,i)=>S('i_'+k,'ing',-8.5+i*2.2,-6.6,ING[k][0],k));
S('i_dough','ing',9,-6.6,'Hamur','dough');S('sac','cook',7.5,-5.7,'Gözleme sacı',{accept:'gozraw',out:'gozleme'});S('i_cola','ing',9,-5,'Kola dolabı','cola');S('i_ayran','ing',9,-3.5,'Ayran dolabı','ayran');
S('b1','board',-7,-4,'Kesme tahtası 1');S('b2','board',-5,-4,'Kesme tahtası 2');
S('toaster','cook',-2.5,-4,'Tost makinesi',{accept:'toastraw',out:'toast'});
S('grill','cook',0,-4,'Izgara',{accept:'patty',out:'patty'});
S('fryer','cook',2.5,-4,'Fritöz',{accept:'friesraw',out:'fries'});
S('tea','tea',5,-4,'Çay makinesi');S('trash','trash',7.5,-4,'Çöp kutusu');
S('reg','register',-3,-2.3,'Kasa');S('counter','counter',2,-2.3,'Teslim tezgâhı');
S('phone','phone',-9,-2.5,'Tedarik telefonu');S('upg','upgrade',-9,-4.3,'İşletme yükseltme');
const TB=[[-8,3.5],[-8,6.5],[3.5,3.5],[3.5,6.5],[7,3.5],[7,6.5]];
TB.forEach((t,i)=>S('t'+i,'table',t[0],t[1],'Masa '+(i+1),i));
const DAY=300,PER=[[0,60,.07,'Sabah'],[60,100,.22,'İlk teneffüs'],[100,160,.06,'Ders'],[160,230,.3,'Öğle arası'],[230,270,.06,'Ders'],[270,300,.18,'Okul çıkışı']];
const NAMESL=['Ali','Ayşe','Mehmet','Zeynep','Can','Elif','Burak','Deniz','Efe','Selin','Emre','Ece'];
const TYPES=[['Aceleci öğrenci',45,2],['Aç öğrenci',70,3],['Sessiz müşteri',80,1],['Sabırsız müşteri',40,2],['Öğretmen',90,2],['Müdavim',75,2]];
const pick=a=>a[Math.floor(Math.random()*a.length)],rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rooms={};
function newRoom(load){let code;do code=Array.from({length:4},()=>'ABCDEFGHJKLMNPRSTUVYZ'[Math.floor(Math.random()*21)]).join('');while(rooms[code]);
 const stock={};for(const k in ING)stock[k]=load&&load.stock&&load.stock[k]!=null?load.stock[k]:20;
 const r={code,players:{},cust:[],money:load?.money??500,day:load?.day??1,tm:0,rep:load?.rep??60,level:load?.level??1,stock,sd:{},deliv:[],msgs:[],no:1,cid:1,pause:0,rp:null,rush:0,evT:60,mess:[],mid:1,emptyAt:0,st:{}};
 resetStats(r);
 for(const s of ST){r.sd[s.id]=s.type==='board'?{parts:[],cut:0}:s.type==='cook'?{item:null,t0:0,br:false,fix:0,oil:100}:s.type==='tea'?{st:0,t0:0}:s.type==='table'?{dirty:false,occ:false}:{};}
 rooms[code]=r;return r;}
function resetStats(r){r.st={cust:0,sales:0,exp:0,waste:0,satSum:0,satN:0,lost:0};}
const lvOf=(el,lvl)=>{const f=1+.15*(lvl-1),th=[4,8,13,18].map(x=>x*f);return th.filter(x=>el>=x).length;};
const msg=(r,m,c)=>r.msgs.push({m,c:c||'#fff'});
function say(pl,m){send(pl.ws,{t:'m',m});}
function send(ws,o){if(ws.readyState===1)ws.send(JSON.stringify(o));}
function dist(pl,s){return Math.hypot(pl.x-s.x,pl.z-s.z);}
function act(r,pl,id,alt){if(id.startsWith('m:')){const i=r.mess.findIndex(m=>'m:'+m.id===id);if(i>=0&&Math.hypot(pl.x-r.mess[i].x,pl.z-r.mess[i].z)<2.8)r.mess.splice(i,1);return;}const s=ST.find(x=>x.id===id);if(!s||dist(pl,s)>3.2)return;const d=r.sd[id],h=pl.hold,now=Date.now()/1000;
 switch(s.type){
 case'ing':if(h)return say(pl,'Elin dolu!');if(r.stock[s.arg]<=0)return say(pl,s.label+' stoğu bitti! Telefondan tedarik ver.');
  r.stock[s.arg]--;pl.hold={k:s.arg,lv:2,t:now};break;
 case'board':
  if(alt){const i=d.parts.findIndex(p=>p.k==='potato'||p.k==='dough');if(i<0)return say(pl,'Doğranacak patates veya açılacak hamur yok.');if(++d.cut>=3){d.parts[i]=d.parts[i].k==='potato'?{k:'potatocut',lv:0}:{k:'doughopen',lv:0};d.cut=0;}return;}
  if(h){if(h.k==='patty'&&h.lv<1)return say(pl,'Köfteyi önce ızgarada pişir!');
   if(!['bread','cheese','sucuk','bun','potato','lettuce','tomato','patty','dough'].includes(h.k))return say(pl,'Bu tahtaya konmaz.');
   if(d.parts.length>=7)return say(pl,'Tahta dolu.');d.parts.push({k:h.k,lv:h.lv});pl.hold=null;return;}
  if(!d.parts.length)return;const ks=d.parts.map(p=>p.k),has=k=>ks.includes(k);
  if(has('potatocut')){pl.hold={k:'friesraw',lv:0};d.parts=d.parts.filter(p=>p.k!=='potatocut');}
  else if(has('bun')&&has('patty')){const p=d.parts.find(p=>p.k==='patty');pl.hold={k:'burger',lv:p.lv,x:ks.filter(k=>['cheese','lettuce','tomato'].includes(k)).length};d.parts=[];}
  else if(has('doughopen')&&has('cheese')){pl.hold={k:'gozraw',lv:0};d.parts=[];}
  else if(has('bread')&&!has('bun')&&(has('tomato')||has('lettuce'))){pl.hold={k:'sandwich',lv:2,x:ks.length-1};d.parts=[];}
  else if(has('bread')&&has('cheese')&&!has('bun')){pl.hold={k:'toastraw',lv:0};d.parts=[];}
  else{d.parts=[];r.st.waste++;say(pl,'Geçersiz tarif! Malzemeler çöpe gitti.');}
  break;
 case'cook':{const a=s.arg;
  if(alt&&s.id==='fryer'){if(r.money<40)return say(pl,'Yağ için 40₺ yok.');r.money-=40;r.st.exp+=40;d.oil=100;return msg(r,'Fritöz yağı değişti','#9f9');}
  if(d.br){if(++d.fix>=5){d.br=false;d.fix=0;msg(r,s.label+' tamir edildi','#9f9');}else say(pl,'Tamir ediliyor '+d.fix+'/5');return;}
  if(h&&h.k===a.accept&&!d.item){d.item=h;d.t0=now;pl.hold=null;if(Math.random()<.04){d.br=true;msg(r,s.label+' ARIZALANDI! E ile tamir et','#f66');}}
  else if(!h&&d.item){const lv=lvOf(now-d.t0,r.level);const o={k:a.out,lv,t:now};if(s.id==='fryer'){if(d.oil<30)o.dirty=1;d.oil=Math.max(0,d.oil-10);}pl.hold=o;d.item=null;}
  else if(h&&d.item)say(pl,'Makine dolu.');else if(h)say(pl,'Bu makineye uygun değil.');break;}
 case'tea':if(h)return say(pl,'Elin dolu!');
  if(d.st===0){if(r.stock.tea<=0)return say(pl,'Çay bitti!');r.stock.tea--;d.st=1;d.t0=now;}
  else if(now-d.t0<9)say(pl,'Çay demleniyor...');else{pl.hold={k:'tea',lv:2,t:now};d.st=0;}break;
 case'trash':if(h){pl.hold=null;r.st.waste++;}break;
 case'register':{const q=r.cust.filter(c=>c.st==='queue').sort((a,b)=>a.id-b.id)[0];if(!q||Math.hypot(q.x-q.tx,q.z-q.tz)>.6)return say(pl,'Kasada bekleyen müşteri yok.');
  q.no=r.no++;q.st='wait';q.t0=now;q.pay=Math.random()<.5?'Nakit':'Kart';msg(r,`Sipariş #${q.no} alındı (${q.name})`,'#9cf');break;}
 case'counter':{if(!h)return say(pl,'Elin boş.');if(!PRICE[h.k])return say(pl,'Bu ürün servis edilemez.');
  const c=r.cust.filter(c=>c.st==='wait'&&c.need.includes(h.k)).sort((a,b)=>a.no-b.no)[0];if(!c)return say(pl,'Bu ürünü bekleyen müşteri yok.');
  c.need.splice(c.need.indexOf(h.k),1);
  if(['toast','burger','fries','gozleme'].includes(h.k))c.pen+=Math.abs(h.lv-2)*18+(h.lv===0?10:0);
  if(h.dirty)c.pen+=15;if(h.k==='tea'&&now-h.t>45)c.pen+=20;
  if(h.x!=null&&h.k==='burger')c.pen-=h.x*2;
  pl.hold=null;if(!c.need.length)finish(r,c,now);break;}
 case'phone':{if(r.deliv.length)return say(pl,'Zaten bir teslimat yolda.');let tot=0;const add={};
  for(const k in ING){const n=Math.max(0,25-r.stock[k]);if(n){add[k]=n;tot+=n*ING[k][1];}}
  if(!tot)return say(pl,'Stoklar yeterli.');if(r.money<tot)return say(pl,`Tedarik ${tot}₺, yeterli para yok.`);
  r.money-=tot;r.st.exp+=tot;r.deliv.push({at:now+15+(r.delay||0),add});r.delay=0;msg(r,`Tedarik verildi (${tot}₺), 15 sn içinde gelir`,'#fc6');break;}
 case'upgrade':{const c=600*r.level;if(r.money<c)return say(pl,`Yükseltme ${c}₺`);r.money-=c;r.st.exp+=c;r.level++;msg(r,'İşletme seviyesi '+r.level+'! Daha geniş pişirme aralığı, daha fazla müşteri','#fd6');break;}
 case'table':if(!h&&d.dirty){d.dirty=false;}break;}
}
function finish(r,c,now){const wp=Math.min(40,(now-c.t0)/c.pat*40),dirty=Object.values(r.sd).filter(x=>x.dirty).length+r.mess.length;
 const sat=clamp(Math.round(100-c.pen-wp-dirty*3),0,100);let pay=c.total;if(sat>85)pay=Math.round(pay*1.1);else if(sat<40)pay=Math.round(pay*.6);
 r.money+=pay;r.st.sales+=pay;r.st.cust++;r.st.satSum+=sat;r.st.satN++;r.rep=clamp(r.rep+(sat-60)/20,0,100);
 msg(r,`#${c.no} teslim: +${pay}₺ (${c.pay}) memnuniyet %${sat}`,sat>60?'#9f9':'#fa6');
 const t=r.sd[Object.keys(r.sd).filter(k=>k[0]==='t'&&k.length==2&&!r.sd[k].occ&&!r.sd[k].dirty).sort(()=>Math.random()-.5)[0]];
 if(t){t.occ=true;c.seat=TB.findIndex((_,i)=>r.sd['t'+i]===t);c.st='toTable';}else{c.st='leave';}c.sat=sat;}
function spawn(r){const ty=pick(TYPES),n=clamp(Math.round(rnd(1,ty[2]+.5)),1,4),need=[];
 for(let i=0;i<n;i++)need.push(pick(MENU));const total=need.reduce((a,k)=>a+PRICE[k],0);
 r.cust.push({id:r.cid++,x:-3+rnd(-.5,.5),z:9.5,tx:-3,tz:0.4,st:'queue',name:pick(NAMESL),type:ty[0],pat:ty[1],need,items:need.slice(),total,pen:0,t0:0,qt:Date.now()/1000,
  look:{h:rnd(.9,1.12),w:rnd(.85,1.2),sk:pick([0xf1c27d,0xe0ac69,0xc68642,0x8d5524,0xffdbac]),sh:Math.floor(Math.random()*0xffffff),ha:pick([0x111111,0x3b2314,0x8b5a2b,0xd2a24c,0x222222])},
  sp:rnd(1.2,2),seed:Math.random()*6});}
function walk(c,tx,tz,dt,others){const dx=tx-c.x,dz=tz-c.z,d=Math.hypot(dx,dz);let vx=0,vz=0;if(d>.12){vx=dx/d*c.sp;vz=dz/d*c.sp;}
 for(const o of others){if(o===c)continue;const ax=c.x-o.x,az=c.z-o.z,dd=Math.hypot(ax,az);if(dd<.75&&dd>.001){const f=(.75-dd)*3;vx+=ax/dd*f;vz+=az/dd*f;}}
 c.x+=vx*dt;c.z+=vz*dt;return d<.2;}
function tick(r,dt){const now=Date.now()/1000;
 for(const p of Object.values(r.players)){} 
 for(let i=r.deliv.length-1;i>=0;i--)if(now>=r.deliv[i].at){for(const k in r.deliv[i].add)r.stock[k]+=r.deliv[i].add[k];r.deliv.splice(i,1);msg(r,'Tedarik teslim edildi!','#9f9');}
 if(r.pause>0){r.pause-=dt;if(r.pause<=0){r.rp=null;r.day++;r.tm=0;resetStats(r);}}
 else{r.tm+=dt;if(r.tm>=DAY){const s=r.st;r.rp={day:r.day,cust:s.cust,sales:s.sales,exp:s.exp,profit:s.sales-s.exp,waste:s.waste,lost:s.lost,sat:s.satN?Math.round(s.satSum/s.satN):0,clean:clamp(100-Object.values(r.sd).filter(x=>x.dirty).length*15-r.mess.length*6,0,100),money:r.money};r.pause=12;r.cust.forEach(c=>{if(c.st!=='eat'&&c.st!=='toTable')c.st='leave';});}
  else{const pr=PER.find(p=>r.tm>=p[0]&&r.tm<p[1])||PER[0];let rate=pr[2]*(.5+r.rep/100)*(.9+.1*r.level);if(r.rush>0){rate*=3;r.rush-=dt;}
   if(r.cust.filter(c=>c.st==='queue').length<6&&Object.keys(r.players).length&&Math.random()<rate*dt)spawn(r);
   if((r.evT-=dt)<=0){r.evT=rnd(60,100);const e=Math.floor(Math.random()*4);
    if(e===0){const m=pick(['toaster','grill','fryer']);r.sd[m].br=true;msg(r,ST.find(s=>s.id===m).label+' ARIZALANDI! Tamir et (E x5)','#f66');}
    else if(e===1){r.rush=20;msg(r,'Beklenmedik müşteri yoğunluğu!','#fc6');}
    else if(e===2){r.delay=15;msg(r,'Tedarik firması gecikme bildirdi (+15 sn)','#fc6');}
    else{const dn=Object.values(r.sd).filter(x=>x.dirty).length+r.mess.length;if(dn>2){r.money=Math.max(0,r.money-100);r.st.exp+=100;msg(r,'TEMİZLİK DENETİMİ: kirli masalar yüzünden -100₺ ceza!','#f66');}else msg(r,'Temizlik denetimi geçildi, itibar arttı!','#9f9');}}}}
 r.rep=clamp(r.rep-r.mess.length*.01*dt*(r.pause>0?0:1),0,100);
 const q=r.cust.filter(c=>c.st==='queue').sort((a,b)=>a.id-b.id);q.forEach((c,i)=>{c.tz=.4+i*.9;});
 const ws=r.cust.filter(c=>c.st==='wait').sort((a,b)=>a.no-b.no);ws.forEach((c,i)=>{c.tx=-.5+(i%8)*1.3;c.tz=.5+Math.floor(i/8)*.9;});
 for(const c of r.cust.slice()){
  if(c.st==='queue'){walk(c,c.tx,c.tz,dt,r.cust);if(now-c.qt>c.pat+25){c.st='leave';r.st.lost++;r.rep=clamp(r.rep-1.5,0,100);}}
  else if(c.st==='wait'){walk(c,c.tx,c.tz,dt,r.cust);if(now-c.t0>c.pat*1.5){c.st='leave';r.st.lost++;r.rep=clamp(r.rep-3,0,100);msg(r,`#${c.no} sabrı tükenip gitti!`,'#f66');}}
  else if(c.st==='toTable'){const t=TB[c.seat];if(walk(c,t[0],t[1]-1,dt,r.cust)){c.st='eat';c.et=now+12;}}
  else if(c.st==='eat'){if(now>c.et){r.sd['t'+c.seat].occ=false;r.sd['t'+c.seat].dirty=true;if(r.mess.length<12)r.mess.push({id:r.mid++,x:TB[c.seat][0]+rnd(-1.2,1.2),z:TB[c.seat][1]+rnd(-.2,1.6)});c.st='leave';}}
  else if(c.st==='leave'){if(walk(c,-3,10,dt,r.cust)||c.z>9.8)r.cust.splice(r.cust.indexOf(c),1);}}
}
function stateOf(r){const now=Date.now()/1000,sd={};
 for(const s of ST){const d=r.sd[s.id];if(s.type==='board')sd[s.id]={p:d.parts.map(p=>[p.k,p.lv]),c:d.cut};
  else if(s.type==='cook')sd[s.id]={k:d.item&&d.item.k,lv:d.item?lvOf(now-d.t0,r.level):0,br:d.br,oil:d.oil};
  else if(s.type==='tea')sd[s.id]={st:d.st,el:d.st?now-d.t0:0};else if(s.type==='table')sd[s.id]={dirty:d.dirty};}
 const pr=PER.find(p=>r.tm>=p[0]&&r.tm<p[1])||PER[0];
 return{t:'s',pl:Object.values(r.players).map(p=>({id:p.id,n:p.name,x:p.x,z:p.z,ry:p.ry,h:p.hold})),
  cu:r.cust.map(c=>({id:c.id,x:+c.x.toFixed(2),z:+c.z.toFixed(2),st:c.st,l:c.look,s:c.seed})),
  or:r.cust.filter(c=>c.st==='wait').sort((a,b)=>a.no-b.no).map(c=>({no:c.no,n:c.name,ty:c.type,it:c.items,need:c.need,pay:c.pay,w:Math.round(now-c.t0),pat:c.pat})),
  qn:r.cust.filter(c=>c.st==='queue').length,money:Math.round(r.money),day:r.day,tm:Math.round(r.tm),pn:pr[3],rep:Math.round(r.rep),lv:r.level,stock:r.stock,sd,rp:r.rp,m:r.msgs.splice(0),dl:r.deliv.length,ms:r.mess.map(m=>[m.id,m.x,m.z]),code:r.code};}
wss.on('connection',ws=>{let room=null,pl=null;
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw);}catch{return;}
  if(m.t==='create'||m.t==='join'){if(room)return;let r=m.t==='create'?newRoom(m.load):rooms[String(m.code||'').toUpperCase()];
   if(!r)return send(ws,{t:'e',m:'Oda bulunamadı!'});if(Object.keys(r.players).length>=4)return send(ws,{t:'e',m:'Oda dolu (maks. 4 oyuncu).'});
   room=r;const id=Math.random().toString(36).slice(2,8);pl={id,ws,name:String(m.name||'Oyuncu').slice(0,12),x:rnd(-1,1),z:-3,ry:0,hold:null};r.players[id]=pl;
   send(ws,{t:'w',id,ST,ING,TB,PRICE,code:r.code});msg(r,pl.name+' kantine katıldı','#9cf');}
  else if(!room)return;
  else if(m.t==='mv'){if(isFinite(m.x)&&isFinite(m.z)){pl.x=clamp(m.x,-10,10);pl.z=clamp(m.z,-7,9);pl.ry=+m.ry||0;}}
  else if(m.t==='act')act(room,pl,String(m.id),!!m.alt);});
 ws.on('close',()=>{if(!room)return;delete room.players[pl.id];msg(room,pl.name+' oyundan ayrıldı','#fa6');if(!Object.keys(room.players).length)setTimeout(()=>{if(!Object.keys(room.players).length)delete rooms[room.code];},60000);});});
setInterval(()=>{for(const r of Object.values(rooms)){if(!Object.keys(r.players).length)continue;tick(r,.1);const s=JSON.stringify(stateOf(r));for(const p of Object.values(r.players))if(p.ws.readyState===1)p.ws.send(s);}},100);
server.listen(process.env.PORT||3000,()=>console.log('Kantin Tycoon hazır'));
