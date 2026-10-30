(async()=>{
const $=s=>document.querySelector(s),A=$('#app'),W=900,H=560,rad=Math.PI/180,deg=180/Math.PI;
const [D,T,T5,T1]=await Promise.all([fetch('data.json').then(r=>r.json()),fetch('world.json').then(r=>r.json()),fetch('world50.json').then(r=>r.json()),fetch('world110.json').then(r=>r.json())]);
/* ---------- map data: Natural Earth 1:10m (detail) + 1:50m (settled world views) + 1:110m (light copy while dragging) ---------- */
const all=topojson.feature(T,T.objects.countries).features,nbs=topojson.neighbors(T.objects.countries.geometries);
const keyOf=f=>f.id!=null?f.id:'n:'+f.properties.name;
const LM={},MM={};topojson.feature(T1,T1.objects.countries).features.forEach(f=>{LM[keyOf(f)]=f});topojson.feature(T5,T5.objects.countries).features.forEach(f=>{if(f.properties.p)MM[keyOf(f)]=f});
all.forEach(f=>{f.pri=f.id!=null&&!!f.properties.p;const u=f.id==null||f.pri;f.lite=u?(LM[keyOf(f)]||null):null;f.mid=u?(MM[keyOf(f)]||null):null});
/* random graph colouring: neighbours never share a colour; new arrangement on every call */
function recolor(){const n=all.length,col=new Array(n).fill(-1);
 [...Array(n).keys()].map(i=>[nbs[i].length+Math.random()*4,i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{const u=new Set(nbs[i].map(j=>col[j])),av=[0,1,2,3,4,5,6].filter(k=>!u.has(k));col[i]=av.length?av[Math.floor(Math.random()*av.length)]:Math.floor(Math.random()*7)});
 all.forEach((f,i)=>f.col=col[i])}
recolor();
const byN={};all.forEach(f=>{if(f.pri)byN[f.id]=f});
const F=all;
const byId={},byNc={};
D.forEach(c=>{byId[c.id]=c;byNc[c.n]=c;if(!c.cur.length)c.cur=[{k:'USD',ar:'دولار أمريكي'}];c.f=byN[c.n];
 if(c.f){const g=c.f.geometry,cs=g.type==='Polygon'?[g.coordinates]:g.coordinates;c.keepF={type:'Feature',geometry:{type:'GeometryCollection',geometries:c.kp.map(i=>({type:'Polygon',coordinates:cs[i]}))}}}});
const MK=D.filter(c=>c.mk&&c.f),SMALL=new Set(['VAT','MCO','NRU','MDV','SMR','LIE','SYC','KNA','MHL','MLT','GRD','VCT','TUV']);
const CN={AF:'أفريقيا',AS:'آسيا',EU:'أوروبا',NA:'أمريكا الشمالية',SA:'أمريكا الجنوبية',OC:'أوقيانوسيا'};
const MODES=[['en','الدولة بالإنجليزية','🌍'],['ar','الدولة بالعربية','🗺️'],['shape','شكل الخريطة','🔷'],['cap','عاصمة الدولة','🏛️'],['flag','علم الدولة','🏳️'],['cur','عملة الدولة','💰'],['tap','حدّد الدولة على الخريطة','📍']];
let S=Object.assign({time:20,count:10,conts:Object.keys(CN)},JSON.parse(localStorage.wm||'{}'));
const save=()=>localStorage.wm=JSON.stringify(S);
/* ---------- text matching ---------- */
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ًͯ-ٰٟ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]/gu,'').replace(/^the(?=.{4})/,'').replace(/^ال(?=.{3})/,'');
const AL={cz:'Czech Republic',sz:'Swaziland',mm:'Burma',mk:'Macedonia',tl:'East Timor',tr:'Turkiye',ci:'Ivory Coast',cg:'Congo Republic',cd:'DR Congo,DRC',us:'USA,America',gb:'UK,Britain',ae:'UAE',va:'Vatican',kr:'South Korea',kp:'North Korea',cv:'Cape Verde',ps:'Palestinian Territories'};
const acc=c=>c._a||(c._a=new Set([c.en,c.ar,...c.alt,...(AL[c.a]||'').split(',')].filter(Boolean).flatMap(x=>{const n=norm(x);return n.startsWith('saint')?[n,'st'+n.slice(5)]:[n]})));
function lev(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;const m=a.length,n=b.length,d=[];for(let i=0;i<=m;i++){d[i]=[i];}for(let j=1;j<=n;j++)d[0][j]=j;
 for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)}return d[m][n]}
const tol=n=>n<=4?0:n<=8?1:2;
function fuzzy(c,raw){const v=norm(raw);if(v.length<5)return false;const t=tol(v.length);let dc=9;
 for(const x of acc(c))if(x.length>=4)dc=Math.min(dc,lev(v,x,t));if(dc>t)return false;
 for(const o of D){if(o===c)continue;for(const x of acc(o))if(x.length>=4&&lev(v,x,dc)<=dc)return false}return true}
