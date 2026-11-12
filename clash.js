(async()=>{
const $=s=>document.querySelector(s);
let LG='ar';try{LG=localStorage.wmLang==='en'?'en':'ar'}catch(_){}
const AR=LG==='ar';
document.documentElement.lang=LG;document.documentElement.dir=AR?'rtl':'ltr';
const TX={ar:{roll:'ارمِ النرد',att:'مهاجم',def:'مدافع',pts:'نقاط',tie:'تعادل! ارمِ مرة أخرى',round:'الجولة',next:'الجولة التالية',mw:'الأكثر انتصارات',terr:'المساحة · كم²',resume:'متابعة اللعبة',newg:'لعبة جديدة',home:'الرئيسية',menu:'القائمة',close:'إغلاق',pause:'القائمة',nw:'لا انتصارات بعد',winner:'فائز',loser:'خاسر',loot:'غنائم الجولة',winners:'الفائزون · المساحة النهائية',reset:'إعادة الدول إلى أصلها',rq:'هل تريد إعادة كل الدول إلى أصلها؟ سيُمسح التقدم الحالي.',yes:'تأكيد',no:'إلغاء',M:'مليون',K:'ألف',skip:'لا جيران'},
en:{roll:'Roll the dice',att:'Attacker',def:'Defender',pts:'Points',tie:'Tie! Roll again',round:'Round',next:'Next round',mw:'Most wins',terr:'Territory · km²',resume:'Continue game',newg:'New game',home:'Home',menu:'Menu',close:'Close',pause:'Menu',nw:'No wins yet',winner:'Winner',loser:'Loser',loot:'Round spoils',winners:'Winners · final area',reset:'Reset countries to original',rq:'Reset all countries to their original state? Current progress will be erased.',yes:'Confirm',no:'Cancel',M:'M',K:'K',skip:'No neighbours'}};
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
/* state */
let owner={},wins={},round=1,inRound=0,speed=1,log=[];
const SV='wmClash';
const newState=()=>{owner={};wins={};ids.forEach(i=>{owner[i]=i;wins[i]=0});round=1;inRound=0;log=[]};
const save=()=>{try{localStorage[SV]=JSON.stringify({v:1,owner,wins,round,inRound,log})}catch(_){}};
const load=()=>{try{const s=JSON.parse(localStorage[SV]||'null');if(s&&s.v===1&&s.owner&&ids.every(i=>s.owner[i])){owner=s.owner;wins=s.wins||{};ids.forEach(i=>{if(wins[i]==null)wins[i]=0});round=s.round||1;inRound=s.inRound||0;log=s.log||[];return true}}catch(_){}return false};
const clearSave=()=>{try{localStorage.removeItem(SV)}catch(_){}};
/* svg */
let W=0,H=0,proj,path;
const svg=d3.select(st).append('svg');
const defs=svg.append('defs');
const z=svg.append('g').attr('id','z');
const grat=z.append('path').attr('class','grat');
const landF=topojson.feature(T,T.objects.land);
const rip=[0,1,2].map(i=>z.append('path').attr('class','rip r'+i));
const cs=z.append('g').attr('id','cs');
const radG=z.append('g').attr('class','rad');
const paths={};
ids.forEach(i=>{paths[i]=cs.append('path').attr('class','cn').datum(i)});
function fit(){W=st.clientWidth;H=st.clientHeight;svg.attr('viewBox',`0 0 ${W} ${H}`);proj=d3.geoEqualEarth().fitExtent([[4,H*.1],[W-4,H*.9]],{type:'Sphere'});path=d3.geoPath(proj);grat.attr('d',path(d3.geoGraticule().step([30,30])()));rip.forEach(r=>r.attr('d',path(landF)));defs.selectAll('*').remove();ids.forEach(i=>{paths[i].attr('d',path(fById[by[i].n]));const bb=path.bounds(mainF[i]),w=Math.max(1,bb[1][0]-bb[0][0]),h=Math.max(1,bb[1][1]-bb[0][1]);const p=defs.append('pattern').attr('id','p-'+i).attr('patternUnits','userSpaceOnUse').attr('x',bb[0][0]).attr('y',bb[0][1]).attr('width',w).attr('height',h);p.append('image').attr('id','pi-'+i).attr('x',0).attr('y',0).attr('width',w).attr('height',h).attr('preserveAspectRatio','none');paths[i].attr('fill','url(#p-'+i+')')})}
const paint=i=>{const e=svg.select('#pi-'+i);if(!e.empty())e.attr('href',flag(owner[i]))};
/* camera */
let cur=null;const tf=v=>{const k=W/v[2];return `translate(${W/2-v[0]*k},${H/2-v[1]*k}) scale(${k})`};
const worldV=up=>up?[W/2,H/2+0.2*H*1.2,W*1.2]:[W/2,H/2,W];
function setView(v,ms){z.interrupt();if(!cur||ms<=0){cur=v;z.attr('transform',tf(v));return Promise.resolve()}const from=cur;return new Promise(res=>{z.transition().duration(ms).ease(d3.easeCubicInOut).attrTween('transform',()=>{const ip=d3.interpolateZoom(from,v);return tt=>{const s=ip(tt);cur=s;return tf(s)}}).on('end interrupt',()=>{cur=v;res()})})}
const polysOf=id=>{const g=fById[by[id].n].geometry;return g.type==='Polygon'?[g.coordinates]:g.coordinates};
const ccache={};
function contact(c,d){const key=c+'|'+d;if(ccache[key]&&ccache[key].W===W)return ccache[key];
  const pc=polysOf(c),pd=polysOf(d);
  const pts=ps=>{const o=[];ps.forEach((pg,k)=>pg[0].forEach(p=>o.push([p[0],p[1],k])));return o};
  const A=pts(pc),B=pts(pd);
  const bb=a=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;a.forEach(p=>{if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1]});return[x0,x1,y0,y1]};
  const near=(a,b,m)=>{const q=bb(b);return a.filter(p=>p[0]>=q[0]-m&&p[0]<=q[1]+m&&p[1]>=q[2]-m&&p[1]<=q[3]+m)};
  const thin=a=>{const s=Math.ceil(a.length/1600);return s>1?a.filter((_,i)=>i%s===0):a};
  let A2=near(A,B,1.5),B2=near(B,A,1.5);
  if(!A2.length||!B2.length){A2=A;B2=B}
  A2=thin(A2);B2=thin(B2);
  let bd=1e18,pa=null,pn=null;
  A2.forEach(p1=>{const cs_=Math.cos(p1[1]*Math.PI/180);B2.forEach(p2=>{const dx=(p1[0]-p2[0])*cs_,dy=p1[1]-p2[1],dd=dx*dx+dy*dy;if(dd<bd){bd=dd;pa=p1;pn=p2}})});
  const q=proj([(pa[0]+pn[0])/2,(pa[1]+pn[1])/2]);
  return ccache[key]={W,q,ia:pa[2],ib:pn[2],pc,pd}}
