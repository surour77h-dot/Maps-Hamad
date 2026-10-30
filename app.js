(async()=>{
const $=s=>document.querySelector(s),A=$('#app'),W=900,H=560,rad=Math.PI/180,deg=180/Math.PI;
const [D,T]=await Promise.all([fetch('data.json').then(r=>r.json()),fetch('world.json').then(r=>r.json())]);
/* ---------- map data ---------- */
const nbs=topojson.neighbors(T.objects.countries.geometries),all=topojson.feature(T,T.objects.countries).features;
const col=new Array(all.length).fill(-1);
[...all.keys()].sort((a,b)=>nbs[b].length-nbs[a].length).forEach(i=>{const u=new Set(nbs[i].map(j=>col[j]));let k=0;while(u.has(k))k++;col[i]=k%7});
all.forEach((f,i)=>f.col=col[i]);
const tuv=D.find(c=>c.id==='TUV');
if(tuv&&!all.some(f=>f.id===tuv.n)){const at=[[176.1,-5.67],[177.34,-6.11],[176.32,-6.29],[177.15,-7.24],[178.68,-7.48],[178.35,-8.0],[179.2,-8.5],[179.85,-9.38],[179.47,-10.78]];
 all.push({type:'Feature',id:tuv.n,properties:{name:'Tuvalu'},col:3,geometry:{type:'MultiPolygon',coordinates:at.map(a=>d3.geoCircle().center(a).radius(.14).precision(30)().coordinates)}})}
const grp={};all.forEach(f=>{if(f.id!=null)(grp[f.id]=grp[f.id]||[]).push(f)});
const byN={};for(const k in grp){const a=grp[k];a.forEach(f=>f.ar_=d3.geoArea(f));a.sort((x,y)=>y.ar_-x.ar_);byN[k]=a[0];a.forEach((f,i)=>f.pri=i===0)}
const F=all.filter(f=>f.id!=='010');
const byId={},byNc={};
const corners=b=>[[b[0][0],b[0][1]],[b[1][0],b[0][1]],[b[0][0],b[1][1]],[b[1][0],b[1][1]]];
function analyse(c){const f=c.f,g=f.geometry,cs=g.type==='Polygon'?[g.coordinates]:g.coordinates;
 const ps=cs.map(co=>{const gg={type:'Polygon',coordinates:co};return{g:gg,a:d3.geoArea(gg),ct:d3.geoCentroid(gg)}}).sort((x,y)=>y.a-x.a);const m=ps[0];
 const keep=ps.filter((q,i)=>{if(!i)return true;const r=q.a/m.a,d=d3.geoDistance(m.ct,q.ct)*deg;return(r>=.02&&d<=20)||(q.a>=3e-4&&d<=20)||(r>=.1&&d<=45)||(r>=.003&&d<=6)});
 c.keepF={type:'Feature',geometry:{type:'GeometryCollection',geometries:keep.map(q=>q.g)}};
 c.ct=d3.geoCentroid(c.keepF);c.sr=f.ar_;
 c.rr=Math.max(...keep.flatMap(q=>corners(d3.geoBounds(q.g)).map(x=>d3.geoDistance(c.ct,x)*deg)));
 c.cl=[];c.mk=false;
 if(c.sr<1e-3){const par=ps.map((_,i)=>i),fd=i=>par[i]===i?i:(par[i]=fd(par[i]));
  for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)if(d3.geoDistance(ps[i].ct,ps[j].ct)*deg<6)par[fd(i)]=fd(j);
  const gr={};ps.forEach((q,i)=>(gr[fd(i)]=gr[fd(i)]||[]).push(q));
  c.cl=Object.values(gr).map(m=>{const ct=d3.geoCentroid({type:'GeometryCollection',geometries:m.map(q=>q.g)});let rr=0;m.forEach(q=>corners(d3.geoBounds(q.g)).forEach(x=>rr=Math.max(rr,d3.geoDistance(ct,x)*deg)));return{ct,rr}});
  c.mk=c.sr<2e-4||(ps.length>=3&&ps[0].a/c.sr<.8)}}
D.forEach(c=>{byId[c.id]=c;byNc[c.n]=c;if(!c.cur.length)c.cur=[{k:'USD',ar:'دولار أمريكي'}];c.f=byN[c.n];if(c.f)analyse(c)});
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
const MINR=18;
function projFor(c,kind,W=900,H=560){const p=d3.geoEqualEarth();
 if(kind==='world')return p.fitExtent([[6,6],[W-6,H-6]],{type:'Sphere'});
 p.rotate([-c.ct[0],0]);
 if(kind==='shape')return p.fitExtent([[18,18],[W-18,H-18]],c.keepF);
 let R=Math.max(3.5,c.rr*1.45);if(c.sr<2e-4)R=Math.max(R,7);R=Math.min(R,120);
 return p.fitExtent([[24,24],[W-24,H-24]],{type:'FeatureCollection',features:[c.keepF,{type:'Feature',geometry:d3.geoCircle().center(c.ct).radius(R)()}]})}
const ringSvg=(c,p,minR)=>(c.mk?c.cl:[]).map(cl=>{const q=p(cl.ct);return`<circle class="ring" cx="${q[0]}" cy="${q[1]}" r="${Math.max(minR,p.scale()*cl.rr*rad+8)}"/>`}).join('');
const GR=d3.geoGraticule10(),FC={type:'FeatureCollection',features:F};
function staticSvg(c,kind,minR=MINR){const p=projFor(c,kind).clipExtent([[0,0],[W,H]]),g=d3.geoPath(p);
 if(kind==='shape')return`<svg viewBox="0 0 ${W} ${H}" class="map shp"><path class="t2" d="${g(c.keepF)}"/>${minR?ringSvg(c,p,minR):''}</svg>`;
 let s=`<svg viewBox="0 0 ${W} ${H}" class="map"><path class="grat" d="${g(GR)}"/><path class="coast" d="${g(FC)}"/><g class="land">`,t='';
 F.forEach(f=>{const d=g(f);if(!d)return;if(f.pri&&f.id===c.n)t=`<path class="l t" d="${d}"/>`;else s+=`<path class="l c${f.col%7}" d="${d}"/>`});
 return s+t+`</g>${ringSvg(c,p,minR)}</svg>`}
const thumbs={};const thumb=c=>thumbs[c.id]||(thumbs[c.id]=c.f?(SMALL.has(c.id)?staticSvg(c,'ctx',30):staticSvg(c,'shape',0)):flag(c));
function mkMap(host,o){const W=Math.max(200,host.clientWidth||900),H=Math.max(200,host.clientHeight||560);let kind=o.kind,tr=d3.zoomIdentity,p0,s0,t0,r0,mkv=[];const selSet=new Map();
 host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" class="map live"><g class="z"><path class="grat"></path><path class="coast"></path><g class="land"></g><g class="mks"></g><g class="rg"></g></g></svg>`;
 const svg=d3.select(host.querySelector('svg')),gz=svg.select('g.z'),land=gz.select('g.land');
 const paths=land.selectAll('path').data(F).join('path').attr('class',f=>'l c'+(f.col%7)).attr('data-n',f=>f.pri?f.id:null);
 function base(){p0=kind==='world'?projFor(null,'world',W,H):projFor(o.c,'ctx',W,H);s0=p0.scale();t0=p0.translate();r0=p0.rotate()}
 const proj=t=>d3.geoEqualEarth().rotate(r0).scale(s0*t.k).translate([t0[0]*t.k+t.x,t0[1]*t.k+t.y]).clipExtent([[-40,-40],[W+40,H+40]]);
 const mcls=d=>'mk'+(selSet.has(d.c.n)?' '+selSet.get(d.c.n):'');
 function render(){const p=proj(tr),g=d3.geoPath(p);
  gz.select('.grat').attr('d',g(GR));gz.select('.coast').attr('d',g(FC));paths.attr('d',f=>g(f)||null);
  mkv=[];if(o.marks&&tr.k>=2.2)MK.forEach(c=>c.cl.forEach(cl=>{const q=p(cl.ct),r=Math.max(MINR,p.scale()*cl.rr*rad+8);if(q[0]<-r||q[0]>W+r||q[1]<-r||q[1]>H+r)return;mkv.push({c,x:q[0],y:q[1],r})}));
  gz.select('.mks').selectAll('circle').data(mkv).join('circle').attr('class',mcls).attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',d=>d.r);
  const rs=o.ring&&o.c&&o.c.mk?o.c.cl.map(cl=>{const q=p(cl.ct);return{x:q[0],y:q[1],r:Math.max(MINR,p.scale()*cl.rr*rad+8)}}):[];
  gz.select('.rg').selectAll('circle').data(rs).join('circle').attr('class','ring').attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',d=>d.r)}
 const zoom=d3.zoom().scaleExtent([1,5000]).translateExtent([[-W,-H],[2*W,2*H]])
  .on('zoom',e=>{const t=e.transform,r=t.k/tr.k;gz.attr('transform',`translate(${t.x-tr.x*r},${t.y-tr.y*r}) scale(${r})`)})
  .on('end',e=>{const t=e.transform;if(t.k===tr.k&&t.x===tr.x&&t.y===tr.y)return;tr=t;gz.attr('transform',null);render()});
 svg.call(zoom).on('dblclick.zoom',null);
 svg.on('click',ev=>{if(!o.pick)return;const pt=d3.pointer(ev,svg.node());let best=null,bd=1e9;
  mkv.forEach(m=>{const d=Math.hypot(pt[0]-m.x,pt[1]-m.y);if(d<=m.r&&d<bd){bd=d;best=m.c}});
  if(!best){const el=ev.target.closest&&ev.target.closest('path.l'),n=el&&el.getAttribute('data-n');best=n&&byNc[n]}
  if(best)o.pick(best)});
 function setSel(n,cls,keep){if(!keep){selSet.clear();paths.classed('sel good bad t',false)}
  if(n!=null){selSet.set(n,cls);paths.filter(f=>f.pri&&f.id===n).classed(cls,true).raise()}
  gz.select('.mks').selectAll('circle').attr('class',mcls)}
 function bbox(c){if(c.mk){const q=p0(c.cl[0].ct),s=p0.scale()*Math.max(...c.cl.map(x=>x.rr))*rad+2;return[[q[0]-s,q[1]-s],[q[0]+s,q[1]+s]]}return d3.geoPath(p0).bounds(c.keepF)}
 function focus(list,dur=700){const L=[].concat(list);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  L.forEach(c=>{const b=bbox(c);x0=Math.min(x0,b[0][0]);y0=Math.min(y0,b[0][1]);x1=Math.max(x1,b[1][0]);y1=Math.max(y1,b[1][1])});
  if(!isFinite(x0))return;const w=Math.max(x1-x0,1e-3),h=Math.max(y1-y0,1e-3),f=L.length===1&&L[0].mk?.22:.8;
  const k=Math.max(1,Math.min(5000,f*W/w,f*H/h)),T=d3.zoomIdentity.translate(W/2-k*(x0+x1)/2,H/2-k*(y0+y1)/2).scale(k);
  (dur?svg.transition().duration(dur):svg).call(zoom.transform,T)}
 base();render();
 return{setSel,focus,by:f=>svg.transition().duration(250).call(zoom.scaleBy,f),reset:()=>svg.transition().duration(300).call(zoom.transform,d3.zoomIdentity),
  world(on){kind=on?'world':'ctx';base();tr=d3.zoomIdentity;svg.call(zoom.transform,d3.zoomIdentity);render()}}}
const mapBox=()=>`<div class="mapbox" id="mb"><div class="svgw"></div><div class="mt"><button id="mz">🌍</button><button id="zi">＋</button><button id="zo">－</button><button id="zr">⟲</button></div></div>`;
function wireBtns(mv,world){let w=false;if(world)$('#mz').onclick=e=>{w=!w;e.target.textContent=w?'🔍':'🌍';mv.world(w)};else if($('#mz'))$('#mz').style.display='none';
 $('#zi').onclick=()=>mv.by(1.7);$('#zo').onclick=()=>mv.by(1/1.7);$('#zr').onclick=()=>mv.reset()}
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
 if(m==='tap'){const mv=G.mv=mkMap($('#mb .svgw'),{kind:'world',marks:true,pick:cc=>{if(G.lock)return;G.pick=cc;mv.setSel(cc.n,'sel');$('#go').disabled=false}});wireBtns(mv,false);
  if(S.conts.length<6)mv.focus(D.filter(x=>S.conts.includes(x.co)&&x.f),0)}
 else if($('#mb')){const mv=G.mv=mkMap($('#mb .svgw'),{kind:'ctx',c,ring:true});mv.setSel(c.n,'t');wireBtns(mv,true)}
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
 if(c.f){const mv=mkMap(e.querySelector('#mb .svgw'),{kind:'ctx',c,ring:true});mv.setSel(c.n,'t');wireBtns(mv,true)}}
/* ---------- world explorer ---------- */
function explore(){clearInterval(G.tm);A.innerHTML=`<div class="bar2"><button id="bk">› رجوع</button><input id="q" placeholder="ابحث عن دولة واضغط Enter"><div class="seg"><button id="zi">＋</button><button id="zo">－</button><button id="zr">⟲</button></div></div><div class="mapbox ex" id="mb"><div class="svgw"></div></div><div id="sh" hidden></div>`;
 $('#bk').onclick=home;let mv;
 const sheet=c=>{mv.setSel(c.n,'sel');const s=$('#sh');s.hidden=false;
  s.innerHTML=`<div class="shc">${flag(c)}<div class="shi"><b>${c.ar}</b><span dir="ltr">${c.en}</span><div class="shk">🏛️ ${c.cap} &nbsp; 🧭 ${CN[c.co]} &nbsp; 💰 ${c.cur.map(x=>x.ar).join('، ')}</div><div class="shk" id="sfx"></div></div><div class="shb"><button class="go" id="fd">التفاصيل الكاملة</button><button id="sx">✕</button></div></div>`;
  $('#fd').onclick=()=>detail(c);$('#sx').onclick=()=>{s.hidden=true;mv.setSel(null)};
  getFx(c).then(d=>{if(d&&$('#sfx')&&s.firstChild)$('#sfx').textContent='🗓️ الاستقلال: '+d.ind})};
 mv=mkMap($('#mb .svgw'),{kind:'world',marks:true,pick:sheet});
 $('#zi').onclick=()=>mv.by(1.7);$('#zo').onclick=()=>mv.by(1/1.7);$('#zr').onclick=()=>mv.reset();
 $('#q').onkeydown=k=>{if(k.key!=='Enter')return;const v=norm(k.target.value);if(!v)return;k.target.blur();
  const c=D.find(x=>acc(x).has(v))||D.find(x=>[...acc(x)].some(y=>y.startsWith(v)))||D.find(x=>[...acc(x)].some(y=>y.includes(v)))||D.find(x=>fuzzy(x,k.target.value));
  if(c&&c.f){mv.focus(c);sheet(c)}else k.target.classList.add('shake')}}
const vv=window.visualViewport,fit=()=>{document.documentElement.style.setProperty('--h',(vv?vv.height:innerHeight)+'px');scrollTo(0,0)};
if(vv){vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)}addEventListener('orientationchange',()=>setTimeout(fit,300));fit();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
window.__wm={D,F,byId,SMALL,MK,get G(){return G},fuzzy,norm,acc,go(m,id){start(m);G.qs[0]=byId[id];ask()},detail,explore,dir};
home()})();