const strip=s=>s.split(' ')[0],shuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
const flag=(c,cl='')=>`<img class="${cl}" src="flags/${c.a}.svg" alt="">`;
function pick(pool,n,w){const r=[],p=[...pool];while(r.length<n&&p.length){let x=Math.random()*p.reduce((s,c)=>s+w(c),0),i=0;for(;i<p.length-1;i++){x-=w(p[i]);if(x<0)break}r.push(p.splice(i,1)[0])}return r}
/* ---------- maps ---------- */
const MINR=18,GR=d3.geoGraticule10(),GL0=[-40,-25];
function projFor(c,kind,W=900,H=560){const p=d3.geoEqualEarth();
 if(kind==='world')return p.fitExtent([[6,6],[W-6,H-6]],{type:'Sphere'});
 p.rotate([-c.ct[0],0]);
 if(kind==='shape')return p.fitExtent([[18,18],[W-18,H-18]],c.keepF);
 let R=Math.max(3.5,c.rr*1.45);if(c.sr<2e-4)R=Math.max(R,7);R=Math.min(R,120);
 p.fitExtent([[24,24],[W-24,H-24]],{type:'FeatureCollection',features:[c.keepF,{type:'Feature',geometry:d3.geoCircle().center(c.ct).radius(R)()}]});p._R=R;return p}
/* is feature f within R degrees of country c? (cheap bounding-box test, keeps thumbnails fast) */
function near(c,f,R){const b=f.gb||(f.gb=d3.geoBounds(f.mid||f)),w=b[0][0],s=b[0][1],e=b[1][0],n=b[1][1],x=c.ct[0],y=c.ct[1];if(w>e)return true;
 let lx=x;if(x<w||x>e){const dw=Math.abs(((x-w+540)%360)-180),de=Math.abs(((x-e+540)%360)-180);lx=dw<de?w:e}
 return d3.geoDistance(c.ct,[lx,Math.max(s,Math.min(n,y))])*deg<=R+3}
function staticSvg(c,kind,minR=MINR){const p=projFor(c,kind).clipExtent([[0,0],[W,H]]),g=d3.geoPath(p);
 if(kind==='shape')return`<svg viewBox="0 0 ${W} ${H}" class="map shp"><path class="t2" d="${g(c.keepF)}"/></svg>`;
 const R=p._R||60;let s='',t='';const co=[];
 F.forEach(f=>{const tg=f.pri&&f.id===c.n;if(!tg&&!near(c,f,R))return;const d=g(f);if(!d)return;co.push(d);if(tg)t=`<path class="l t" d="${d}"/>`;else s+=`<path class="l c${f.col%7}" d="${d}"/>`});
 return`<svg viewBox="0 0 ${W} ${H}" class="map"><path class="grat" d="${g(GR)}"/><path class="coast" d="${co.join('')}"/><g class="land">${s}${t}</g>${minR&&c.mk?`<path class="ring" d="${g(c.f)}"/>`:''}</svg>`}