function pairView(c,d){const k=contact(c,d);const b1=path.bounds({type:'Polygon',coordinates:k.pc[k.ia]}),b2=path.bounds({type:'Polygon',coordinates:k.pd[k.ib]});const x0=Math.min(b1[0][0],b2[0][0]),y0=Math.min(b1[0][1],b2[0][1]),x1=Math.max(b1[1][0],b2[1][0]),y1=Math.max(b1[1][1],b2[1][1]);const bw=x1-x0,bh=y1-y0;let w=Math.max(bw*1.8,bh*W/(0.5*H),W/14);w=Math.min(w,W);return [(x0+x1)/2,(y0+y1)/2-0.09*H*w/W,w]}
/* radar: neighbours of the attacker as targets */
function radarView(reps){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const add=(x,y)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)};
  reps.forEach(r=>{const b=path.bounds(mainF[r.c]);add(b[0][0],b[0][1]);add(b[1][0],b[1][1]);add(r.k.q[0],r.k.q[1])});
  const pd=0.3*Math.max(x1-x0,y1-y0);x0-=pd;x1+=pd;y0-=pd;y1+=pd;const bw=x1-x0,bh=y1-y0;
  let w=Math.min(W,Math.max(bw,bh*W/(0.56*H),W/9));return [(x0+x1)/2,(y0+y1)/2-0.1*H*w/W,w]}
