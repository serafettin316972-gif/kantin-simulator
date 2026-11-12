import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

const root=document.getElementById("game");
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x9aa9a0); scene.fog=new THREE.Fog(0x9aa9a0,19,42);
const camera=new THREE.PerspectiveCamera(74,innerWidth/innerHeight,.08,90); camera.position.set(0,1.68,7.4);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.45));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.08; root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe5f0e8,0x5a5142,2.0));
const sun=new THREE.DirectionalLight(0xffe6bd,2.25); sun.position.set(-7,12,5); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;scene.add(sun);
const fill=new THREE.PointLight(0xffd7a0,28,17);fill.position.set(0,4,0);scene.add(fill);
const mat=(color,rough=.65,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const M={wall:mat(0xe7e3d8),green:mat(0x1e4837,.55),deep:mat(0x172e25),wood:mat(0x98704c,.7),woodLight:mat(0xc59a6a),tile:mat(0xb8b8ae,.82),metal:mat(0x687a79,.3,.72),white:mat(0xf1f0e9,.3),glass:new THREE.MeshPhysicalMaterial({color:0xd9edf0,roughness:.12,metalness:.08,transmission:.18,transparent:true,opacity:.24}),black:mat(0x171d1a,.28,.25),gold:mat(0xd5a953,.28,.55),red:mat(0xb74b3c,.4),blue:mat(0x5b8ea6,.38),yellow:mat(0xe4bd62,.5),orange:mat(0xd88a48,.55)};
const colliders=[]; const interactables=[]; const customers=[]; let money=1250,revenue=0,rep=100,stock=36,dayMinutes=480,started=false,paused=false,activePanel=false,scanned=0,customerTimer=0,served=0;
const box=(w,h,d,material,x,y,z,shadow=true)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;scene.add(o);return o};
const cylinder=(r1,r2,h,material,x,y,z,seg=20)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),material);o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o};
const label=(text,x,y,z,w=1.4,h=.32,bg=0x183e30,fg="#f3d58e")=>{const c=document.createElement("canvas");c.width=512;c.height=128;const g=c.getContext("2d");g.fillStyle="#"+bg.toString(16).padStart(6,"0");g.fillRect(0,0,512,128);g.fillStyle=fg;g.font="bold 46px Arial";g.textAlign="center";g.fillText(text,256,82);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:false}));m.position.set(x,y,z);scene.add(m);return m};
function wall(w,h,d,x,y,z,material=M.wall){box(w,h,d,material,x,y,z)}
// Room shell: open front for first-person entrance
box(22,.22,18,M.tile,0,-.13,-1);
wall(22,5.2,.28,0,2.5,-10);wall(.28,5.2,18,-11,2.5,-1);wall(.28,5.2,18,11,2.5,-1);wall(22,5.2,.28,0,2.5,8);
box(22,.18,18,mat(0xd9d5ca),0,5.18,-1);
for(let x=-9;x<=9;x+=3)box(.035,5,.035,mat(0xc9c5b9),x,2.5,-9.82,false);
for(let x=-9;x<=9;x+=4.5){const lamp=box(2.4,.08,.55,mat(0xfff1cf,.2),x,5,-1);const l=new THREE.PointLight(0xffe9c7,10,10);l.position.set(x,4.8,-1);scene.add(l)}
// decorative green wall band, signage
box(21,.55,.12,M.green,0,3.95,-9.82);label("OKUL KANTİNİ",0,4.6,-9.78,3.6,.55);
label("Taze • Lezzetli • Günlük",0,3.55,-9.75,3.2,.25,0x244b3a,"#e9e2cd");
// floor tile joints
const grout=mat(0x999b91,.9);for(let x=-10;x<=10;x+=2)box(.018,.008,17,grout,x,.002,-1,false);for(let z=-9;z<=7;z+=2)box(21,.008,.018,grout,0,.003,z,false);
// back prep counter
box(7,.95,1.15,M.wood,0,.5,-6.9);box(7.1,.12,1.22,M.deep,0,1.03,-6.9);box(6.9,.06,1.1,M.woodLight,0,1.11,-6.9);
for(let x=-2.8;x<=2.8;x+=1.4){box(.035,.8,.035,M.gold,x,.55,-6.28);}
// wall shelves behind counter
for(let y of [2.05,2.85]){box(6,.09,.55,M.woodLight,0,y,-8.9);for(let x=-2.6;x<=2.6;x+=.65)box(.025,.12,.5,M.gold,x,y-.1,-8.62,false)}
// stocked goods: detailed product boxes and cans
const productMats=[mat(0x2f7180,.36),mat(0xc54f3d,.4),mat(0xe0bd60,.48),mat(0x46734c,.42),mat(0xe8e5dc,.45),mat(0x774f8b,.45)];
for(let row=0;row<2;row++)for(let i=0;i<9;i++){const x=-2.55+i*.64,y=2.23+row*.8,z=-8.68;const p=box(.37,.48,.28,productMats[(i+row*2)%productMats.length],x,y,z,false);box(.28,.035,.012,M.white,x,y-.04,z+.15,false);box(.22,.035,.012,M.gold,x,y+.06,z+.15,false)}
// fridge units on right
function fridge(x,z,title){box(1.65,3.25,.9,M.deep,x,1.62,z);box(1.48,3.05,.08,M.metal,x,1.62,z+.48);box(1.35,2.88,.035,M.glass,x,1.62,z+.53);box(1.4,.1,.08,M.metal,x,3.08,z+.59);box(.06,2.75,.05,M.metal,x-.68,1.62,z+.6);box(.06,2.75,.05,M.metal,x+.68,1.62,z+.6);for(let y of [.72,1.5,2.25]){box(1.35,.045,.72,M.white,x,y,z+.25);for(let i=0;i<5;i++){const can=cylinder(.105,.105,.38,productMats[(i+Math.round(y))%6],x-.52+i*.26,y+.22,z+.22,16);cylinder(.106,.106,.025,M.metal,can.position.x,y+.42,z+.22,16)}}label(title,x,3.45,z+.55,1.25,.23,0x173a2c)}
fridge(7.5,-6.4,"SOĞUK İÇECEK");fridge(9.35,-6.4,"SÜT & AYRAN");
// front display cabinet with sandwiches and pastries
box(3.4,1.1,.9,M.deep,-5.4,1,-4.7);box(3.32,.08,.84,M.gold,-5.4,1.58,-4.7);box(3.2,.72,.05,M.glass,-5.4,1.98,-4.3);box(3.2,.72,.05,M.glass,-5.4,1.98,-5.1);
for(let i=0;i<5;i++){const s=box(.42,.18,.3,M.yellow,-6.6+i*.6,1.72,-4.7);s.rotation.z=(i%2?-.08:.08);box(.34,.035,.02,M.red,s.position.x,1.73,-4.53,false)}
label("GÜNLÜK ATIŞTIRMALIK", -5.4,2.55,-4.28,2.8,.28);
// checkout counter in front right
box(4.1,1.15,1.55,M.wood,3.7,.58,-1.1);box(4.2,.13,1.62,M.deep,3.7,1.2,-1.1);box(4.08,.05,1.5,M.woodLight,3.7,1.29,-1.1);
box(.72,.09,.56,M.black,2.55,1.38,-.72);box(.55,.035,.4,mat(0x192b31,.2),2.55,1.44,-.72);
box(.5,.34,.13,M.black,3.55,1.58,-.48);box(.44,.25,.02,mat(0x14282b,.15),3.55,1.59,-.4);
label("₺  KASA",3.55,1.63,-.38,.38,.16,0x1d3430,"#9fe3c0");
box(.55,.07,.38,M.metal,4.45,1.4,-.75);box(.3,.02,.2,M.black,4.45,1.45,-.75);
const register={name:"Kasa",kind:"register",position:new THREE.Vector3(3.7,1.5,-.9)};interactables.push(register);
// display snack racks left side
function rack(x,z){box(1.4,2.1,.65,M.metal,x,1.05,z);for(let y of [.35,.95,1.55]){box(1.32,.055,.62,M.woodLight,x,y,z);for(let i=0;i<5;i++){const p=box(.19,.34,.22,productMats[(i+Math.round(y*4))%6],x-.53+i*.26,y+.19,z-.08,false);box(.14,.035,.012,M.white,p.position.x,y+.2,z+.04,false)}}}
rack(-8,-.4);rack(-8,2.1);label("ATIŞTIRMALIK",-8,2.35,-.03,1.4,.24);
// tables and chairs
function table(x,z){cylinder(.08,.12,.85,M.metal,x,.42,z,16);cylinder(.95,.95,.12,M.woodLight,x,.88,z,32);for(let a=0;a<4;a++){const q=a*Math.PI/2;box(.55,.12,.55,M.green,x+Math.cos(q)*1.25,.48,z+Math.sin(q)*1.25)}}
table(-3,3.4);table(2,4.4);table(7,3.5);
// plant pots
function plant(x,z){cylinder(.3,.38,.42,mat(0x9b6544),x,.22,z);for(let i=0;i<6;i++){const leaf=box(.12,.75,.12,mat(0x426c49),x+Math.sin(i)*.2,.72,z+Math.cos(i)*.2);leaf.rotation.z=(i-2.5)*.18}}
plant(-9,6.5);plant(9,6.5);
// wall clock
cylinder(.42,.42,.07,M.white,-9,4.15,-9.72,32);box(.025,.24,.025,M.black,-9,4.22,-9.66,false);box(.2,.025,.025,M.black,-8.91,4.15,-9.66,false);
// cashier staff counter sign
label("SİPARİŞ & ÖDEME",3.6,2.35,-.22,2.5,.3);
// player + movement
const keys={};let yaw=0,pitch=0,velocity=new THREE.Vector3();let locked=false;
function onLock(){locked=true}function onUnlock(){locked=false;if(started&&!paused){paused=true;document.getElementById("pauseScreen").classList.remove("hidden")}}
renderer.domElement.addEventListener("click",()=>{if(started&&!paused&&!activePanel)renderer.domElement.requestPointerLock()});
document.addEventListener("pointerlockchange",()=>{if(document.pointerLockElement===renderer.domElement)onLock();else if(locked)onUnlock()});
document.addEventListener("mousemove",e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0018;pitch=THREE.MathUtils.clamp(pitch,-1.25,1.25);camera.rotation.set(pitch,yaw,0,"YXZ")});
document.addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="KeyE")interact();if(e.code==="Escape"&&started&&!activePanel){paused=!paused;document.getElementById("pauseScreen").classList.toggle("hidden",!paused);if(!paused)renderer.domElement.requestPointerLock()}});
document.addEventListener("keyup",e=>keys[e.code]=false);
function move(dt){if(!locked||paused||activePanel)return;const dir=new THREE.Vector3();if(keys.KeyW)dir.z-=1;if(keys.KeyS)dir.z+=1;if(keys.KeyA)dir.x-=1;if(keys.KeyD)dir.x+=1;dir.normalize();const speed=keys.ShiftLeft?5.4:3.55;dir.applyAxisAngle(new THREE.Vector3(0,1,0),yaw);const nx=camera.position.x+dir.x*speed*dt,nz=camera.position.z+dir.z*speed*dt;if(Math.abs(nx)<10.25&&Math.abs(nz)<8.8){camera.position.x=nx;camera.position.z=nz;}camera.position.y=1.68+Math.sin(performance.now()*.008)*.018*(dir.length()>0?1:0)}
// products on shelves and stock refill interactable
interactables.push({name:"Ürün rafı",kind:"shelf",position:new THREE.Vector3(-8,1.2,-.4)},{name:"Soğuk içecek dolabı",kind:"fridge",position:new THREE.Vector3(7.5,1.5,-6.4)},{name:"Hazırlık tezgâhı",kind:"prep",position:new THREE.Vector3(0,1.2,-6.9)},{name:"Stok deposu",kind:"stock",position:new THREE.Vector3(-9,1.1,-7.5)});
// customer NPCs simple low-poly but smooth capsule silhouettes
const skin=mat(0xd8a982),hair=mat(0x3b302b),shirtMats=[mat(0x5d8c79),mat(0x9b6b58),mat(0x607a9c),mat(0xb28b4f),mat(0x88749b)];
function makeCustomer(index){const g=new THREE.Group();const shirt=shirtMats[index%shirtMats.length];const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.27,.55,4,8),shirt);torso.position.y=.92;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,14,12),skin);head.position.y=1.48;g.add(head);const haircap=new THREE.Mesh(new THREE.SphereGeometry(.225,14,8,0,Math.PI*2,0,Math.PI*.55),hair);haircap.position.y=1.53;g.add(haircap);for(let s of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.42,3,6),M.deep);leg.position.set(s*.13,.32,0);g.add(leg)}g.position.set(-.2,.03,5.8);scene.add(g);return {group:g,target:new THREE.Vector3(2.8,0,1.1),phase:"approach",speed:.8+Math.random()*.3,patience:100,order:Math.random()>.5?"Tost + Ayran":"Sandviç + Su",value:Math.random()>.5?75:65,offset:index*.4}}
function spawnCustomer(){if(customers.length>=4)return;customers.push(makeCustomer(customers.length+served));updateHUD();toast("Yeni müşteri geldi. Kasaya bekliyor.");}
function updateCustomers(dt){for(let i=customers.length-1;i>=0;i--){const c=customers[i];if(c.phase==="approach"){const target=new THREE.Vector3(2.7,0,1.2+i*.82);const d=target.clone().sub(c.group.position);if(d.length()<.12){c.phase="waiting";c.group.rotation.y=Math.PI;}else{c.group.position.add(d.normalize().multiplyScalar(c.speed*dt));c.group.rotation.y=Math.atan2(d.x,d.z)}}else if(c.phase==="served"){c.group.position.z+=dt*2;if(c.group.position.z>8){scene.remove(c.group);customers.splice(i,1)}}else{c.patience-=dt*1.2;if(c.patience<0){rep=Math.max(0,rep-4);scene.remove(c.group);customers.splice(i,1);toast("Müşteri beklemekten vazgeçti.");updateHUD()}}}}
const ray=new THREE.Raycaster();const center=new THREE.Vector2(0,0);let nearest=null;
function checkTarget(){ray.setFromCamera(center,camera);let best=null,dist=3.1;for(const item of interactables){const d=camera.position.distanceTo(item.position);if(d<dist){const to=item.position.clone().sub(camera.position).normalize();if(camera.getWorldDirection(new THREE.Vector3()).dot(to)>.45){best=item;dist=d}}}nearest=best;const hint=document.getElementById("hint");hint.classList.toggle("hidden",!best||activePanel);if(best)document.getElementById("hintText").textContent=best.name+" · İncele"}
function interact(){if(!nearest||activePanel||!locked)return;openPanel(nearest)}
function openPanel(item){activePanel=true;document.exitPointerLock();const panel=document.getElementById("interactionPanel"),content=document.getElementById("panelContent");document.getElementById("panelTitle").textContent=item.name;content.innerHTML="";panel.classList.remove("hidden");
const add=(title,desc,fn)=>{const b=document.createElement("button");b.className="action";b.innerHTML=`<b>${title}</b><small>${desc}</small>`;b.onclick=fn;content.appendChild(b)};
const grid=document.createElement("div");grid.className="action-grid";content.appendChild(grid);
if(item.kind==="register"){addTo(grid,"Müşteriyi tamamla","Ürünleri okut ve ödemeyi al",()=>{const c=customers.find(x=>x.phase==="waiting");if(!c){toast("Şu anda kasada bekleyen müşteri yok.");return}if(scanned<1){toast("Önce ürünleri okutmalısın.");return}money+=c.value;revenue+=c.value;served++;c.phase="served";scanned=0;toast("Ödeme alındı: +₺"+c.value);updateHUD();});addTo(grid,"Ürün okut","Barkod okuyucuda ürünü tara",()=>{if(stock<=0){toast("Stok bitti! Depodan sipariş ver.");return}stock--;scanned++;toast("Bip! Ürün okutuldu · "+scanned+" ürün");updateHUD()});addTo(grid,"Fişi yazdır","Müşteriye fiş hazırla",()=>toast("Fiş yazdırıldı."));}
if(item.kind==="shelf"||item.kind==="fridge"){addTo(grid,"Rafları düzenle","Ürünleri öne çek ve sergile",()=>{rep=Math.min(100,rep+2);toast("Raflar düzenlendi. Memnuniyet arttı.");updateHUD()});addTo(grid,"Etiketleri yenile","Fiyat etiketlerini kontrol et",()=>toast("Fiyat etiketleri güncellendi."));}
if(item.kind==="prep"){addTo(grid,"Tost hazırla","Sıcak ve çıtır tost · ₺55",()=>{if(stock<1){toast("Malzeme stoğu yetersiz.");return}stock--;scanned++;toast("Tost hazırlandı. Kasada okutabilirsin.");updateHUD()});addTo(grid,"Sandviç hazırla","Günlük sandviç · ₺45",()=>{if(stock<1){toast("Malzeme stoğu yetersiz.");return}stock--;scanned++;toast("Sandviç hazırlandı.");updateHUD()});}
if(item.kind==="stock"){addTo(grid,"Temel ürün kolisi","12 adet ürün · ₺120",()=>{if(money<120){toast("Yeterli paran yok.");return}money-=120;stock+=12;toast("Stok teslim alındı: +12 adet");updateHUD()});addTo(grid,"İçecek kolisi","12 adet içecek · ₺90",()=>{if(money<90){toast("Yeterli paran yok.");return}money-=90;stock+=12;toast("İçecekler depoya eklendi.");updateHUD()});}
}
function addTo(grid,title,desc,fn){const b=document.createElement("button");b.className="action";b.innerHTML=`<b>${title}</b><small>${desc}</small>`;b.onclick=fn;grid.appendChild(b)}
document.getElementById("closePanel").onclick=closePanel;
function closePanel(){activePanel=false;document.getElementById("interactionPanel").classList.add("hidden");if(started&&!paused)renderer.domElement.requestPointerLock()}
document.getElementById("startBtn").onclick=()=>{started=true;document.getElementById("startScreen").classList.add("hidden");renderer.domElement.requestPointerLock();toast("Kantin açıldı. İlk müşterini bekle!")};
document.getElementById("resumeBtn").onclick=()=>{paused=false;document.getElementById("pauseScreen").classList.add("hidden");renderer.domElement.requestPointerLock()};
function toast(t){const el=document.getElementById("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2200)}
function updateHUD(){document.getElementById("money").textContent="₺"+money.toLocaleString("tr-TR");document.getElementById("revenue").textContent="₺"+revenue.toLocaleString("tr-TR");document.getElementById("rep").textContent=rep+"%";document.getElementById("queueCount").textContent=customers.filter(c=>c.phase==="waiting").length;document.getElementById("stockCount").textContent=stock+" adet";document.getElementById("satisfaction").textContent=rep+"%";document.getElementById("goalProgress").style.width=Math.min(100,revenue/500*100)+"%";document.getElementById("goalText").textContent="Günlük hedef: ₺500 · "+Math.min(100,Math.round(revenue/500*100))+"%";document.getElementById("objective").textContent=served?"Müşterilerine hızlı hizmet ver":"İlk müşterini karşıla"}
function tickClock(dt){dayMinutes+=dt*1.6;if(dayMinutes>1080)dayMinutes=480;const h=Math.floor(dayMinutes/60),m=Math.floor(dayMinutes%60);document.getElementById("clock").textContent=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")}
let last=performance.now(),spawnElapsed=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;if(started&&!paused){move(dt);updateCustomers(dt);spawnElapsed+=dt;if(spawnElapsed>12&&customers.length<3){spawnElapsed=0;spawnCustomer()}tickClock(dt);checkTarget()}renderer.render(scene,camera)}
requestAnimationFrame(animate);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.45))});
updateHUD();