const thumbs={};const thumb=c=>thumbs[c.id]||(thumbs[c.id]=c.f?(SMALL.has(c.id)?staticSvg(c,'ctx',30):staticSvg(c,'shape',0)):flag(c));
function mkMap(host,o){recolor();
 const W=Math.max(200,host.clientWidth||900),H=Math.max(200,host.clientHeight||560),gR=Math.min(W,H)/2*.94;
 let mode=o.kind==='world'?(S.flat?'flat':'globe'):'ctx',tr=d3.zoomIdentity,p0,s0,t0,r0,gv={r:GL0.slice(),k:1},anim=0,lastC=o.c||null;const selSet=new Map();
 host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" class="map live${mode==='globe'?' globe':''}"><defs><radialGradient id="sph" cx="38%" cy="34%" r="75%"><stop offset="0" stop-color="#e4f3fc"/><stop offset=".7" stop-color="#b9dcf1"/><stop offset="1" stop-color="#8fc0de"/></radialGradient></defs><g class="z"><path class="sphere"></path><path class="grat"></path><path class="coast"></path><g class="land"></g><g class="mhs"></g><g class="mks"></g><g class="mrs"></g><g class="rg"></g></g></svg>`;
 const svg=d3.select(host.querySelector('svg')),gz=svg.select('g.z'),land=gz.select('g.land'),el=svg.node();
 const paths=land.selectAll('path').data(F).join('path').attr('class',f=>'l c'+(f.col%7)).attr('data-n',f=>f.pri?f.id:null);
 function base(){p0=mode==='ctx'?projFor(o.c,'ctx',W,H):projFor(null,'world',W,H);s0=p0.scale();t0=p0.translate();r0=p0.rotate();tr=d3.zoomIdentity}
 const kNow=()=>mode==='globe'?gv.k:tr.k;
 const proj=()=>mode==='globe'?d3.geoOrthographic().rotate([gv.r[0],gv.r[1],0]).scale(gR*gv.k).translate([W/2,H/2]).clipAngle(90).clipExtent([[-40,-40],[W+40,H+40]])
  :d3.geoEqualEarth().rotate(r0).scale(s0*tr.k).translate([t0[0]*tr.k+tr.x,t0[1]*tr.k+tr.y]).clipExtent([[-40,-40],[W+40,H+40]]);
 const mcls=d=>'mk'+(d.c.sr<2e-6?' thin':'')+(selSet.has(d.c.n)?' '+selSet.get(d.c.n):'');
 function render(lite){const p=proj(),g=d3.geoPath(p),ds=[];
  gz.select('.sphere').attr('d',mode==='globe'?g({type:'Sphere'}):null);gz.select('.grat').attr('d',g(GR));
  const mid=lite==='mid'||(!lite&&mode!=='ctx'&&kNow()<2.5);
  paths.attr('d',f=>{const l=f.mid||f.lite;let d;
   if(lite===true)d=f.lite?g(f.lite):null;
   else if(mid)d=f.mid?g(f.mid):null;
   else{if(l){const b=g.bounds(l);if(!isFinite(b[0][0])||b[1][0]<-40||b[0][0]>W+40||b[1][1]<-40||b[0][1]>H+40)return null}d=g(f)}
   if(d)ds.push(d);return d||null});
  gz.select('.coast').attr('d',mode==='globe'?null:ds.join(''));
  /* outlines around small countries / archipelagos: hug the real shapes, never circles */
  const hs=[];if(o.marks&&lite!==true&&lite!=='mid'&&kNow()>=2.2)MK.forEach(c=>{const d=g(c.f);if(!d)return;const b=g.bounds(c.f);hs.push({c,d,sz:Math.max(b[1][0]-b[0][0],b[1][1]-b[0][1]),cx:(b[0][0]+b[1][0])/2,cy:(b[0][1]+b[1][1])/2})});
  hs.sort((a,b)=>b.sz-a.sz);
  gz.select('.mhs').selectAll('path').data(hs).join('path').attr('d',d=>d.d).attr('data-n',d=>d.c.n).style('stroke-width',d=>(d.sz<34?30:12)+'px');
  gz.select('.mks').selectAll('path').data(hs).join('path').attr('class',mcls).attr('d',d=>d.d);
  gz.select('.mrs').selectAll('circle').data(hs.filter(d=>d.sz<10)).join('circle').attr('class',mcls).attr('cx',d=>d.cx).attr('cy',d=>d.cy).attr('r',13);
  const rg=o.ring&&o.c&&o.c.mk&&lite!==true&&lite!=='mid'?[g(o.c.f)].filter(Boolean):[];
  gz.select('.rg').selectAll('path').data(rg).join('path').attr('class','ring').attr('d',d=>d)}
 /* ---- flat / context maps: d3 zoom with exact re-render on gesture end ---- */
 const zoom=d3.zoom().scaleExtent([1,5000]).translateExtent([[-W,-H],[2*W,2*H]])
  .on('zoom',e=>{const t=e.transform,r=t.k/tr.k;gz.attr('transform',`translate(${t.x-tr.x*r},${t.y-tr.y*r}) scale(${r})`)})
  .on('end',e=>{const t=e.transform;if(t.k===tr.k&&t.x===tr.x&&t.y===tr.y)return;tr=t;gz.attr('transform',null);render()});
 const useZoom=()=>svg.call(zoom).on('dblclick.zoom',null);
 function pickAt(t){const m=t&&t.closest&&t.closest('.mhs path');let c=m&&byNc[m.getAttribute('data-n')];
  if(!c){const l=t&&t.closest&&t.closest('path.l'),n=l&&l.getAttribute('data-n');c=n&&byNc[n]}if(c&&o.pick)o.pick(c)}
 svg.on('click',ev=>{if(mode!=='globe')pickAt(ev.target)});
 /* ---- 3D globe: drag to rotate (with inertia), pinch / wheel / buttons to zoom, tap to pick ---- */
 const stopAnim=()=>{if(anim)cancelAnimationFrame(anim);anim=0};
 const rotBy=(dx,dy)=>{const f=deg/(gR*gv.k);gv.r=[gv.r[0]+dx*f,Math.max(-90,Math.min(90,gv.r[1]-dy*f))]};
 const zoomBy=m=>{gv.k=Math.max(1,Math.min(3000,gv.k*m))};
 let raf=0,idle=0;const frame=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;render(true);clearTimeout(idle);idle=setTimeout(()=>render(false),140)})};
 function animTo(r1,k1,dur=900){stopAnim();const ra=gv.r.slice(),ka=gv.k,dl=((r1[0]-ra[0]+540)%360)-180,t=performance.now();
  if(!dur){gv.r=[ra[0]+dl,r1[1]];gv.k=k1;render(false);return}
  const step=now=>{const u=Math.min(1,(now-t)/dur),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;gv.r=[ra[0]+dl*e,ra[1]+(r1[1]-ra[1])*e];gv.k=ka*Math.pow(k1/ka,e);
   if(u<1){render(true);anim=requestAnimationFrame(step)}else{anim=0;render(false)}};anim=requestAnimationFrame(step)}
 const P=new Map();let moved=0,pend=[0,0],v=[0,0],lastE=0,t0e=0;
 el.addEventListener('pointerdown',e=>{if(mode!=='globe')return;try{el.setPointerCapture(e.pointerId)}catch(_){}P.set(e.pointerId,[e.clientX,e.clientY]);stopAnim();clearTimeout(idle);
  if(P.size===1){moved=0;pend=[0,0];v=[0,0];lastE=t0e=e.timeStamp}else moved+=99});
 el.addEventListener('pointermove',e=>{if(mode!=='globe'||!P.has(e.pointerId))return;const pr=P.get(e.pointerId),nx=[e.clientX,e.clientY];
  if(P.size===1){const dx=nx[0]-pr[0],dy=nx[1]-pr[1];moved+=Math.abs(dx)+Math.abs(dy);
   if(moved>6){rotBy(dx+pend[0],dy+pend[1]);pend=[0,0];const dt=Math.max(1,e.timeStamp-lastE);v=[.6*v[0]+.4*dx/dt,.6*v[1]+.4*dy/dt];lastE=e.timeStamp;frame()}else pend=[pend[0]+dx,pend[1]+dy]}
  else if(P.size===2){const q=[...P.entries()].find(([id])=>id!==e.pointerId)[1],d0=Math.hypot(pr[0]-q[0],pr[1]-q[1]),d1=Math.hypot(nx[0]-q[0],nx[1]-q[1]);if(d0>0){zoomBy(d1/d0);frame()}}
  P.set(e.pointerId,nx)});
 const up=e=>{if(mode!=='globe'||!P.has(e.pointerId))return;P.delete(e.pointerId);
  if(P.size>0){v=[0,0];return}
  if(moved<8&&e.type==='pointerup'&&e.timeStamp-t0e<800){pickAt(document.elementFromPoint(e.clientX,e.clientY));return}
  if(Math.hypot(v[0],v[1])>.08&&e.timeStamp-lastE<90){let last=performance.now();
   const step=now=>{const dt=Math.min(40,now-last);last=now;rotBy(v[0]*dt,v[1]*dt);const d=Math.pow(.5,dt/260);v=[v[0]*d,v[1]*d];render(true);
    if(Math.hypot(v[0],v[1])>.02)anim=requestAnimationFrame(step);else{anim=0;render(false)}};anim=requestAnimationFrame(step)}
  else render(false)};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
 el.addEventListener('wheel',e=>{if(mode!=='globe')return;e.preventDefault();stopAnim();zoomBy(Math.exp(-e.deltaY*.0015));frame()},{passive:false});
 /* ---- selection / focus ---- */
 function setSel(n,cls,keep){if(!keep){selSet.clear();paths.classed('sel good bad t',false)}
  if(n!=null){selSet.set(n,cls);paths.filter(f=>f.pri&&f.id===n).classed(cls,true).raise();if(byNc[n])lastC=byNc[n]}
  gz.select('.mks').selectAll('path').attr('class',mcls);gz.select('.mrs').selectAll('circle').attr('class',mcls)}
 function bbox(c){if(c.mk){const q=p0(c.cl[0].ct),s=p0.scale()*Math.max(...c.cl.map(x=>x.rr))*rad+2;return[[q[0]-s,q[1]-s],[q[0]+s,q[1]+s]]}return d3.geoPath(p0).bounds(c.keepF)}
 function focusGlobe(L,dur){let ctr,th;
  if(L.length===1){const c=L[0];ctr=c.ct;th=c.mk?Math.max(c.rr*1.6,.9):Math.max(c.rr*1.25,.5)}
  else{ctr=d3.geoCentroid({type:'GeometryCollection',geometries:L.map(c=>({type:'Point',coordinates:c.ct}))});th=Math.max(...L.map(c=>d3.geoDistance(ctr,c.ct)*deg+c.rr))*1.1}
  th=Math.min(th,85);lastC=L[0];
  animTo([-ctr[0],-ctr[1]],Math.max(1,Math.min(3000,.82*(Math.min(W,H)/2)/Math.sin(th*rad)/gR)),dur)}
 function focus(list,dur=700){const L=[].concat(list).filter(c=>c&&c.f);if(!L.length)return;if(mode==='globe')return focusGlobe(L,dur);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;lastC=L[0];
  L.forEach(c=>{const b=bbox(c);x0=Math.min(x0,b[0][0]);y0=Math.min(y0,b[0][1]);x1=Math.max(x1,b[1][0]);y1=Math.max(y1,b[1][1])});
  if(!isFinite(x0))return;const w=Math.max(x1-x0,1e-3),h=Math.max(y1-y0,1e-3),f=L.length===1&&L[0].mk?.22:.8;
  const k=Math.max(1,Math.min(5000,f*W/w,f*H/h)),T=d3.zoomIdentity.translate(W/2-k*(x0+x1)/2,H/2-k*(y0+y1)/2).scale(k);
  (dur?svg.transition().duration(dur):svg).call(zoom.transform,T)}
 function setMode(m){stopAnim();clearTimeout(idle);mode=m;svg.classed('globe',m==='globe');svg.on('.zoom',null);gz.attr('transform',null);
  if(m==='globe'){gv.k=1;gv.r=lastC&&lastC.ct?[-lastC.ct[0],-lastC.ct[1]]:GL0.slice();render(false)}
  else{useZoom();base();svg.call(zoom.transform,d3.zoomIdentity);render(false);if(m==='flat'&&lastC&&lastC.f&&mode==='flat')focus(lastC,0)}
  api.onmode&&api.onmode(mode)}
 const api={setSel,focus,onmode:null,mode:()=>mode,
  by:f=>mode==='globe'?animTo(gv.r,Math.max(1,Math.min(3000,gv.k*f)),250):svg.transition().duration(250).call(zoom.scaleBy,f),
  reset:()=>mode==='globe'?animTo(GL0,1,600):svg.transition().duration(300).call(zoom.transform,d3.zoomIdentity),
  world(on){setMode(on?(S.flat?'flat':'globe'):'ctx')},
  toggleFlat(){S.flat=mode==='globe';save();setMode(S.flat?'flat':'globe')}};
 if(mode==='globe'){if(lastC&&o.c)gv.r=[-lastC.ct[0],-lastC.ct[1]];render(false)}else{useZoom();base();render('mid');setTimeout(()=>render(false),30)}
 return api}