function drawRadar(reps,k){radG.html('').style('opacity',1);const L=px=>px/k;
  reps.forEach(r=>{const g=radG.append('g').attr('data-r',r.root);
    const dd=path(fById[by[r.d].n]);g.append('path').attr('class','tgc').attr('d',dd);g.append('path').attr('class','tg').attr('d',dd);
    const o=path.centroid(mainF[r.c]),q=r.k.q,dx=q[0]-o[0],dy=q[1]-o[1],len=Math.hypot(dx,dy)||1,mx=(o[0]+q[0])/2-dy*0.16,my=(o[1]+q[1])/2+dx*0.16;
    const qd=`M${o[0]},${o[1]}Q${mx},${my} ${q[0]},${q[1]}`;g.append('path').attr('class','arc').attr('d',qd);g.append('path').attr('class','ar').attr('d',qd);
    const tx=q[0]-mx,ty=q[1]-my,tl=Math.hypot(tx,ty)||1,ux=tx/tl,uy=ty/tl,hs=L(13),hw=L(7);
    g.append('path').attr('class','ah').attr('d',`M${q[0]},${q[1]}L${q[0]-ux*hs-uy*hw},${q[1]-uy*hs+ux*hw}L${q[0]-ux*hs+uy*hw},${q[1]-uy*hs-ux*hw}Z`);
    g.append('circle').attr('class','ah').attr('cx',o[0]).attr('cy',o[1]).attr('r',L(4))});}
function radarOn(root){radG.selectAll('g').classed('sc',function(){return this.getAttribute('data-r')===String(root)});radG.selectAll('g.sc').raise();
  document.querySelectorAll('#rdr .chip2').forEach(e=>e.classList.toggle('on',e.dataset.r===String(root)||(e.dataset.r==='more'&&root===-9)))}
function radarChips(reps){const MAXC=8,sh=reps.slice(0,MAXC),rest=reps.length-sh.length;
  $('#rdr').innerHTML=sh.map(r=>`<div class="chip2 off" data-r="${r.root}"><img src="${flag(r.root)}"><span>${nm(r.root)}</span><em>${fmtA(terr(r.root))}</em></div>`).join('')+(rest>0?`<div class="chip2 off" data-r="more">+${rest}</div>`:'');
  $('#rdr').classList.add('on')}
