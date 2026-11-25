import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const viewport=document.querySelector('#viewport');
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x5c94fc); scene.fog=new THREE.Fog(0x5c94fc,28,75);
const camera=new THREE.OrthographicCamera(-10,10,6,-6,.1,150); camera.position.set(0,8,32); camera.lookAt(0,3,0);
const renderer=new THREE.WebGLRenderer({antialias:false, powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; viewport.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdceeff,0x5b7139,2.0)); const sun=new THREE.DirectionalLight(0xfff2cc,2.2); sun.position.set(-8,18,15); sun.castShadow=true; scene.add(sun);
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness,flatShading:true});
const mats={grass:mat(0x65bd39),dirt:mat(0x9b5528),brick:mat(0xb85b2b),brickDark:mat(0x71391f),gold:mat(0xffb82e),used:mat(0x80604a),red:mat(0xd83c35),cream:mat(0xffe2a3),skin:mat(0xf0b77b),blue:mat(0x3455a5),black:mat(0x211d2c),white:mat(0xffffff),green:mat(0x50a947),hill:mat(0x48b94c)};
const boxGeo=new THREE.BoxGeometry(1,1,1);
function cube(parent,x,y,z,sx,sy,sz,material,shadow=true){const m=new THREE.Mesh(boxGeo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m}
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}
const world=group(scene); const platforms=[],questions=[],enemies=[],coins=[]; let score=0,coinCount=0,remaining=300,playing=false,paused=true,won=false,lives=3;
const scoreEl=document.querySelector('#score'),coinsEl=document.querySelector('#coins'),timeEl=document.querySelector('#time'),toast=document.querySelector('#toast');
const quiz=[
 {q:'Apa arti kata كِتَابٌ (kitābun)?',a:['Buku','Rumah','Pintu','Sekolah'],c:0,e:'كِتَابٌ berarti buku.'},
 {q:'Manakah bahasa Arab dari “guru laki-laki”?',a:['طَالِبٌ','مُدَرِّسٌ','مَدْرَسَةٌ','قَلَمٌ'],c:1,e:'مُدَرِّسٌ berarti guru laki-laki.'},
 {q:'Lengkapi kalimat: هٰذَا ... جَدِيْدٌ (Ini ... baru)',a:['سَيَّارَةٌ','مَدْرَسَةٌ','كِتَابٌ','حَقِيْبَةٌ'],c:2,e:'كِتَابٌ tepat karena هٰذَا digunakan untuk kata benda mudzakkar.'},
 {q:'Apa bentuk jamak dari طَالِبٌ (siswa laki-laki)?',a:['طُلَّابٌ','طَالِبَةٌ','مَكْتَبٌ','مُعَلِّمٌ'],c:0,e:'طُلَّابٌ merupakan bentuk jamak taksir dari طَالِبٌ.'},
 {q:'Pilih susunan yang benar untuk “Saya pergi ke sekolah”.',a:['أَنَا فِي الْبَيْتِ','أَذْهَبُ إِلَى الْمَدْرَسَةِ','هٰذَا قَلَمٌ','هُوَ مُدَرِّسٌ'],c:1,e:'أَذْهَبُ إِلَى الْمَدْرَسَةِ berarti saya pergi ke sekolah.'}
];
function makeBlock(x,y,material=mats.brick){const g=group(world,x,y,0);cube(g,0,0,0,1,.95,1,material);cube(g,0,.25,.515,.94,.08,.035,mats.brickDark,false);cube(g,-.22,-.18,.515,.05,.35,.035,mats.brickDark,false);cube(g,.25,-.28,.515,.05,.22,.035,mats.brickDark,false);return g}
// sky decoration: layered low-poly clouds and rolling hills
for(let i=0;i<9;i++){const x=-8+i*10;const h=new THREE.Mesh(new THREE.SphereGeometry(3.2,8,5),mats.hill);h.scale.set(1.8,.48,.25);h.position.set(x,-1.2,-8);scene.add(h);}
for(let i=0;i<12;i++){const x=-13+i*5.2,y=7+(i%3)*1.2;const c=group(scene,x,y,-9);cube(c,0,0,0,2.3,.65,.35,mats.white,false);cube(c,-.65,.32,0,1.05,.65,.35,mats.white,false);cube(c,.35,.32,0,1.2,.85,.35,mats.white,false);}
// ground split into safe stretches with pits
const groundSegments=[[-1,12],[17,14],[35,16],[55,18],[77,22]];
for(const [x,w] of groundSegments){cube(world,x,-.65,0,w,1.3,2,mats.dirt);cube(world,x,.04,0,w,.22,2,mats.grass);for(let bx=x-w/2+.5;bx<x+w/2;bx+=1){if(Math.random()>.38){cube(world,bx,-.55,1.02,.92,.09,.04,mats.brickDark,false)}}}
// raised platforms
const platDefs=[[5,2.5,3],[8,2.5,3],[11,2.5,3],[21,3.5,3],[24,4.5,3],[27,5.5,3],[40,3,3],[43,3,3],[46,3,3],[61,4,3],[64,5,3],[67,6,3],[84,3.5,3],[87,3.5,3]];
for(const [x,y] of platDefs){platforms.push({x,y,w:1,top:y+.48});makeBlock(x,y)}
// exactly five mystery blocks, mixed into route
const qDefs=[[3,3.4],[14,2.5],[29,6.8],[50,3.7],[72,5.4]];
qDefs.forEach(([x,y],i)=>{const g=group(world,x,y,0);cube(g,0,0,0,1.05,1.05,1.05,mats.gold);cube(g,-.38,.38,.55,.13,.13,.06,mats.black,false);cube(g,.38,.38,.55,.13,.13,.06,mats.black,false);cube(g,-.38,-.38,.55,.13,.13,.06,mats.black,false);cube(g,.38,-.38,.55,.13,.13,.06,mats.black,false);const q=new THREE.Mesh(new THREE.BoxGeometry(.3,.4,.08),mats.cream);q.position.set(0,0,.57);g.add(q);questions.push({g,x,y,index:i,done:false,used:false});});
// coins floating along route
for(const [x,y] of [[1,2],[6,4],[9,4],[19,2],[23,5],[31,3],[38,2],[44,4],[53,3],[63,6],[69,3],[80,2]]){const c=new THREE.Mesh(new THREE.TorusGeometry(.25,.09,5,8),mats.gold);c.position.set(x,y,1.1);c.rotation.y=Math.PI/2;world.add(c);coins.push({mesh:c,taken:false,baseY:y});}
// player voxel adventurer
const player=group(world,-7,1.1,1);const body=group(player);cube(body,0,.15,0,.62,.68,.5,mats.blue);cube(body,0,.62,0,.64,.23,.55,mats.red);cube(body,0,.91,0,.7,.18,.58,mats.red);cube(body,0,1.2,0,.5,.48,.48,mats.skin);cube(body,0,1.49,0,.72,.17,.55,mats.red);cube(body,-.1,1.68,0,.48,.18,.5,mats.red);cube(body,.14,1.25,.26,.08,.1,.04,mats.black,false);cube(body,-.13,1.25,.26,.08,.1,.04,mats.black,false);cube(body,0,-.34,.04,.25,.32,.32,mats.black);cube(body,.34,-.34,.04,.25,.32,.32,mats.black);
const playerState={vx:0,vy:0,onGround:false,invuln:0,spawnX:-7};
// patrolling mushroom creatures
function makeEnemy(x,y){const g=group(world,x,y,1);cube(g,0,.15,0,.95,.6,.6,mat(0x986039));cube(g,0,.52,0,1.05,.35,.65,mat(0x70442d));cube(g,-.23,.55,.35,.22,.2,.08,mats.black,false);cube(g,.23,.55,.35,.22,.2,.08,mats.black,false);cube(g,0,.83,0,.8,.25,.65,mat(0x6f3b29));cube(g,-.28,-.2,.12,.24,.2,.3,mats.black);cube(g,.28,-.2,.12,.24,.2,.3,mats.black);enemies.push({g,x,min:x-3,max:x+3,vx:1.15,alive:true,squash:0,baseY:y});}
makeEnemy(12,.4);makeEnemy(25,4.1);makeEnemy(37,.4);makeEnemy(46,3.6);makeEnemy(65,4.1);makeEnemy(82,.4);
// goal castle and pole
const castle=group(world,96,.2,0);cube(castle,0,1.6,-.3,4,3.2,2,mats.cream);cube(castle,0,3.5,-.3,4.6,.5,2.3,mats.brick);cube(castle,-1.1,4,-.3,1,.6,2,mats.brick);cube(castle,1.1,4,-.3,1,.6,2,mats.brick);cube(castle,0,.65,.82,.8,1.3,.1,mats.dirt);const pole=cube(world,92,5,1, .18,10,.18,mats.cream);const flag=group(world,92.8,9.2,1);cube(flag,.4,0,0,.9,.6,.12,mats.green);
// platform collision tops incl ground sections
const solids=[...groundSegments.map(([x,w])=>({x,w,top:.14})),...platforms.map(p=>({x:p.x,w:1,top:p.top}))];
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);const aspect=w/h;const viewH=12;camera.left=-viewH*aspect/2;camera.right=viewH*aspect/2;camera.top=viewH/2;camera.bottom=-viewH/2;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();
const keys={};window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code))e.preventDefault();keys[e.code]=true;if((e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')&&!e.repeat)jump();});window.addEventListener('keyup',e=>keys[e.code]=false);
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;if(k==='Space')jump();});['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));});
function jump(){if(playing&&!paused&&playerState.onGround){playerState.vy=8.4;playerState.onGround=false;}}
function updateHUD(){scoreEl.textContent=String(score).padStart(5,'0');coinsEl.textContent=String(coinCount).padStart(2,'0');timeEl.textContent=String(Math.max(0,Math.floor(remaining))).padStart(3,'0');}
let toastTimer;function showToast(t){toast.textContent=t;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1700)}
let currentQ=null;const quizModal=document.querySelector('#quiz-modal');
function openQuiz(q){paused=true;currentQ=q;document.querySelector('#question-count').textContent=`${q.index+1} / 5`;document.querySelector('#question-text').textContent=q.q;const wrap=document.querySelector('#answers');wrap.innerHTML='';document.querySelector('#feedback').textContent='';document.querySelector('#continue-btn').classList.add('hidden');q.a.forEach((a,i)=>{const b=document.createElement('button');b.className='answer';b.textContent=`${'ABCD'[i]}. ${a}`;b.onclick=()=>answer(i,b);wrap.appendChild(b)});quizModal.classList.remove('hidden');}
function answer(i,btn){const q=currentQ;const all=[...document.querySelectorAll('.answer')];all.forEach(b=>b.disabled=true);if(i===q.c){btn.classList.add('correct');q.done=true;q.used=true;score+=1000;coinCount++;updateHUD();document.querySelector('#feedback').textContent=`BENAR! ${q.e} +1000 POIN`;document.querySelector('#continue-btn').classList.remove('hidden');showToast('MUMTAZ! +1000 SCORE');}else{btn.classList.add('wrong');all[q.c].classList.add('correct');document.querySelector('#feedback').textContent=`Belum tepat. ${q.e} Coba blok ini lagi!`;setTimeout(()=>{quizModal.classList.add('hidden');q.used=false;q.g.children[0].material=mats.gold;paused=false;},2200);}}
document.querySelector('#continue-btn').onclick=()=>{quizModal.classList.add('hidden');paused=false;};
function reset(){score=0;coinCount=0;remaining=300;won=false;lives=3;player.position.set(-7,1.1,1);playerState.vx=0;playerState.vy=0;playerState.invuln=0;questions.forEach(q=>{q.done=false;q.used=false;q.g.children[0].material=mats.gold;q.g.visible=true});coins.forEach(c=>{c.taken=false;c.mesh.visible=true});enemies.forEach(e=>{e.alive=true;e.g.visible=true;e.g.position.x=e.x;e.g.scale.y=1});updateHUD();}
function loseLife(){if(playerState.invuln>0)return;lives--;playerState.invuln=1.8;playerState.vy=4.5;playerState.vx=-3;score=Math.max(0,score-200);updateHUD();showToast(`OUCH! ${lives} NYAWA TERSISA`);if(lives<=0){playing=false;paused=true;document.querySelector('#gameover-modal').classList.remove('hidden');}}
function hitQuestion(q){if(q.done||q.used)return;q.used=true;q.g.children[0].material=mats.used;openQuiz(quiz[q.index]);}
let last=performance.now(),elapsed=0;
function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.033);last=now;elapsed+=dt;if(playing&&!paused){remaining-=dt;if(remaining<=0){remaining=0;playing=false;paused=true;document.querySelector('#gameover-modal').classList.remove('hidden');}const left=keys.ArrowLeft||keys.KeyA,right=keys.ArrowRight||keys.KeyD;const target=(right?1:0)-(left?1:0);playerState.vx=THREE.MathUtils.damp(playerState.vx,target*5.5,12,dt);player.position.x+=playerState.vx*dt;player.position.x=THREE.MathUtils.clamp(player.position.x,-9,99);playerState.vy-=19*dt;const oldY=player.position.y;player.position.y+=playerState.vy*dt;playerState.onGround=false;
 // landing collision
 const px=player.position.x,py=player.position.y;for(const s of solids){if(Math.abs(px-s.x)<s.w/2+.28&&playerState.vy<=0&&oldY-.25>=s.top-.02&&py-.25<=s.top){player.position.y=s.top+.28;playerState.vy=0;playerState.onGround=true;}}
 // question blocks: head bumps underside
 for(const q of questions){if(!q.done&&!q.used&&Math.abs(px-q.x)<.75&&playerState.vy>0&&oldY+1.65<q.y-.35&&py+1.65>=q.y-.35){player.position.y=q.y-2.05;playerState.vy=-1.5;hitQuestion(q);break;}}
 // coin pickup
 for(const c of coins){c.mesh.rotation.y+=dt*2.5;c.mesh.position.y=c.baseY+Math.sin(elapsed*3+c.baseY)*.12;if(!c.taken&&Math.abs(px-c.mesh.position.x)<.65&&Math.abs(py+.7-c.mesh.position.y)<1){c.taken=true;c.mesh.visible=false;coinCount++;score+=100;updateHUD();}}
 // enemies patrol and collision
 for(const e of enemies){if(!e.alive)continue;e.g.position.x+=e.vx*dt;if(e.g.position.x<e.min||e.g.position.x>e.max)e.vx*=-1;if(Math.abs(px-e.g.position.x)<.75&&Math.abs(py-e.g.position.y)<1.25){if(playerState.vy<0&&py>e.g.position.y+.45){e.alive=false;e.g.visible=false;playerState.vy=6;score+=300;updateHUD();showToast('+300 MONSTER STOMP!');}else loseLife();}}
 if(playerState.invuln>0){playerState.invuln-=dt;player.visible=Math.floor(elapsed*12)%2===0;}else player.visible=true;
 if(player.position.y< -4){loseLife();player.position.set(Math.max(-7,px-2),2,1);playerState.vy=0;}
 if(px>90&&questions.every(q=>q.done)&&py>1.2){playing=false;paused=true;document.querySelector('#final-score').textContent=String(score).padStart(5,'0');document.querySelector('#final-coins').textContent=String(coinCount).padStart(2,'0');document.querySelector('#win-modal').classList.remove('hidden');}
 player.rotation.z=THREE.MathUtils.damp(player.rotation.z,-playerState.vx*.025,8,dt);body.position.y=playerState.onGround?Math.sin(elapsed*15)*Math.min(.04,Math.abs(playerState.vx)*.008):0;camera.position.x=THREE.MathUtils.damp(camera.position.x,player.position.x,3,dt);camera.lookAt(camera.position.x,3,0);updateHUD();}
 renderer.render(scene,camera);}
requestAnimationFrame(loop);
function start(){reset();document.querySelector('#start-modal').classList.add('hidden');document.querySelector('#gameover-modal').classList.add('hidden');document.querySelector('#win-modal').classList.add('hidden');playing=true;paused=false;}
document.querySelector('#start-btn').onclick=start;document.querySelector('#restart-btn').onclick=start;document.querySelector('#retry-btn').onclick=start;