const mapBox=()=>`<div class="mapbox" id="mb"><div class="svgw"></div><div class="mt"><button id="mz">🌍</button><button id="mf" style="display:none">🗺️</button><button id="zi">＋</button><button id="zo">－</button><button id="zr">⟲</button></div></div>`;
function wireBtns(root,mv,world){const q=s=>root.querySelector(s),mz=q('#mz'),mf=q('#mf');let w=false;
 if(mz){if(world)mz.onclick=()=>{w=!w;mz.textContent=w?'🔍':'🌍';mv.world(w)};else mz.style.display='none'}
 if(mf){mf.onclick=()=>mv.toggleFlat();mv.onmode=m=>{mf.style.display=m==='ctx'?'none':'';mf.textContent=m==='globe'?'🗺️':'🌐';mf.title=m==='globe'?'خريطة مسطحة':'الكرة الأرضية'};mv.onmode(mv.mode())}
 q('#zi').onclick=()=>mv.by(1.7);q('#zo').onclick=()=>mv.by(1/1.7);q('#zr').onclick=()=>mv.reset()}
const LBL={cap:'العاصمة',cur:'العملة'},ansOf=(c,m)=>m==='en'?c.en:m==='ar'?c.ar:m==='cap'?c.cap:m==='cur'?c.cur.map(x=>x.ar).join('، '):c.ar+' — '+c.en;
const FX={};const getFx=c=>(FX[c.co]=FX[c.co]||fetch(`facts/${c.co}.json`).then(r=>r.ok?r.json():{}).catch(()=>({}))).then(d=>d[c.id]);
/* ---------- home ---------- */
let G={};
function home(){clearInterval(G.tm);clearTimeout(G.nx);const chip=(k,v,on)=>`<button data-k="${k}" data-v="${v}" class="${on?'on':''}">${k==='conts'?CN[v]:v+(k==='time'?' ث':'')}</button>`;
 A.innerHTML=`<h1>🌍 لعبة خرائط العالم</h1><div class="home"><aside>
 <h3>⏱️ وقت كل سؤال</h3><div class="chips">${[10,15,20,30,45,60].map(v=>chip('time',v,S.time==v)).join('')}</div>
 <h3>🔢 عدد الأسئلة</h3><div class="chips">${[10,20,30,50,100].map(v=>chip('count',v,S.count==v)).join('')}</div>
 <h3>🧭 القارات</h3><div class="chips">${Object.keys(CN).map(v=>chip('conts',v,S.conts.includes(v))).join('')}</div></aside>
 <div class="main"><details class="how" ${innerWidth>820?'open':''}><summary>طريقة اللعب</summary> اختر الوقت وعدد الأسئلة والقارات من الجانب، ثم اضغط على نوع الأسئلة. أجب قبل انتهاء العداد؛ الكتابة تقبل الأسماء البديلة والإجابة المقاربة (بعد زر تأكيد)، والاختيارات تحتاج زر تأكيد. في «حدّد الدولة» كبّر الخريطة واضغط الدولة ثم تأكيد.</details>
 <div class="modes">${MODES.map(m=>`<button data-m="${m[0]}"><i>${m[2]}</i>${m[1]}</button>`).join('')}<button class="guide" id="wm"><i>🌐</i>خريطة العالم</button><button class="guide" id="gd"><i>📖</i>دليل الدول</button></div></div></div>`;
 A.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{const k=b.dataset.k,v=k==='conts'?b.dataset.v:+b.dataset.v;
  if(k==='conts'){S.conts=S.conts.includes(v)?S.conts.filter(x=>x!==v):[...S.conts,v];if(!S.conts.length)S.conts=[v]}else S[k]=v;save();home()});
 A.querySelectorAll('.modes [data-m]').forEach(b=>b.onclick=()=>start(b.dataset.m));$('#gd').onclick=()=>dir();$('#wm').onclick=explore}
