(async()=>{
const $=s=>document.querySelector(s);
let LG='ar';try{LG=localStorage.wmLang==='en'?'en':'ar'}catch(_){}
const AR=LG==='ar';
document.documentElement.lang=LG;document.documentElement.dir=AR?'rtl':'ltr';
const TX={ar:{roll:'ارمِ النرد',att:'مهاجم',def:'مدافع',pts:'نقاط',tie:'تعادل! ارمِ مرة أخرى',round:'الجولة',next:'الجولة التالية',mw:'الأكثر انتصارات',terr:'المساحة · كم²',resume:'متابعة اللعبة',newg:'لعبة جديدة',home:'الرئيسية',menu:'القائمة',close:'إغلاق',pause:'القائمة',nw:'لا انتصارات بعد'},
en:{roll:'Roll the dice',att:'Attacker',def:'Defender',pts:'Points',tie:'Tie! Roll again',round:'Round',next:'Next round',mw:'Most wins',terr:'Territory · km²',resume:'Continue game',newg:'New game',home:'Home',menu:'Menu',close:'Close',pause:'Menu',nw:'No wins yet'}};
const t=k=>TX[LG][k];
const takes=(w,l)=>AR?`${w} تأخذ ${l}`:`${w} takes ${l}`;
const overT=n=>AR?`🏆 ${n} تحكم العالم`:`🏆 ${n} rules the world`;
const st=$('#stage');
const [D0,T]=await Promise.all([fetch('data.json').then(r=>r.json()),fetch('world50.json').then(r=>r.json())]);
const feats=topojson.feature(T,T.objects.countries).features;
const fById={};feats.forEach(f=>{fById[String(f.id).padStart(3,'0')]=f});
const C=D0.filter(c=>fById[c.n]);const by={};C.forEach(c=>by[c.id]=c);const ids=C.map(c=>c.id);
const nm=id=>AR?by[id].ar:by[id].en;
const flag=id=>'flags/'+by[id].a+'.svg';
/* main polygon per country (for camera) */
const mainF={};
ids.forEach(id=>{const g=fById[by[id].n].geometry;let polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;let best=null,ba=-1;polys.forEach(pc=>{const a=d3.geoArea({type:'Polygon',coordinates:pc});if(a>ba){ba=a;best=pc}});mainF[id]={type:'Feature',geometry:{type:'Polygon',coordinates:best}}});
/* adjacency */
const adj={};ids.forEach(i=>adj[i]=new Set());
C.forEach(c=>(c.nb||[]).forEach(n=>{if(by[n]){adj[c.id].add(n);adj[n].add(c.id)}}));
const dist=(a,b)=>d3.geoDistance(by[a].ct,by[b].ct);
const land=ids.filter(i=>adj[i].size>0);
ids.filter(i=>adj[i].size===0).forEach(i=>{const near=land.filter(x=>x!==i).sort((a,b)=>dist(i,a)-dist(i,b)).slice(0,2);near.forEach(n=>{adj[i].add(n);adj[n].add(i)});const isl=ids.filter(x=>x!==i&&!land.includes(x)).sort((a,b)=>dist(i,a)-dist(i,b))[0];if(isl){adj[i].add(isl);adj[isl].add(i)}});
(function connect(){for(let g=0;g<60;g++){const seen=new Set(),comps=[];ids.forEach(s=>{if(seen.has(s))return;const q=[s],comp=[];seen.add(s);while(q.length){const x=q.pop();comp.push(x);adj[x].forEach(y=>{if(!seen.has(y)){seen.add(y);q.push(y)}})}comps.push(comp)});if(comps.length<2)return;comps.sort((a,b)=>a.length-b.length);const sm=comps[0],set=new Set(sm);let bd=9,bp=null;sm.forEach(a=>ids.forEach(b=>{if(!set.has(b)){const d=dist(a,b);if(d<bd){bd=d;bp=[a,b]}}}));adj[bp[0]].add(bp[1]);adj[bp[1]].add(bp[0])}})();
/* state */
let owner={},wins={},round=1,inRound=0,speed=1;
const SV='wmClash';
const newState=()=>{owner={};wins={};ids.forEach(i=>{owner[i]=i;wins[i]=0});round=1;inRound=0};
const save=()=>{try{localStorage[SV]=JSON.stringify({v:1,owner,wins,round,inRound})}catch(_){}};
const load=()=>{try{const s=JSON.parse(localStorage[SV]||'null');if(s&&s.v===1&&s.owner&&ids.every(i=>s.owner[i])){owner=s.owner;wins=s.wins||{};ids.forEach(i=>{if(wins[i]==null)wins[i]=0});round=s.round||1;inRound=s.inRound||0;return true}}catch(_){}return false};
const clearSave=()=>{try{localStorage.removeItem(SV)}catch(_){}};
/* svg */
let W=0,H=0,proj,path;
const svg=d3.select(st).append('svg');
const defs=svg.append('defs');
ids.forEach(i=>{const a=by[i].a;if(defs.select('#f-'+a).empty()){const p=defs.append('pattern').attr('id','f-'+a).attr('width',1).attr('height',1).attr('patternContentUnits','objectBoundingBox');p.append('image').attr('href','flags/'+a+'.svg').attr('width',1).attr('height',1).attr('preserveAspectRatio','none')}});
const z=svg.append('g').attr('id','z');
const cs=z.append('g').attr('id','cs');
const paths={};
ids.forEach(i=>{paths[i]=cs.append('path').attr('class','cn').datum(i)});
function fit(){W=st.clientWidth;H=st.clientHeight;svg.attr('viewBox',`0 0 ${W} ${H}`);proj=d3.geoEqualEarth().fitExtent([[4,H*.1],[W-4,H*.9]],{type:'Sphere'});path=d3.geoPath(proj);ids.forEach(i=>paths[i].attr('d',path(fById[by[i].n])))}
const paint=i=>paths[i].attr('fill','url(#f-'+by[owner[i]].a+')');
/* camera */
let cur=null;const tf=v=>{const k=W/v[2];return `translate(${W/2-v[0]*k},${H/2-v[1]*k}) scale(${k})`};
const worldV=up=>up?[W/2,H/2+0.2*H*1.2,W*1.2]:[W/2,H/2,W];
function setView(v,ms){z.interrupt();if(!cur||ms<=0){cur=v;z.attr('transform',tf(v));return Promise.resolve()}const from=cur;return new Promise(res=>{z.transition().duration(ms).ease(d3.easeCubicInOut).attrTween('transform',()=>{const ip=d3.interpolateZoom(from,v);return tt=>{const s=ip(tt);cur=s;return tf(s)}}).on('end interrupt',()=>{cur=v;res()})})}
function pairView(c,d){const b1=path.bounds(mainF[c]),b2=path.bounds(mainF[d]);const x0=Math.min(b1[0][0],b2[0][0]),y0=Math.min(b1[0][1],b2[0][1]),x1=Math.max(b1[1][0],b2[1][0]),y1=Math.max(b1[1][1],b2[1][1]);const bw=x1-x0,bh=y1-y0;let w=Math.max(bw*1.8,bh*W/(0.5*H),W/14);w=Math.min(w,W);return [(x0+x1)/2,(y0+y1)/2-0.09*H*w/W,w]}
/* UI */
st.insertAdjacentHTML('beforeend',`
<div class="top"><button class="menu" id="mnb">☰</button><div class="cards" id="cds"><div class="card A"><img id="ai"><div style="min-width:0"><div class="r">${t('att')}</div><b id="an"></b></div><span class="m" dir="ltr">×1.1</span></div><div class="card Dd"><img id="di"><div style="min-width:0"><div class="r">${t('def')}</div><b id="dn"></b></div><span class="m" dir="ltr">×1.0</span></div></div></div>
<div class="dice" id="dc"><div class="side"><div class="pts" id="ap"><small>${t('pts')}</small><b>0</b></div><div class="dcol" id="ad"></div></div><div class="side"><div class="dcol" id="dd"></div><div class="pts" id="dp"><small>${t('pts')}</small><b>0</b></div></div></div>
<div class="toast" id="ts"></div>
<div class="bar"><button class="spd" id="sp">⏩ 1×</button><button class="roll pulse" id="rl" disabled>🎲 ${t('roll')}</button><div class="chip" id="inf"></div></div>
<div class="rd" id="rd"></div>
<div class="mn" id="mn"><div id="mnc"></div></div>`);
const pipsAt={0:[],1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function mkDice(el){el.innerHTML='';const a=[];for(let i=0;i<3;i++){const d=document.createElement('div');d.className='die';for(let j=0;j<9;j++){const p=document.createElement('i');d.appendChild(p)}el.appendChild(d);a.push(d)}return a}
const dA=mkDice($('#ad')),dD=mkDice($('#dd'));
function face(d,v){[...d.children].forEach((p,j)=>p.classList.toggle('p',pipsAt[v].includes(j)))}
const faceAll=(arr,vs)=>arr.forEach((d,i)=>face(d,vs[i]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms/speed));
const rnd=n=>Math.floor(Math.random()*n);
const info=()=>{$('#inf').textContent=`${t('round')} ${round} · ${Math.min(inRound+1,5)}/5`};
function toast(s,ms){const e=$('#ts');e.textContent=s;e.classList.add('on');return sleep(ms).then(()=>e.classList.remove('on'))}
function tween(el,to,ms){const from=0,t0=performance.now();return new Promise(r=>{const f=now=>{const p=Math.min(1,(now-t0)/(ms/speed));el.textContent=(to*p).toFixed(1).replace(/\.0$/,'');if(p<1)requestAnimationFrame(f);else{el.textContent=String(+to.toFixed(1));r()}};requestAnimationFrame(f)})}
/* standings */
const terr=root=>ids.reduce((s,i)=>s+(owner[i]===root?by[i].area:0),0);
const fmtA=v=>v>=1e6?(v/1e6).toFixed(1)+'M':Math.round(v/1e3)+'K';
function standings(){const roots=[...new Set(ids.map(i=>owner[i]))];const tl=roots.map(r=>[r,terr(r)]).sort((a,b)=>b[1]-a[1]).slice(0,5);const wl=ids.filter(i=>wins[i]>0).sort((a,b)=>wins[b]-wins[a]).slice(0,3);
const li=(r,v)=>`<div class="li"><img src="${flag(r)}"><span>${nm(r)}</span><em>${v}</em></div>`;
$('#rd').innerHTML=`<h2>${t('round')} ${round}</h2><div class="row"><div class="col"><h3>${t('mw')}</h3>${wl.length?wl.map(r=>li(r,wins[r])).join(''):'<div class="li"><span>'+t('nw')+'</span></div>'}</div><div class="col"><h3>${t('terr')}</h3>${tl.map(([r,v])=>li(r,fmtA(v))).join('')}</div></div><button class="nx" id="nxt">${t('next')} ›</button>`}
/* flow */
let rollRes=null;
const waitRoll=()=>new Promise(r=>{rollRes=r;$('#rl').disabled=false});
$('#rl').onclick=()=>{if(rollRes){const r=rollRes;rollRes=null;$('#rl').disabled=true;r()}};
$('#sp').onclick=()=>{speed=speed===1?2:speed===2?4:1;$('#sp').textContent='⏩ '+speed+'×'};
function pick(){const ps=[];ids.forEach(c=>adj[c].forEach(d=>{if(owner[c]!==owner[d])ps.push([c,d])}));if(!ps.length)return null;const ae=[...new Set(ps.map(p=>owner[p[0]]))];const A=ae[rnd(ae.length)];const f=ps.filter(p=>owner[p[0]]===A);return f[rnd(f.length)]}
function mark(A,B){cs.classed('dim',!!A);ids.forEach(i=>{const a=A&&owner[i]===A,d=B&&owner[i]===B;paths[i].classed('a',!!a).classed('d',!!d).classed('hl',!!(a||d));if(a||d)paths[i].raise()})}
async function rollDice(){
  const av=[0,0,0].map(()=>1+rnd(6)),dv=[0,0,0].map(()=>1+rnd(6));
  [...dA,...dD].forEach(d=>d.classList.add('rl'));
  const iv=setInterval(()=>{faceAll(dA,[1+rnd(6),1+rnd(6),1+rnd(6)]);faceAll(dD,[1+rnd(6),1+rnd(6),1+rnd(6)])},90);
  await sleep(1000);clearInterval(iv);
  [...dA,...dD].forEach(d=>d.classList.remove('rl'));faceAll(dA,av);faceAll(dD,dv);
  const pa=+((av[0]+av[1]+av[2])*1.1).toFixed(1),pd=dv[0]+dv[1]+dv[2];
  await Promise.all([tween($('#ap b'),pa,600),tween($('#dp b'),pd,600)]);
  return {pa,pd};
}
async function battle(c,d){
  const A=owner[c],B=owner[d];
  mark(A,B);
  $('#ai').src=flag(A);$('#an').textContent=nm(A);$('#di').src=flag(B);$('#dn').textContent=nm(B);
  $('#cds').classList.add('on');
  faceAll(dA,[0,0,0]);faceAll(dD,[0,0,0]);$('#ap b').textContent='0';$('#dp b').textContent='0';$('#ap').className='pts';$('#dp').className='pts';
  info();
  await setView(pairView(c,d),1500/speed);
  $('#dc').classList.add('on');
  let res;
  for(;;){await waitRoll();res=await rollDice();if(res.pa!==res.pd)break;await toast(t('tie'),1300)}
  const aw=res.pa>res.pd,W_=aw?A:B,L=aw?B:A;
  $('#ap').classList.add(aw?'win':'lose');$('#dp').classList.add(aw?'lose':'win');
  wins[W_]++;
  const moved=ids.filter(i=>owner[i]===L);moved.forEach(i=>owner[i]=W_);
  moved.forEach(i=>{paint(i);paths[i].classed('fl',false);void paths[i].node().getBoundingClientRect();paths[i].classed('fl',true)});
  mark(W_,null);
  await toast(takes(nm(W_),nm(L)),1800);
  moved.forEach(i=>paths[i].classed('fl',false));
  save();await sleep(500);
}
async function roundEnd(){
  mark(null,null);$('#cds').classList.remove('on');$('#dc').classList.remove('on');$('#rl').style.visibility='hidden';
  await setView(worldV(true),1500/speed);
  standings();$('#rd').classList.add('on');
  await new Promise(r=>{$('#nxt').onclick=r});
  $('#rd').classList.remove('on');$('#rl').style.visibility='';
  round++;inRound=0;save();
}
async function over(){
  mark(null,null);$('#cds').classList.remove('on');$('#dc').classList.remove('on');
  await setView(worldV(),1500/speed);
  const root=owner[ids[0]];
  menu(overT(nm(root)),false);
}
let running=false;
async function loop(){
  if(running)return;running=true;
  $('#ld')&&$('#ld').remove();
  for(;;){
    const p=pick();if(!p){await over();break}
    await battle(p[0],p[1]);
    inRound++;
    if(inRound>=5){const left=new Set(ids.map(i=>owner[i])).size;if(left<=1){continue}await roundEnd()}
  }
  running=false;
}
/* menu */
function menu(title,canClose){
  const m=$('#mn'),c=$('#mnc');
  c.innerHTML=`<h2>${title}</h2>${canClose?`<button class="pr" id="m1">${t('close')}</button>`:''}<button id="m2" ${canClose?'':'class="pr"'}>${t('newg')}</button><button id="m3">${t('home')}</button>`;
  m.classList.add('on');
  if(canClose)$('#m1').onclick=()=>m.classList.remove('on');
  $('#m2').onclick=()=>{clearSave();location.reload()};
  $('#m3').onclick=()=>{location.href='./'};
}
$('#mnb').onclick=()=>menu(t('menu'),true);
/* boot */
fit();
const had=load();
if(!had)newState();
ids.forEach(paint);
setView(worldV(),0);
info();
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{fit();setView(cur&&mode()?cur:worldV(),0)},200)});
const mode=()=>true;
if(had&&(round>1||inRound>0||Object.values(wins).some(x=>x>0))){
  $('#ld').remove();
  const m=$('#mn'),c=$('#mnc');
  c.innerHTML=`<h2>${t('round')} ${round}</h2><button class="pr" id="m1">${t('resume')}</button><button id="m2">${t('newg')}</button><button id="m3">${t('home')}</button>`;
  m.classList.add('on');
  $('#m1').onclick=()=>{m.classList.remove('on');loop()};
  $('#m2').onclick=()=>{clearSave();location.reload()};
  $('#m3').onclick=()=>{location.href='./'};
}else{loop()}
window.__clash={owner:()=>owner,ids,adj,by,pick};
})();