function radarOff(){$('#rdr').classList.remove('on');radG.transition().duration(450).style('opacity',0).on('end',()=>radG.html(''))}
/* UI */
st.insertAdjacentHTML('beforeend',`
<div class="top"><button class="menu" id="mnb">☰</button><div class="cards" id="cds"><div class="card A"><img id="ai"><div style="min-width:0"><div class="r">${t('att')}</div><b id="an"></b></div><span class="m" dir="ltr">×1.1</span></div><div class="card Dd"><img id="di"><div style="min-width:0"><div class="r">${t('def')}</div><b id="dn"></b></div><span class="m" dir="ltr">×1.0</span></div></div></div>
<div class="dice" id="dc"><div class="side"><div class="pts" id="ap"><small>${t('pts')}</small><b>0</b></div><div class="dcol" id="ad"></div></div><div class="side"><div class="dcol" id="dd"></div><div class="pts" id="dp"><small>${t('pts')}</small><b>0</b></div></div></div>
<div class="rdr" id="rdr"></div>
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
const terr=root=>ids.reduce((x,i)=>x+(owner[i]===root?by[i].area:0),0);
const fmtA=v=>v<1e3?String(Math.max(1,Math.round(v))):v>=1e6?(v/1e6).toFixed(1)+' '+t('M'):Math.round(v/1e3)+' '+t('K');
function standings(){
  const li=(r,v)=>`<div class="li"><img src="${flag(r)}"><span>${nm(r)}</span><em>${v}</em></div>`;
  const loot=log.map(e=>`<div class="li lt"><b class="ic">${e.side==='a'?'⚔️':'🛡️'}</b><img src="${flag(e.w)}"><span>${nm(e.w)}</span><i>${AR?'←':'→'}</i><img src="${flag(e.l)}"><span>${nm(e.l)}</span><em>${fmtA(e.area)}</em></div>`).join('');
  const roots=[...new Set(log.map(e=>owner[e.w]))].map(r=>[r,terr(r)]).sort((a,b)=>b[1]-a[1]);
  $('#rd').innerHTML=`<h2>${t('round')} ${round}</h2><div class="row"><div class="col wide"><h3>${t('loot')} · ${t('terr').split('·')[1].trim()}</h3>${loot}</div><div class="col"><h3>${t('winners')}</h3>${roots.map(([r,v])=>li(r,fmtA(v))).join('')}</div></div><button class="nx" id="nxt">${t('next')} ›</button><button class="rs" id="rst">↺ ${t('reset')}</button>`;
  $('#rst').onclick=confirmReset;
}
/* flow */
let rollRes=null;
const waitRoll=()=>new Promise(r=>{rollRes=r;$('#rl').disabled=false});
$('#rl').onclick=()=>{if(rollRes){const r=rollRes;rollRes=null;$('#rl').disabled=true;r()}};
$('#sp').onclick=()=>{speed=speed===1?2:speed===2?4:1;$('#sp').textContent='⏩ '+speed+'×'};
const pairsFor=A=>{const ps=[];ids.forEach(c=>{if(owner[c]!==A)return;adj[c].forEach(d=>{if(owner[d]!==A)ps.push([c,d])})});return ps};
const anyPairs=()=>ids.some(c=>[...adj[c]].some(d=>owner[d]!==owner[c]));
function mark(A,B){cs.classed('dim',!!A);ids.forEach(i=>{const a=A&&owner[i]===A,d=B&&owner[i]===B;paths[i].classed('a',!!a).classed('d',!!d).classed('hl',!!(a||d));if(a||d)paths[i].raise()})}
const cardSet=(side,r,label)=>{const card=$(side==='A'?'.card.A':'.card.Dd');const img=$(side==='A'?'#ai':'#di'),nmE=$(side==='A'?'#an':'#dn');if(r==null){card.classList.add('empty');nmE.textContent='—';img.removeAttribute('src')}else{card.classList.remove('empty');img.src=flag(r);nmE.textContent=nm(r)}if(label)card.querySelector('.r').textContent=label};
async function shuffleCard(side,list,final,ds,cb){
  let prev=-1;for(let k=0;k<ds.length;k++){let r;if(k===ds.length-1)r=final;else{do{r=list[rnd(list.length)]}while(list.length>1&&r===prev)}prev=r;cardSet(side,r);cb&&cb(r);await sleep(ds[k])}
}
async function chooseBattle(){
  const first=!$('#cds').classList.contains('on');
  for(let tries=0;tries<40;tries++){
    if(!anyPairs())return null;
    const roots=[...new Set(ids.map(i=>owner[i]))];
    const A=roots[rnd(roots.length)];const ps=pairsFor(A);
    cardSet('D',null);
    $('#cds').classList.add('on');
    await shuffleCard('A',roots,A,[140,140,140,160,190,230,300,400,560]);
    if(!ps.length){await sleep(1100);cardSet('A',null);await sleep(300);continue}
    return {A,ps}
  }
  return null;
}
async function rollDice(){
  const av=[0,0,0].map(()=>1+rnd(6)),dv=[0,0,0].map(()=>1+rnd(6));
  [...dA,...dD].forEach(d=>d.classList.add('rl'));
  const iv=setInterval(()=>{faceAll(dA,[1+rnd(6),1+rnd(6),1+rnd(6)]);faceAll(dD,[1+rnd(6),1+rnd(6),1+rnd(6)])},90);
  await sleep(1800);
  let sa=0,sd=0;
  for(let i=0;i<3;i++){
    face(dA[i],av[i]);face(dD[i],dv[i]);dA[i].classList.remove('rl');dD[i].classList.remove('rl');
    sa+=av[i];sd+=dv[i];$('#ap b').textContent=String(+(sa*1.1).toFixed(1));$('#dp b').textContent=String(sd);
    // keep other dice shaking until their turn
    if(i===2)clearInterval(iv);else{clearInterval(iv);const rest=[...dA.slice(i+1),...dD.slice(i+1)];const rem=rest;const iv2=setInterval(()=>{dA.slice(i+1).forEach(d=>face(d,1+rnd(6)));dD.slice(i+1).forEach(d=>face(d,1+rnd(6)))},90);await sleep(850);clearInterval(iv2)}
  }
  return {pa:+(sa*1.1).toFixed(1),pd:sd};
}
async function battle(){
  mark(null,null);
  $('#dc').classList.remove('on');$('#cds').classList.remove('mx');
  ['A','D'].forEach(x=>{const c=$(x==='A'?'.card.A':'.card.Dd');c.classList.remove('win','lose')});
  $('.card.A .r').textContent=t('att');$('.card.Dd .r').textContent=t('def');
  faceAll(dA,[0,0,0]);faceAll(dD,[0,0,0]);$('#ap b').textContent='0';$('#dp b').textContent='0';$('#ap').className='pts';$('#dp').className='pts';
  info();
  await setView(worldV(),900/speed);
  const ch=await chooseBattle();if(!ch)return false;
  const {A,ps}=ch;
  const pr=ps[rnd(ps.length)];const c=pr[0],d=pr[1],B=owner[d];
  // radar: one representative border pair per neighbouring empire
  const reps=[];const byRoot=new Map();
  ps.forEach(p=>{const r=owner[p[1]];if(r===B){return}const dist=d3.geoDistance(by[p[0]].ct,by[p[1]].ct);const o=byRoot.get(r);if(!o||dist<o.dist)byRoot.set(r,{root:r,c:p[0],d:p[1],dist})});
  byRoot.forEach(v=>reps.push(v));reps.push({root:B,c,d});
  reps.forEach(r=>{r.k=contact(r.c,r.d)});
  reps.sort((a,b)=>a.root===B?1:b.root===B?-1:a.dist-b.dist);
  const vA=radarView(reps);
  const dive=setView(vA,3000/speed);
  await sleep(600);
  mark(A,null);
  const cand=reps.map(r=>r.root);
  await dive;
  drawRadar(reps,W/vA[2]);radarChips(reps);
  const hidden=new Set(reps.slice(8).map(r=>r.root));
  await shuffleCard('D',cand,B,[520,520,560,620,780,1100],r=>radarOn(hidden.has(r)?-9:r));
  radarOn(B);await sleep(500);
  mark(A,B);
  radarOff();
  await setView(pairView(c,d),2200/speed);
  $('#cds').classList.add('mx');
  await sleep(700);
  $('#dc').classList.add('on');
  let res;
  for(;;){await waitRoll();res=await rollDice();if(res.pa!==res.pd)break;await toast(t('tie'),1500);faceAll(dA,[0,0,0]);faceAll(dD,[0,0,0]);$('#ap b').textContent='0';$('#dp b').textContent='0'}
  const aw=res.pa>res.pd,W_=aw?A:B,L=aw?B:A;
  $('#ap').classList.add(aw?'win':'lose');$('#dp').classList.add(aw?'lose':'win');
  const cA=$('.card.A'),cD=$('.card.Dd');
  (aw?cA:cD).classList.add('win');(aw?cD:cA).classList.add('lose');
  (aw?cA:cD).querySelector('.r').textContent=t('winner');(aw?cD:cA).querySelector('.r').textContent=t('loser');
  await sleep(900);
  wins[W_]++;
  const gained=terr(L);
  const moved=ids.filter(i=>owner[i]===L);moved.forEach(i=>owner[i]=W_);
  log.push({w:W_,l:L,side:aw?'a':'d',area:gained});
  const anc=by[aw?d:c].ct;
  moved.sort((a,b)=>d3.geoDistance(by[a].ct,anc)-d3.geoDistance(by[b].ct,anc));
  const n=moved.length,tt=toast(takes(nm(W_),nm(L)),3600);
  moved.forEach((i,k)=>setTimeout(()=>{paint(i);paths[i].classed('fl',false);void paths[i].node().getBoundingClientRect();paths[i].classed('fl',true)},(n>1?k/(n-1):0)*2400/speed));
  await tt;
  moved.forEach(i=>paths[i].classed('fl',false));
  save();
  // zoom out to the world and hold
  mark(null,null);$('#dc').classList.remove('on');
  await setView(worldV(),2600/speed);
  $('#cds').classList.remove('on');
  await sleep(3500);
  return true;
}
async function roundEnd(){
  mark(null,null);$('#cds').classList.remove('on');$('#dc').classList.remove('on');$('#rl').style.visibility='hidden';
  await setView(worldV(true),1800/speed);
  standings();$('#rd').classList.add('on');
  await new Promise(r=>{$('#nxt').onclick=r});
  $('#rd').classList.remove('on');$('#rl').style.visibility='';
  round++;inRound=0;log=[];save();
}
async function over(){
  mark(null,null);$('#cds').classList.remove('on');$('#dc').classList.remove('on');
  await setView(worldV(),1500/speed);
  const rs=[...new Set(ids.map(i=>owner[i]))].sort((a,b)=>terr(b)-terr(a));
  menu(AR?`انتهت المعارك — الأكبر: ${nm(rs[0])}`:`Battles over — largest: ${nm(rs[0])}`,false);
}
let running=false;
async function loop(){
  if(running)return;running=true;
  $('#ld')&&$('#ld').remove();
  for(;;){
    const ok=await battle();
    if(!ok){if(log.length){await roundEnd()}await over();break}
    inRound++;
    if(inRound>=5){await roundEnd()}
  }
  running=false;
}
/* menu */
function dlg(title,btns){const m=$('#mn'),c=$('#mnc');c.innerHTML=`<h2>${title}</h2>`+btns.map((b,i)=>`<button id="mb${i}" ${b.pr?'class="pr"':''}>${b.t}</button>`).join('');m.classList.add('on');btns.forEach((b,i)=>$('#mb'+i).onclick=b.f)}
function confirmReset(){dlg(t('rq'),[{t:t('yes'),pr:true,f:()=>{clearSave();location.reload()}},{t:t('no'),f:()=>$('#mn').classList.remove('on')}])}
function menu(title,canClose){
  const bt=[];
  if(canClose)bt.push({t:t('close'),pr:true,f:()=>$('#mn').classList.remove('on')});
  bt.push({t:t('reset'),pr:!canClose,f:confirmReset});
  bt.push({t:t('home'),f:()=>{location.href='./'}});
  dlg(title,bt);
}
$('#mnb').onclick=()=>menu(t('menu'),true);
/* boot */
fit();
const had=load();
if(!had)newState();
ids.forEach(paint);
setView(worldV(),0);
info();
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{fit();ids.forEach(paint);setView(cur&&mode()?cur:worldV(),0)},200)});
const mode=()=>true;
if(had&&(round>1||inRound>0||log.length||Object.values(wins).some(x=>x>0))){
  $('#ld').remove();
  dlg(`${t('round')} ${round}`,[{t:t('resume'),pr:true,f:()=>{$('#mn').classList.remove('on');loop()}},{t:t('reset'),f:confirmReset},{t:t('home'),f:()=>{location.href='./'}}]);
}else{loop()}

})();