/* ---------- game ---------- */
function start(m){const mp=['en','ar','shape'].includes(m);let pool=D.filter(c=>S.conts.includes(c.co)&&c.f&&!(m==='shape'&&SMALL.has(c.id)));
 G={mode:m,qs:pick(pool,Math.min(S.count,pool.length),mp?c=>Math.min(1,Math.max(.1,Math.sqrt(c.sr)/.02)):()=>1),i:0,score:0,miss:[],log:[]};ask()}
function ask(){clearInterval(G.tm);if(G.i>=G.qs.length)return result();const c=G.c=G.qs[G.i],m=G.mode;G.lock=false;G.sel=null;G.last='';G.pick=null;G.mv=null;
 const inp=(ph,d)=>`<input dir="${d}" placeholder="${ph}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">`;
 let b='';
 if(m==='tap'){G.lang=Math.random()<.5?'ar':'en';b=`<div class="tq"><span>${G.lang==='ar'?'حدّد على الخريطة':'Locate on the map'}</span><b dir="${G.lang==='ar'?'rtl':'ltr'}">${G.lang==='ar'?c.ar:c.en}</b></div>${mapBox()}<div class="in"><button class="go" id="go" disabled>تأكيد</button><button id="sk">تخطي</button></div>`}
 else if(m==='en'||m==='ar'||m==='shape'||m==='flag'){
  b=(m==='flag'?flag(c,'flagbig'):m==='shape'?`<div class="mapbox"><div class="svgw">${staticSvg(c,'shape',0)}</div></div>`:mapBox())+
   `<div class="in">${m==='en'?inp('Country name in English','ltr'):m==='ar'?inp('اسم الدولة بالعربية','rtl'):inp('English','ltr')+inp('عربي','rtl')}<button id="okb" class="okb">تأكيد</button><button id="sk">تخطي</button></div>`}
 else{let o;if(m==='cap'){const t=shuf(D).filter(x=>x.cap&&x.cap!==c.cap);o=[{t:c.cap,ok:1},...[...new Map(t.map(x=>[x.cap,x])).values()].slice(0,5).map(x=>({t:x.cap}))]}
  else{const ok=new Set(c.cur.map(x=>strip(x.ar))),seen=new Set(ok);o=[{t:strip(c.cur[0].ar),ok:1}];shuf(D).forEach(x=>{const t=strip(x.cur[0].ar);if(o.length<6&&!seen.has(t)){seen.add(t);o.push({t})}})}
  G.o=shuf(o);b=`<h1 class="big">${c.ar}</h1><p class="sub">${c.en}</p><div class="opts">${G.o.map((x,i)=>`<button data-i="${i}">${x.t}</button>`).join('')}</div><button class="go" id="go" disabled>تأكيد</button>`}
 A.innerHTML=`<div class="qh"><b>${G.i+1} / ${G.qs.length}</b><button class="x" id="qx">✕</button><span id="tm">${S.time}</span></div><div class="pb"><i id="pb"></i></div><div class="stage">${b}</div>`;
 $('#qx').onclick=()=>confirm('إنهاء اللعبة؟')&&home();
 if(m==='tap'){const mv=G.mv=mkMap($('#mb .svgw'),{kind:'world',marks:true,pick:cc=>{if(G.lock)return;G.pick=cc;mv.setSel(cc.n,'sel');$('#go').disabled=false}});wireBtns(A,mv,false);
  if(S.conts.length<6)mv.focus(D.filter(x=>S.conts.includes(x.co)&&x.f),0)}
 else if($('#mb')){const mv=G.mv=mkMap($('#mb .svgw'),{kind:'ctx',c,ring:true});mv.setSel(c.n,'t');wireBtns(A,mv,true)}
 const chk=()=>{const vs=[...A.querySelectorAll('.in input')].map(e=>e.value).filter(x=>x.trim());if(!vs.length)return;
  const hit=vs.find(v=>acc(c).has(norm(v)));if(hit)return done(true,'',hit);const fz=vs.find(v=>fuzzy(c,v));if(fz)return done(true,'fuzzy',fz);
  A.querySelectorAll('.in input').forEach(e=>{e.classList.remove('shake');void e.offsetWidth;e.classList.add('shake')})};
 A.querySelectorAll('.in input').forEach(e=>{e.oninput=()=>{G.last=e.value;const v=norm(e.value);if(v&&acc(c).has(v))done(true,'',e.value)};e.onkeydown=k=>{if(k.key==='Enter'){e.blur();chk()}}});
 if($('#okb'))$('#okb').onclick=chk;
 if($('#sk'))$('#sk').onclick=()=>done(false,'skip');
 A.querySelectorAll('.opts button').forEach(e=>e.onclick=()=>{if(G.lock)return;A.querySelectorAll('.opts button').forEach(x=>x.classList.remove('sel'));e.classList.add('sel');G.sel=+e.dataset.i;$('#go').disabled=false});
 if($('#go'))$('#go').onclick=()=>{if(m==='tap'){if(G.pick)done(G.pick.id===c.id)}else if(G.sel!=null)done(!!G.o[G.sel].ok)};
 G.end=Date.now()+S.time*1000;G.tm=setInterval(()=>{if(!$('#tm'))return clearInterval(G.tm);const l=Math.max(0,(G.end-Date.now())/1000);$('#tm').textContent=Math.ceil(l);$('#tm').classList.toggle('low',l<=5);$('#pb').style.width=l/S.time*100+'%';if(l<=0)done(false,'time')},100)}
function done(ok,why,typed){if(G.lock)return;G.lock=true;clearInterval(G.tm);const c=G.c,m=G.mode;ok?G.score++:G.miss.push(c);
 const mine=m==='tap'?(G.pick?G.pick.ar:''):G.sel!=null&&G.o?G.o[G.sel].t:(typed||G.last||'');G.log.push({c,ok,mine,why});
 if(G.o)A.querySelectorAll('.opts button').forEach((e,i)=>{if(G.o[i].ok)e.classList.add('good');else if(i===G.sel)e.classList.add('bad')});
 if(m==='tap'&&G.mv){if(!ok&&G.pick)G.mv.setSel(G.pick.n,'bad');G.mv.setSel(c.n,'good',!ok&&!!G.pick);G.mv.focus(c,600)}
 const d=document.createElement('div');d.className='fb '+(ok?'ok':'no')+(m==='tap'?' sheet':'');
 d.innerHTML=`<div class="card"><div class="st">${ok?(why==='fuzzy'?'✅ إجابة مقبولة':'✅ إجابة صحيحة'):why==='time'?'⏰ انتهى الوقت':why==='skip'?'⏭️ تم التخطي':'❌ إجابة خاطئة'}</div>${flag(c)}<div class="nm">${c.ar}</div><div class="nm2" dir="ltr">${c.en}</div>${LBL[m]?`<div class="an">${LBL[m]} الصحيحة: <b>${ansOf(c,m)}</b></div>`:''}${why==='fuzzy'?`<div class="my" style="color:#9a6700">قُبلت إجابتك «${typed}» رغم اختلاف بسيط عن الاسم الصحيح</div>`:''}${!ok&&mine?`<div class="my">${m==='tap'?'اخترت':'إجابتك'}: ${mine}</div>`:''}<small>اضغط للمتابعة</small></div>`;A.appendChild(d);
 const nx=()=>{if(G.nx){clearTimeout(G.nx);G.nx=0;G.i++;ask()}};G.nx=setTimeout(nx,m==='tap'?(ok?3500:6000):ok?(why==='fuzzy'?3200:2000):3800);d.onclick=nx}
function result(){const n=G.qs.length,p=Math.round(G.score/n*100),m=G.mode;
 A.innerHTML=`<div class="res"><h1>${p>=80?'🏆':p>=50?'👏':'💪'} النتيجة: ${G.score} / ${n} (${p}%)</h1><p>✅ صحيحة: ${G.score} &nbsp; ❌ خاطئة: ${n-G.score}</p>
 <table><tr><th>#</th><th></th><th></th><th>الدولة</th><th>الإجابة الصحيحة</th><th>إجابتك</th></tr>${G.log.map((r,i)=>`<tr class="${r.ok?'g':'b'}"><td>${i+1}</td><td>${r.ok?'✅':'❌'}</td><td>${flag(r.c)}</td><td>${r.c.ar}<br><small dir="ltr">${r.c.en}</small></td><td>${ansOf(r.c,m)}</td><td>${r.ok?(r.why==='fuzzy'?r.mine+' (≈)':''):r.mine||'لم تُجب'}</td></tr>`).join('')}</table>
 <div class="chips" style="justify-content:center"><button class="go" id="ag">إعادة اللعب</button><button id="hm" style="font-size:22px">الرئيسية</button></div></div>`;
 $('#ag').onclick=()=>start(G.mode);$('#hm').onclick=home}
/* ---------- guide ---------- */
function dir(v='n',q=''){const L=D.filter(c=>!q||acc(c).has(norm(q))||norm(c.ar).includes(norm(q))||norm(c.en).includes(norm(q))).sort((a,b)=>a.ar.localeCompare(b.ar,'ar'));
 if(!$('#g')){A.innerHTML=`<div class="bar2"><button id="bk">› رجوع</button><input id="q" placeholder="بحث..." value="${q}"><div class="seg"><button data-v="n">أسماء</button><button data-v="m">خرائط</button></div></div><div class="grid" id="g"></div>`;
  $('#bk').onclick=home;$('#q').oninput=e=>dir(G.dv,e.target.value);A.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>dir(b.dataset.v,$('#q').value))}
 G.dv=v;A.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
 $('#g').innerHTML=L.map(c=>`<button class="tile" data-id="${c.id}">${v==='n'?flag(c):thumb(c)}<b>${c.ar}</b><small>${c.en}</small></button>`).join('');
 $('#g').querySelectorAll('.tile').forEach(b=>b.onclick=()=>detail(byId[b.dataset.id]))}
async function showFx(c){const el=$('#fx');if(!el)return;const d=await getFx(c);if($('#fx')!==el)return;
 el.innerHTML=d?`<h3>⭐ أشهر ما في ${c.ar}</h3><ul>${d.info.map(x=>`<li>${x}</li>`).join('')}</ul><p><b>سبب التسمية:</b> ${d.name}</p><p><b>الاستقلال:</b> ${d.ind}</p>`:'<p style="color:#9db4cc">المعلومات المختصرة وسبب التسمية وتاريخ الاستقلال: قيد الإضافة.</p>'}
function detail(c){let e=$('#dt');if(!e){e=document.createElement('div');e.id='dt';document.body.appendChild(e)}
 const nb=c.nb.map(i=>byId[i]);
 e.innerHTML=`<div class="bar2"><button id="cl">✕ إغلاق</button><h2 style="margin:0">${c.ar} — <span dir="ltr">${c.en}</span></h2></div><div class="dg">
 <div style="text-align:center">${flag(c,'flagbig')}</div>
 <div class="kv"><b>بالعربية</b><span>${c.ar}</span><b>بالإنجليزية</b><span dir="ltr">${c.en}</span><b>العاصمة</b><span dir="ltr">${c.cap}</span><b>القارة</b><span>${CN[c.co]}</span>
 <b>العملة</b><span>${c.cur.map(x=>x.ar+' ('+x.k+')').join('، ')}</span><b>المساحة</b><span>${c.area.toLocaleString('en')} كم²</span>
 <b>اللغات</b><span dir="ltr">${c.lang.join(', ')}</span><b>رمز الاتصال</b><span dir="ltr">${c.idd}</span><b>الموقع</b><span>${c.ll?'دولة غير ساحلية':'لها منفذ بحري'}</span></div>
 <div style="grid-column:1/-1"><b>الدول المجاورة:</b> ${nb.length?nb.map(x=>`<button class="nb" data-id="${x.id}">${x.ar}</button>`).join(''):'لا توجد حدود برية'}</div>
 ${c.f?`<div class="dmap" style="${SMALL.has(c.id)?'grid-column:1/-1':''}">${mapBox()}</div>${SMALL.has(c.id)?'':`<div class="dshape">${staticSvg(c,'shape',0)}</div>`}`:''}
 <div id="fx" style="grid-column:1/-1"></div></div>`;
 $('#cl').onclick=()=>e.remove();showFx(c);e.querySelectorAll('.nb').forEach(b=>b.onclick=()=>{detail(byId[b.dataset.id]);e.scrollTop=0});
 if(c.f){const mv=mkMap(e.querySelector('#mb .svgw'),{kind:'ctx',c,ring:true});mv.setSel(c.n,'t');wireBtns(e,mv,true)}}
/* ---------- world explorer ---------- */
function explore(){clearInterval(G.tm);A.innerHTML=`<div class="bar2"><button id="bk">› رجوع</button><input id="q" placeholder="ابحث عن دولة واضغط Enter"><div class="seg"><button id="mf" style="display:none">🗺️</button><button id="zi">＋</button><button id="zo">－</button><button id="zr">⟲</button></div></div><div class="mapbox ex" id="mb"><div class="svgw"></div></div><div id="sh" hidden></div>`;
 $('#bk').onclick=home;let mv;
 const sheet=c=>{mv.setSel(c.n,'sel');const s=$('#sh');s.hidden=false;
  s.innerHTML=`<div class="shc">${flag(c)}<div class="shi"><b>${c.ar}</b><span dir="ltr">${c.en}</span><div class="shk">🏛️ ${c.cap} &nbsp; 🧭 ${CN[c.co]} &nbsp; 💰 ${c.cur.map(x=>x.ar).join('، ')}</div><div class="shk" id="sfx"></div></div><div class="shb"><button class="go" id="fd">التفاصيل الكاملة</button><button id="sx">✕</button></div></div>`;
  $('#fd').onclick=()=>detail(c);$('#sx').onclick=()=>{s.hidden=true;mv.setSel(null)};
  getFx(c).then(d=>{if(d&&$('#sfx')&&s.firstChild)$('#sfx').textContent='🗓️ الاستقلال: '+d.ind})};
 mv=mkMap($('#mb .svgw'),{kind:'world',marks:true,pick:sheet});
 wireBtns(A,mv,false);
 $('#q').onkeydown=k=>{if(k.key!=='Enter')return;const v=norm(k.target.value);if(!v)return;k.target.blur();
  const c=D.find(x=>acc(x).has(v))||D.find(x=>[...acc(x)].some(y=>y.startsWith(v)))||D.find(x=>[...acc(x)].some(y=>y.includes(v)))||D.find(x=>fuzzy(x,k.target.value));
  if(c&&c.f){mv.focus(c);sheet(c)}else k.target.classList.add('shake')}}
const vv=window.visualViewport,fit=()=>{document.documentElement.style.setProperty('--h',(vv?vv.height:innerHeight)+'px');scrollTo(0,0)};
if(vv){vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)}addEventListener('orientationchange',()=>setTimeout(fit,300));fit();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
window.__wm={D,F,byId,SMALL,MK,get G(){return G},fuzzy,norm,acc,go(m,id){start(m);G.qs[0]=byId[id];ask()},detail,explore,dir};
home()})();
