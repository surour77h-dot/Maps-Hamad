(async()=>{
const $=s=>document.querySelector(s),A=$('#app'),W=900,H=560,rad=Math.PI/180,deg=180/Math.PI,VER='v9';
const [D,T,T5,T1]=await Promise.all([fetch('data.json').then(r=>r.json()),fetch('world.json').then(r=>r.json()),fetch('world50.json').then(r=>r.json()),fetch('world110.json').then(r=>r.json())]);
/* ---------- map data: Natural Earth 1:10m (detail) + 1:50m (settled world views) + 1:110m (light copy while dragging) ---------- */
const all=topojson.feature(T,T.objects.countries).features,nbs=topojson.neighbors(T.objects.countries.geometries).map(a=>a.slice());
const keyOf=f=>f.id!=null?f.id:'n:'+f.properties.name;
/* map convention: Western Sahara is drawn as part of Morocco (one merged shape, no inner border) */
function mergeWS(Tx,feats){const gs=Tx.objects.countries.geometries,iM=gs.findIndex(g=>g.id==='504'&&!(g.properties&&g.properties.p===0)),iS=gs.findIndex(g=>g.id==='732');
 if(iM<0||iS<0)return[-1,-1];feats[iM].geometry=topojson.merge(Tx,[gs[iM],gs[iS]]);feats[iS].hide=true;return[iM,iS]}
const [mM,mS]=mergeWS(T,all);
if(mM>=0)nbs[mS].forEach(j=>{if(j!==mM){if(!nbs[mM].includes(j))nbs[mM].push(j);if(!nbs[j].includes(mM))nbs[j].push(mM)}});
const LM={},MM={},f1=topojson.feature(T1,T1.objects.countries).features,f5=topojson.feature(T5,T5.objects.countries).features;
mergeWS(T1,f1);mergeWS(T5,f5);
f1.forEach(f=>{if(!f.hide)LM[keyOf(f)]=f});f5.forEach(f=>{if(!f.hide&&f.properties.p)MM[keyOf(f)]=f});
all.forEach(f=>{f.pri=!f.hide&&f.id!=null&&!!f.properties.p;const u=!f.hide&&(f.id==null||f.pri);f.lite=u?(LM[keyOf(f)]||null):null;f.mid=u?(MM[keyOf(f)]||null):null});
/* the 1:10m Vatican polygon is degenerate (zero width): use the 1:50m outline */
all.forEach(f=>{if(f.id==='336'&&f.mid&&f.mid.geometry)f.geometry=f.mid.geometry});
/* random graph colouring: neighbours never share a colour; new arrangement on every call */
function recolor(){const n=all.length,col=new Array(n).fill(-1);
 [...Array(n).keys()].filter(i=>!all[i].hide).map(i=>[nbs[i].length+Math.random()*4,i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{const u=new Set(nbs[i].map(j=>col[j])),av=[0,1,2,3,4,5,6].filter(k=>!u.has(k));col[i]=av.length?av[Math.floor(Math.random()*av.length)]:Math.floor(Math.random()*7)});
 all.forEach((f,i)=>f.col=col[i])}
recolor();
const byN={};all.forEach(f=>{if(f.pri)byN[f.id]=f});
const F=all.filter(f=>!f.hide);
const byId={},byNc={};
D.forEach(c=>{byId[c.id]=c;byNc[c.n]=c;if(!c.cur.length)c.cur=[{k:'USD',ar:'دولار أمريكي'}];c.f=byN[c.n];
 if(c.f){const g=c.f.geometry,cs=g.type==='Polygon'?[g.coordinates]:g.coordinates;c.keepF={type:'Feature',geometry:{type:'GeometryCollection',geometries:c.kp.map(i=>({type:'Polygon',coordinates:cs[i]}))}}}});
{const m=byNc['504'];if(m&&m.f&&mM>=0){const cs=m.f.geometry.coordinates,ps=cs.map((co,i)=>({i,a:d3.geoArea({type:'Polygon',coordinates:co})})),mx=Math.max(...ps.map(q=>q.a));
 m.kp=ps.filter(q=>q.a>=mx*.02).map(q=>q.i);m.keepF={type:'Feature',geometry:{type:'GeometryCollection',geometries:m.kp.map(i=>({type:'Polygon',coordinates:cs[i]}))}};
 const ct=d3.geoCentroid(m.keepF);m.ct=ct;m.rr=Math.max(...m.kp.flatMap(i=>{const b=d3.geoBounds({type:'Polygon',coordinates:cs[i]});return[[b[0][0],b[0][1]],[b[1][0],b[0][1]],[b[0][0],b[1][1]],[b[1][0],b[1][1]]].map(x=>d3.geoDistance(ct,x)*deg)}));m.cl=[];m.mk=0}}
/* ranks for the info panel */
D.forEach(c=>{if(c.pop&&c.gdp)c.gpc=c.gdp/c.pop});
['pop','gdp','area','gpc'].forEach(k=>D.filter(c=>c[k]!=null).sort((x,y)=>y[k]-x[k]).forEach((c,i)=>c['r_'+k]=i+1));
const nf=new Intl.NumberFormat('en'),fmtPop=n=>n>=1e9?(n/1e9).toFixed(2)+' مليار':n>=1e6?(n/1e6).toFixed(n>=1e7?1:2)+' مليون':nf.format(n);
const fmtUSD=n=>n>=1e12?'$'+(n/1e12).toFixed(2)+' تريليون':n>=1e9?'$'+(n/1e9).toFixed(1)+' مليار':'$'+(n/1e6).toFixed(0)+' مليون';
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
/* ---------- maps (Mercator for flat/regional/shape views, orthographic globe) ---------- */
const MINR=18,GR=d3.geoGraticule10(),GL0=[-40,-25],my=l=>Math.log(Math.tan(Math.PI/4+l*rad/2));
function worldMerc(W,H){const span=my(82)-my(-58),k=Math.min((W-12)/(2*Math.PI),(H-12)/span);return d3.geoMercator().scale(k).translate([W/2,H/2+k*(my(82)+my(-58))/2])}
function projFor(c,kind,W=900,H=560){
 if(kind==='world')return worldMerc(W,H);
 const p=d3.geoMercator().rotate([-c.ct[0],0]);
 if(kind==='shape')return p.fitExtent([[18,18],[W-18,H-18]],c.keepF);
 let R=Math.max(3.5,c.rr*1.45);if(c.sr<2e-4)R=Math.max(R,7);R=Math.min(R,120);
 const la=c.ct[1],w=Math.min(175,R*1.7/Math.max(.35,Math.cos(Math.min(70,Math.abs(la))*rad))),reg=d3.geoGraticule().extent([[c.ct[0]-w,Math.max(-80,la-R)],[c.ct[0]+w,Math.min(80,la+R)]]).outline();
 p.fitExtent([[24,24],[W-24,H-24]],{type:'FeatureCollection',features:[c.keepF,{type:'Feature',geometry:reg}]});p._R=R;return p}
/* is feature f near country c? (cheap bounding-box test, keeps thumbnails fast) */
function near(c,f,R){const b=f.gb||(f.gb=d3.geoBounds(f.mid||f)),w=b[0][0],s=b[0][1],e=b[1][0],n=b[1][1],x=c.ct[0],y=c.ct[1];if(w>e)return true;
 let lx=x;if(x<w||x>e){const dw=Math.abs(((x-w+540)%360)-180),de=Math.abs(((x-e+540)%360)-180);lx=dw<de?w:e}
 return d3.geoDistance(c.ct,[lx,Math.max(s,Math.min(n,y))])*deg<=R*1.9+3}
function frameHtml(c,p,W,H,cls){const g=d3.geoPath(p),b=g.bounds(c.f);if(!isFinite(b[0][0]))return'';const x0=b[0][0],y0=b[0][1],x1=b[1][0],y1=b[1][1];
 if(x1<-40||x0>W+40||y1<-40||y0>H+40)return'';
 const R=(x,y,w,h)=>`<rect class="fr ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/>`;
 if(x1-x0>W*.9||y1-y0>H*.9)return(c.cl||[]).map(cl=>{const q=p(cl.ct);if(!q)return'';const r=Math.max(13,p.scale()*cl.rr*rad+7);return R(q[0]-r,q[1]-r,2*r,2*r)}).join('');
 const w=x1-x0,h=y1-y0,cx=(x0+x1)/2,cy=(y0+y1)/2;
 if(Math.max(w,h)<10)return`<circle class="fr ${cls}" cx="${cx}" cy="${cy}" r="17"/>`;
 const ww=Math.max(w+20,32),hh=Math.max(h+20,32);return R(cx-ww/2,cy-hh/2,ww,hh)}
function staticSvg(c,kind,minR=MINR){const p=projFor(c,kind).clipExtent([[0,0],[W,H]]),g=d3.geoPath(p);
 if(kind==='shape')return`<svg viewBox="0 0 ${W} ${H}" class="map shp"><path class="t2" d="${g(c.keepF)}"/></svg>`;
 const R=p._R||60;let s='',t='';const co=[];
 F.forEach(f=>{const tg=f.pri&&f.id===c.n;if(!tg&&!near(c,f,R))return;const d=g(f);if(!d)return;co.push(d);if(tg)t=`<path class="l ${minR&&c.mk?'sel':'t'}" d="${d}"/>`;else s+=`<path class="l c${f.col%7}" d="${d}"/>`});
 return`<svg viewBox="0 0 ${W} ${H}" class="map"><path class="grat" d="${g(GR)}"/><path class="coast" d="${co.join('')}"/><g class="land">${s}${t}</g>${minR&&c.mk?frameHtml(c,p,W,H,'t'):''}</svg>`}
const thumbs={};const thumb=c=>thumbs[c.id]||(thumbs[c.id]=c.f?(SMALL.has(c.id)?staticSvg(c,'ctx',30):staticSvg(c,'shape',0)):flag(c));
let MW=null;/* tiny world for the locator inset */
function miniWorld(c){if(!MW){const p=worldMerc(120,70).clipExtent([[0,0],[120,70]]),g=d3.geoPath(p);MW={p,d:F.map(f=>f.lite?g(f.lite):'').join('')}}
 const q=MW.p(c.ct)||[60,35];return`<svg viewBox="0 0 120 70" class="mw"><path d="${MW.d}"/><circle cx="${q[0]}" cy="${q[1]}" r="9" class="mwr"/><circle cx="${q[0]}" cy="${q[1]}" r="3.2" class="mwd"/></svg>`}
const LOC={};const locator=c=>LOC[c.id]||(LOC[c.id]=c.f?`<div class="loc">${staticSvg(c,'ctx',MINR)}${miniWorld(c)}</div>`:'');
function mkMap(host,o){recolor();
 let W=Math.max(200,host.clientWidth||900),H=Math.max(200,host.clientHeight||560),gR=Math.min(W,H)/2*.94;
 let mode=o.kind==='world'?(S.flat?'flat':'globe'):'ctx',tr=d3.zoomIdentity,p0,s0,t0,r0,gv={r:GL0.slice(),k:1},anim=0,lastC=o.c||null,inset=0;const selSet=new Map();let ready=false,wb=null,kmin=1,sRef=1;const foundN=new Set((o.found||[]).map(c=>c.n));
 host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" class="map live${mode==='globe'?' globe':''}"><defs><radialGradient id="sph" cx="38%" cy="34%" r="75%"><stop offset="0" stop-color="var(--sea1)"/><stop offset=".7" stop-color="var(--sea2)"/><stop offset="1" stop-color="var(--sea3)"/></radialGradient></defs><g class="z"><path class="sphere"></path><path class="grat"></path><path class="coast"></path><g class="land"></g><g class="mhs"></g><g class="mks"></g><g class="mrs"></g><g class="rg"></g><g class="mds"></g><g class="lb"></g></g></svg>`;
 const svg=d3.select(host.querySelector('svg')),gz=svg.select('g.z'),land=gz.select('g.land'),el=svg.node();
 const paths=land.selectAll('path').data(F).join('path').attr('class',f=>'l c'+(f.col%7)).attr('data-n',f=>f.pri?f.id:null);
 function base(){p0=mode==='ctx'?projFor(o.c,'ctx',W,H):projFor(null,'world',W,H);s0=p0.scale();t0=p0.translate();r0=p0.rotate();tr=d3.zoomIdentity;sRef=worldMerc(W,H).scale();
  if(mode==='ctx'){const l0=-r0[0],a=p0([l0-179.9,80]),b=p0([l0+179.9,-80]);wb=[[Math.min(a[0],b[0]),Math.min(a[1],b[1])],[Math.max(a[0],b[0]),Math.max(a[1],b[1])]];kmin=Math.max(.01,Math.min(W/(wb[1][0]-wb[0][0]),H/(wb[1][1]-wb[0][1])))}else{wb=null;kmin=1}
  zoom.scaleExtent([kmin,5000])}
 const kNow=()=>mode==='globe'?gv.k:tr.k;
 const proj=()=>mode==='globe'?d3.geoOrthographic().rotate([gv.r[0],gv.r[1],0]).scale(gR*gv.k).translate([W/2,H/2]).clipAngle(90).clipExtent([[-40,-40],[W+40,H+40]])
  :d3.geoMercator().rotate(r0).scale(s0*tr.k).translate([t0[0]*tr.k+tr.x,t0[1]*tr.k+tr.y]).clipExtent([[-40,-40],[W+40,H+40]]);
 const st=n=>selSet.has(n)?' '+selSet.get(n):'';
 function drawFr(p){gz.select('.rg').html([...selSet].map(([n,cls])=>{const c=byNc[n];return c&&c.mk&&c.f&&!foundN.has(n)?frameHtml(c,p,W,H,cls):''}).join(''))}
 function render(lite){const p=proj(),g=d3.geoPath(p),ds=[];ready=true;
  gz.select('.sphere').attr('d',mode==='globe'?g({type:'Sphere'}):null);gz.select('.grat').attr('d',g(GR));
  const mid=lite==='mid'||(!lite&&(mode==='globe'?gv.k:s0*tr.k/sRef)<2.5);
  paths.attr('d',f=>{const l=f.mid||f.lite;let d;
   if(lite===true)d=f.lite?g(f.lite):null;
   else if(mid)d=f.mid?g(f.mid):null;
   else{if(l){const b=g.bounds(l);if(!isFinite(b[0][0])||b[1][0]<-40||b[0][0]>W+40||b[1][1]<-40||b[0][1]>H+40)return null}d=g(f)}
   if(d)ds.push(d);return d||null});
  gz.select('.coast').attr('d',mode==='globe'?null:ds.join(''));
  const full=lite!==true&&lite!=='mid',k=kNow();
  /* small countries: no visible markers (invisible hit areas keep them tappable); a selected one gets a red frame */
  const hs=[];if(o.marks&&full)MK.forEach(c=>{const d=g(c.f);if(!d)return;const b=g.bounds(c.f);hs.push({c,d,sz:Math.max(b[1][0]-b[0][0],b[1][1]-b[0][1]),cx:(b[0][0]+b[1][0])/2,cy:(b[0][1]+b[1][1])/2})});
  const dots=hs.filter(d=>d.sz<10),outs=hs.filter(d=>d.sz>=10&&k>=2.2).sort((a,b)=>b.sz-a.sz);
  gz.select('.mhs').selectAll('path').data(outs).join('path').attr('d',d=>d.d).attr('data-n',d=>d.c.n).style('stroke-width',d=>(d.sz<34?30:12)+'px');
  gz.select('.mrs').selectAll('*').remove();gz.select('.mks').selectAll('*').remove();
  gz.select('.mds').selectAll('g').data(dots).join(e=>{const n=e.append('g');n.append('circle').attr('class','hd').attr('r',17);return n}).attr('transform',d=>`translate(${d.cx},${d.cy})`).attr('data-n',d=>d.c.n).attr('class','md');
  drawFr(p);
  /* name chips for countries already found */
  const fl=full?(o.found||[]).map(c=>{const q=p(c.ct);return q&&q[0]>-30&&q[0]<W+30&&q[1]>-30&&q[1]<H+30?{c,x:q[0],y:q[1],w:34+c.ar.length*8.5}:null}).filter(Boolean):[];
  gz.select('.lb').selectAll('g').data(fl,d=>d.c.id).join(e=>{const n=e.append('g');n.append('rect').attr('rx',8).attr('height',22).attr('y',-11);n.append('image').attr('width',20).attr('height',14).attr('y',-7);n.append('text').attr('y',5);return n})
   .attr('transform',d=>`translate(${d.x},${d.y})`).each(function(d){const g2=d3.select(this);g2.select('rect').attr('x',-d.w/2).attr('width',d.w);g2.select('image').attr('href','flags/'+d.c.a+'.svg').attr('x',-d.w/2+6);g2.select('text').attr('x',-d.w/2+30).text(d.c.ar)})}
 /* ---- flat / context maps: d3 zoom with exact re-render on gesture end ---- */
 const cl2=(lo,hi,v)=>lo>hi?(lo+hi)/2:Math.max(lo,Math.min(hi,v));
 const zoom=d3.zoom().scaleExtent([1,5000]).translateExtent([[-W,-H],[2*W,2*H]]).constrain((t,ext,te)=>{
  if(mode==='ctx'&&wb){const cx=cl2(wb[0][0]+W/(2*t.k),wb[1][0]-W/(2*t.k),(W/2-t.x)/t.k),cy=cl2(wb[0][1]+H/(2*t.k),wb[1][1]-H/(2*t.k),(H/2-t.y)/t.k);return d3.zoomIdentity.translate(W/2-cx*t.k,H/2-cy*t.k).scale(t.k)}
  const dx0=t.invertX(ext[0][0])-te[0][0],dx1=t.invertX(ext[1][0])-te[1][0],dy0=t.invertY(ext[0][1])-te[0][1],dy1=t.invertY(ext[1][1])-te[1][1];
  return t.translate(dx1>dx0?(dx0+dx1)/2:Math.min(0,dx0)||Math.max(0,dx1),dy1>dy0?(dy0+dy1)/2:Math.min(0,dy0)||Math.max(0,dy1))})
  .on('zoom',e=>{const t=e.transform,r=t.k/tr.k;gz.attr('transform',`translate(${t.x-tr.x*r},${t.y-tr.y*r}) scale(${r})`)})
  .on('end',e=>{const t=e.transform;if(t.k===tr.k&&t.x===tr.x&&t.y===tr.y)return;tr=t;gz.attr('transform',null);render()});
 const useZoom=()=>svg.call(zoom).on('dblclick.zoom',null);
 function pickAt(t){const q=s=>t&&t.closest&&t.closest(s);let n=null,m=q('.mds g')||q('.mhs path');if(m)n=m.getAttribute('data-n');else{const l=q('path.l');n=l&&l.getAttribute('data-n')}const c=n&&byNc[n];if(c&&o.pick)o.pick(c)}
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
  if(ready)drawFr(proj())}
 (o.found||[]).forEach(c=>setSel(c.n,'good',true));
 function bbox(c){if(c.mk){const q=p0(c.cl[0].ct),s=p0.scale()*Math.max(...c.cl.map(x=>x.rr))*rad+2;return[[q[0]-s,q[1]-s],[q[0]+s,q[1]+s]]}return d3.geoPath(p0).bounds(c.keepF)}
 function focusGlobe(L,dur){let ctr,th;
  if(L.length===1){const c=L[0];ctr=c.ct;th=c.mk?Math.max(c.rr*1.6,.9):Math.max(c.rr*1.25,.5)}
  else{ctr=d3.geoCentroid({type:'GeometryCollection',geometries:L.map(c=>({type:'Point',coordinates:c.ct}))});th=Math.max(...L.map(c=>d3.geoDistance(ctr,c.ct)*deg+c.rr))*1.1}
  th=Math.min(th,85);lastC=L[0];const k=Math.max(1,Math.min(3000,.82*(Math.min(W,H-inset)/2)/Math.sin(th*rad)/gR)),ps=Math.asin(Math.min(.9,(inset/2)/(gR*k)))*deg;
  animTo([-ctr[0],-ctr[1]+ps],k,dur)}
 function focus(list,dur=700){const L=[].concat(list).filter(c=>c&&c.f);if(!L.length)return;if(mode==='globe')return focusGlobe(L,dur);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;lastC=L[0];
  L.forEach(c=>{const b=bbox(c);x0=Math.min(x0,b[0][0]);y0=Math.min(y0,b[0][1]);x1=Math.max(x1,b[1][0]);y1=Math.max(y1,b[1][1])});
  if(!isFinite(x0))return;const w=Math.max(x1-x0,1e-3),h=Math.max(y1-y0,1e-3),f=L.length===1&&L[0].mk?.22:.8;
  const k=Math.max(1,Math.min(5000,f*W/w,f*(H-inset)/h)),T=d3.zoomIdentity.translate(W/2-k*(x0+x1)/2,(H-inset)/2-k*(y0+y1)/2).scale(k);
  (dur?svg.transition().duration(dur):svg).call(zoom.transform,T)}
 function setMode(m){stopAnim();clearTimeout(idle);mode=m;svg.classed('globe',m==='globe');svg.on('.zoom',null);gz.attr('transform',null);
  if(m==='globe'){gv.k=1;gv.r=lastC&&lastC.ct?[-lastC.ct[0],-lastC.ct[1]]:GL0.slice();render(false)}
  else{useZoom();base();svg.call(zoom.transform,d3.zoomIdentity);render(false);if(m==='flat'&&lastC&&lastC.f&&mode==='flat')focus(lastC,0)}
  api.onmode&&api.onmode(mode)}
 function resize(){const nw=Math.max(200,host.clientWidth||W),nh=Math.max(200,host.clientHeight||H);if(Math.abs(nw-W)<2&&Math.abs(nh-H)<2)return;
  stopAnim();W=nw;H=nh;gR=Math.min(W,H)/2*.94;svg.attr('viewBox',`0 0 ${W} ${H}`);zoom.translateExtent([[-W,-H],[2*W,2*H]]);gz.attr('transform',null);
  if(mode==='globe'){render(false)}else{base();svg.call(zoom.transform,d3.zoomIdentity);render(false)}
  o.onresize&&o.onresize()}
 let rt=0;if(window.ResizeObserver)new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(resize,120)}).observe(host);
 const api={setSel,focus,onmode:null,resize,mode:()=>mode,inset:v=>{inset=v},
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
/* ---------- floating country panel (drag by header, resize from the corner) ---------- */
const LN=(()=>{const m={},en=new Intl.DisplayNames('en',{type:'language'}),ar=new Intl.DisplayNames('ar',{type:'language'}),L='abcdefghijklmnopqrstuvwxyz';
 for(const x of L)for(const y of L){const k=x+y;try{const e=en.of(k);if(e&&e!==k&&!m[e])m[e]=ar.of(k)}catch(_){}}return m})(),arLang=n=>LN[n]||n;
const statCards=c=>{const k=(l,v,sub='',cls='')=>v==null||v===''?'':`<div class="stat ${cls}"><span>${l}</span><b>${v}</b>${sub?`<small>${sub}</small>`:''}</div>`;
 return [k('العاصمة',c.cap),k('العملة',c.cur.map(x=>x.ar).join('، '),c.cur.map(x=>x.k).join(' · ')),
  k('عدد السكان',c.pop?`${fmtPop(c.pop)}<em>(تحديث ${c.popY})</em>`:'—',c.pop?`المرتبة ${c.r_pop} من 195`:''),
  k('الكثافة السكانية',c.pop&&c.area?nf.format(Math.round(c.pop/c.area))+' نسمة/كم²':'—'),
  k('المساحة',nf.format(c.area)+' كم²',`المرتبة ${c.r_area}`),
  k('الناتج المحلي',c.gdp?`${fmtUSD(c.gdp)}<em>(تحديث ${c.gdpY})</em>`:'—',c.gdp?`المرتبة ${c.r_gdp}`:''),
  k('نصيب الفرد من الناتج',c.gpc?'$'+nf.format(Math.round(c.gpc)):'—',c.gpc?`المرتبة ${c.r_gpc}`:''),
  k('اللغات',c.lang.map(arLang).join('، ')),k('رمز الاتصال',c.idd,c.tld?'النطاق '+c.tld:''),
  k('الموقع',c.ll?'دولة غير ساحلية':'لها منفذ بحري',c.nb.length?c.nb.length+' دولة مجاورة':'لا حدود برية'),
  k('الاسم الرسمي',c.offA,c.off,'wide'),k('المنطقة',c.sub?c.sub+' — '+CN[c.co]:CN[c.co],c.dem?'الجنسية: '+c.dem:'')].join('')};
function closePanel(){const e=$('#pn');if(e)e.remove();A.classList.remove('dk');if(closePanel.cb)closePanel.cb();closePanel.cb=null}
const pk=()=>innerWidth>innerHeight?'pnL':'pnP';
function placePanel(e){if(e.dataset.dk&&innerWidth>innerHeight){e.classList.add('dock');A.classList.add('dk');['width','height','left','top'].forEach(k=>e.style[k]='');return}
 e.classList.remove('dock');A.classList.remove('dk');const vw=innerWidth,vh=window.visualViewport?visualViewport.height:innerHeight,R=S[pk()]||{};
 const w=Math.min(R.w||(vw>900?560:vw-16),vw-12),h=Math.min(R.h||Math.round(vh*(vw>900?.52:.5)),vh-20);
 Object.assign(e.style,{width:w+'px',height:h+'px',left:Math.max(6,Math.min(R.x!=null?R.x:(vw-w)/2,vw-w-6))+'px',top:Math.max(6,Math.min(R.y!=null?R.y:vh-h-10,vh-h-6))+'px'})}
function fitPanel(){const e=$('#pn');if(e)placePanel(e)}
function openPanel(c,o={}){let e=$('#pn');const fresh=!e;
 if(fresh){e=document.createElement('div');e.id='pn';if(o.dock)e.dataset.dk='1';document.body.appendChild(e)}
 if(fresh)placePanel(e);
 e.innerHTML=`<div class="ph"><i class="grip">⠿</i>${flag(c)}<div class="pt2"><b>${c.ar}</b><span dir="ltr">${c.en}</span></div><button class="pclose" aria-label="إغلاق">✕</button></div>
 <div class="pbody"><div class="reg">${c.sub?c.sub+' · ':''}${CN[c.co]}</div>${locator(c)}<div class="stats">${statCards(c)}</div>
 <div class="nbs"><b>الدول المجاورة</b> ${c.nb.length?c.nb.map(i=>byId[i]).filter(Boolean).map(x=>`<button class="nb" data-id="${x.id}">${x.ar}</button>`).join(''):'<span class="mut">لا توجد حدود برية</span>'}</div>
 <div id="pfx" class="pfx"></div></div><div class="rz" aria-label="تغيير الحجم"></div>`;
 e.querySelector('.pclose').onclick=closePanel;
 e.querySelectorAll('.nb').forEach(b=>b.onclick=()=>{const n=byId[b.dataset.id];if(o.go)o.go(n);else openPanel(n,o)});
 getFx(c).then(d=>{const x=$('#pfx');if(!x||$('#pn')!==e)return;x.innerHTML=d?`<div class="fxc"><h4>🗓️ الاستقلال</h4><p>${d.ind}</p></div><div class="fxc"><h4>🏷️ سبب التسمية</h4><p>${d.name}</p></div><div class="fxc"><h4>⭐ أشهر ما فيها</h4><ul>${d.info.map(i=>`<li>${i}</li>`).join('')}</ul></div>`:''});
 const sv=()=>{S[pk()]={x:parseFloat(e.style.left),y:parseFloat(e.style.top),w:parseFloat(e.style.width),h:parseFloat(e.style.height)};save()};
 const drag=(h,fn)=>{h.onpointerdown=ev=>{if(e.classList.contains('dock')||ev.target.closest('button'))return;ev.preventDefault();h.setPointerCapture(ev.pointerId);const sx=ev.clientX,sy=ev.clientY,r=e.getBoundingClientRect();
  h.onpointermove=m=>fn(r,m.clientX-sx,m.clientY-sy);h.onpointerup=h.onpointercancel=()=>{h.onpointermove=null;sv()}}};
 drag(e.querySelector('.ph'),(r,dx,dy)=>{e.style.left=Math.max(4,Math.min(innerWidth-r.width-4,r.left+dx))+'px';e.style.top=Math.max(4,Math.min(innerHeight-60,r.top+dy))+'px'});
 drag(e.querySelector('.rz'),(r,dx,dy)=>{e.style.width=Math.max(260,Math.min(innerWidth-r.left-4,r.width+dx))+'px';e.style.height=Math.max(190,Math.min(innerHeight-r.top-4,r.height+dy))+'px'});
 e.querySelector('.pbody').scrollTop=0;closePanel.cb=o.onclose||null}
/* ---------- home ---------- */
let G={};
function home(){clearInterval(G.tm);clearTimeout(G.nx);closePanel();
 A.innerHTML=`<header class="hd"><svg class="rose" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29"/><path d="M32 4 38 32 32 60 26 32Z"/><path d="M4 32 32 26 60 32 32 38Z" class="b"/><circle cx="32" cy="32" r="4"/></svg><div><h1>لعبة خرائط العالم</h1><p>اعرف الدول بشكلها وموقعها وعلمها وعاصمتها</p></div></header>
 <div class="hub"><div class="infos"><button class="hb h1" id="gd"><i>📖</i><b>دليل الدول</b><small>معلومات كل دولة وخرائطها</small></button><button class="hb h2" id="wm"><i>🌐</i><b>خريطة العالم</b><small>الكرة الأرضية والخريطة المسطحة</small></button><button class="hb h3" id="tb"><i>📊</i><b>جدول الدول</b><small>كل الدول في جدول قابل للترتيب</small></button></div>
 <button class="qbig" id="qz"><i>🎯</i><span><b>الأسئلة</b><small>اختبر معلوماتك بسبعة أنواع من الأسئلة</small></span></button><div class="ver">النسخة ${VER}</div></div>`;
 $('#gd').onclick=()=>dir();$('#wm').onclick=explore;$('#qz').onclick=quizPage;$('#tb').onclick=()=>{location.href='countries.html'}}
function quizPage(){clearInterval(G.tm);clearTimeout(G.nx);closePanel();const chip=(k,v,on)=>`<button data-k="${k}" data-v="${v}" class="${on?'on':''}">${k==='conts'?CN[v]:v+(k==='time'?' ث':'')}</button>`;
 A.innerHTML=`<div class="bar2"><button id="bk">› رجوع</button><h2 class="qt">🎯 الأسئلة</h2></div><div class="home"><aside>
 <h3>⏱️ وقت كل سؤال</h3><div class="chips">${[10,15,20,30,45,60].map(v=>chip('time',v,S.time==v)).join('')}</div>
 <h3>🔢 عدد الأسئلة</h3><div class="chips">${[10,20,30,50,100,150,195].map(v=>chip('count',v,S.count==v)).join('')}</div>
 <h3>🧭 القارات</h3><div class="chips">${Object.keys(CN).map(v=>chip('conts',v,S.conts.includes(v))).join('')}</div></aside>
 <div class="main"><details class="how" ${innerWidth>820?'open':''}><summary>طريقة اللعب</summary> اختر الوقت وعدد الأسئلة والقارات، ثم نوع الأسئلة. الإجابة الأسرع تكسب نقاطًا أكثر، والإجابات المتتالية الصحيحة تضيف مكافأة سلسلة. الكتابة تقبل الأسماء البديلة والإجابة المقاربة. في «حدّد الدولة» أدِر الكرة الأرضية بإصبعك، كبّر واضغط الدولة ثم «تأكيد».</details>
 <div class="modes">${MODES.map((m,i)=>`<button data-m="${m[0]}"><em>${i+1}</em><i>${m[2]}</i>${m[1]}</button>`).join('')}</div></div></div>`;
 $('#bk').onclick=home;
 A.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{const k=b.dataset.k,v=k==='conts'?b.dataset.v:+b.dataset.v;
  if(k==='conts'){S.conts=S.conts.includes(v)?S.conts.filter(x=>x!==v):[...S.conts,v];if(!S.conts.length)S.conts=[v]}else S[k]=v;save();quizPage()});
 A.querySelectorAll('.modes [data-m]').forEach(b=>b.onclick=()=>start(b.dataset.m))}
/* ---------- game ---------- */
function start(m){const mp=['en','ar','shape'].includes(m);let pool=D.filter(c=>S.conts.includes(c.co)&&c.f);
 G={mode:m,qs:pick(pool,Math.min(S.count,pool.length),mp?c=>Math.min(1,Math.max(.1,Math.sqrt(c.sr)/.02)):()=>1),i:0,score:0,miss:[],log:[],pts:0,streak:0,best:0,found:[]};ask()}
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
 A.innerHTML=`<div class="qh"><b>${G.i+1} / ${G.qs.length}</b><span class="sc">⭐ ${G.pts}<i></i>🔥 ${G.streak}</span><button class="x" id="qx">✕</button><span id="tm">${S.time}</span></div><div class="pb"><i id="pb"></i></div><div class="stage">${b}</div>`;
 $('#qx').onclick=()=>confirm('إنهاء اللعبة؟')&&quizPage();
 if(m==='tap'){const mv=G.mv=mkMap($('#mb .svgw'),{kind:'world',marks:true,found:G.found,pick:cc=>{if(G.lock)return;G.pick=cc;mv.setSel(cc.n,'sel');$('#go').disabled=false}});wireBtns(A,mv,false);
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
 let pts=0;if(ok){const left=Math.max(0,(G.end-Date.now())/1000);pts=(why==='fuzzy'?80:100)+Math.round(left/S.time*100)+Math.min(G.streak,5)*20;G.streak++;G.best=Math.max(G.best,G.streak);G.pts+=pts;if(m==='tap')G.found.push(c)}else G.streak=0;
 const mine=m==='tap'?(G.pick?G.pick.ar:''):G.sel!=null&&G.o?G.o[G.sel].t:(typed||G.last||'');G.log.push({c,ok,mine,why,pts});
 if(G.o)A.querySelectorAll('.opts button').forEach((e,i)=>{if(G.o[i].ok)e.classList.add('good');else if(i===G.sel)e.classList.add('bad')});
 if(m==='tap'&&G.mv){if(!ok&&G.pick)G.mv.setSel(G.pick.n,'bad');G.mv.setSel(c.n,'good',!ok&&!!G.pick);G.mv.focus(c,600)}
 const sc=$('.qh .sc');if(sc)sc.innerHTML=`⭐ ${G.pts}<i></i>🔥 ${G.streak}`;
 const d=document.createElement('div');d.className='fb '+(ok?'ok':'no')+(m==='tap'?' sheet':'');
 d.innerHTML=`<div class="card"><div class="st">${ok?(why==='fuzzy'?'✅ إجابة مقبولة':'✅ إجابة صحيحة'):why==='time'?'⏰ انتهى الوقت':why==='skip'?'⏭️ تم التخطي':'❌ إجابة خاطئة'}</div>${ok?`<div class="ptx">+${pts} نقطة${G.streak>1?` · 🔥 سلسلة ${G.streak}`:''}</div>`:''}${flag(c)}<div class="nm">${c.ar}</div><div class="nm2" dir="ltr">${c.en}</div>${LBL[m]?`<div class="an">${LBL[m]} الصحيحة: <b>${ansOf(c,m)}</b></div>`:''}${why==='fuzzy'?`<div class="my" style="color:#9a6700">قُبلت إجابتك «${typed}» رغم اختلاف بسيط عن الاسم الصحيح</div>`:''}${!ok&&mine?`<div class="my">${m==='tap'?'اخترت':'إجابتك'}: ${mine}</div>`:''}<small>اضغط للمتابعة</small></div>`;A.appendChild(d);
 const nx=()=>{if(G.nx){clearTimeout(G.nx);G.nx=0;G.i++;ask()}};G.nx=setTimeout(nx,m==='tap'?(ok?3500:6000):ok?(why==='fuzzy'?3200:2000):3800);d.onclick=nx}
function result(){const n=G.qs.length,p=Math.round(G.score/n*100),m=G.mode;S.best=S.best||{};const old=S.best[m]||0,rec=G.pts>old;if(rec){S.best[m]=G.pts;save()}
 A.innerHTML=`<div class="res"><h1>${p>=80?'🏆':p>=50?'👏':'💪'} النتيجة: ${G.score} / ${n} (${p}%)</h1><div class="sums"><div><b>⭐ ${G.pts}</b><span>النقاط${rec?' — رقم قياسي جديد 🎉':old?` (أفضل سابق ${old})`:''}</span></div><div><b>🔥 ${G.best}</b><span>أطول سلسلة</span></div><div><b>✅ ${G.score}</b><span>صحيحة</span></div><div><b>❌ ${n-G.score}</b><span>خاطئة</span></div></div>
 <table><tr><th>#</th><th></th><th></th><th>الدولة</th><th>الإجابة الصحيحة</th><th>إجابتك</th><th>نقاط</th></tr>${G.log.map((r,i)=>`<tr class="${r.ok?'g':'b'}"><td>${i+1}</td><td>${r.ok?'✅':'❌'}</td><td>${flag(r.c)}</td><td>${r.c.ar}<br><small dir="ltr">${r.c.en}</small></td><td>${ansOf(r.c,m)}</td><td>${r.ok?(r.why==='fuzzy'?r.mine+' (≈)':''):r.mine||'لم تُجب'}</td><td>${r.pts||''}</td></tr>`).join('')}</table>
 <div class="chips" style="justify-content:center"><button class="go" id="ag">إعادة اللعب</button><button id="qp" style="font-size:22px">صفحة الأسئلة</button><button id="hm" style="font-size:22px">الرئيسية</button></div></div>`;
 $('#ag').onclick=()=>start(G.mode);$('#qp').onclick=quizPage;$('#hm').onclick=home}
/* ---------- guide ---------- */
function dir(v='n',q=''){closePanel();const L=D.filter(c=>!q||acc(c).has(norm(q))||norm(c.ar).includes(norm(q))||norm(c.en).includes(norm(q))).sort((a,b)=>a.ar.localeCompare(b.ar,'ar'));
 if(!$('#g')){A.innerHTML=`<div class="bar2"><button id="bk">› رجوع</button><input id="q" placeholder="بحث..." value="${q}"><div class="seg"><button data-v="n">أسماء</button><button data-v="m">خرائط</button></div></div><div class="grid" id="g"></div>`;
  $('#bk').onclick=home;$('#q').oninput=e=>dir(G.dv,e.target.value);A.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>dir(b.dataset.v,$('#q').value))}
 G.dv=v;A.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
 $('#g').innerHTML=L.map(c=>`<button class="tile" data-id="${c.id}">${v==='n'?flag(c):thumb(c)}<b>${c.ar}</b><small>${c.en}</small></button>`).join('');
 $('#g').querySelectorAll('.tile').forEach(b=>b.onclick=()=>detail(byId[b.dataset.id]))}
async function showFx(c){const el=$('#fx');if(!el)return;const d=await getFx(c);if($('#fx')!==el)return;
 el.innerHTML=d?`<h3>⭐ أشهر ما في ${c.ar}</h3><ul>${d.info.map(x=>`<li>${x}</li>`).join('')}</ul><p><b>سبب التسمية:</b> ${d.name}</p><p><b>الاستقلال:</b> ${d.ind}</p>`:'<p class="mut">المعلومات المختصرة وسبب التسمية وتاريخ الاستقلال: قيد الإضافة.</p>'}
function detail(c){let e=$('#dt');if(!e){e=document.createElement('div');e.id='dt';document.body.appendChild(e)}
 const nb=c.nb.map(i=>byId[i]);
 e.innerHTML=`<div class="bar2"><button id="cl">✕ إغلاق</button><h2 style="margin:0">${c.ar} — <span dir="ltr">${c.en}</span></h2></div><div class="dg">
 <div style="text-align:center">${flag(c,'flagbig')}</div>
 <div class="stats">${statCards(c)}</div>
 <div style="grid-column:1/-1"><b>الدول المجاورة:</b> ${nb.length?nb.map(x=>`<button class="nb" data-id="${x.id}">${x.ar}</button>`).join(''):'لا توجد حدود برية'}</div>
 ${c.f?`<div class="dmap" style="${SMALL.has(c.id)?'grid-column:1/-1':''}">${mapBox()}</div>${SMALL.has(c.id)?'':`<div class="dshape">${staticSvg(c,'shape',0)}</div>`}`:''}
 <div id="fx" style="grid-column:1/-1"></div></div>`;
 $('#cl').onclick=()=>e.remove();showFx(c);e.querySelectorAll('.nb').forEach(b=>b.onclick=()=>{detail(byId[b.dataset.id]);e.scrollTop=0});
 if(c.f){const mv=mkMap(e.querySelector('#mb .svgw'),{kind:'ctx',c,ring:true});mv.setSel(c.n,'t');wireBtns(e,mv,true)}}
/* ---------- world explorer ---------- */
function explore(){clearInterval(G.tm);closePanel();A.innerHTML=`<div class="bar2"><button id="bk">› رجوع</button><input id="q" placeholder="ابحث عن دولة واضغط Enter"><div class="seg"><button id="mf" style="display:none">🗺️</button><button id="zi">＋</button><button id="zo">－</button><button id="zr">⟲</button></div></div><div class="mapbox ex" id="mb"><div class="svgw"></div></div>`;
 $('#bk').onclick=()=>{closePanel();home()};let mv;
 let cur=null;const insetOf=()=>{const p=$('#pn');if(!p||p.classList.contains('dock'))return 0;const r=p.getBoundingClientRect(),h=$('#mb').getBoundingClientRect();return Math.max(0,Math.min(h.height*.7,h.bottom-r.top))};
 const show=(c,fcs)=>{cur=c;mv.setSel(c.n,'sel');openPanel(c,{dock:true,go:n=>show(n,true),onclose:()=>{cur=null;mv.inset(0);mv.setSel(null)}});mv.inset(insetOf());if(fcs)mv.focus(c)};
 mv=mkMap($('#mb .svgw'),{kind:'world',marks:true,pick:c=>show(c,false),onresize:()=>{if($('#pn')&&cur){mv.inset(insetOf());mv.focus(cur,0)}}});
 wireBtns(A,mv,false);
 $('#q').onkeydown=k=>{if(k.key!=='Enter')return;const v=norm(k.target.value);if(!v)return;k.target.blur();
  const c=D.find(x=>acc(x).has(v))||D.find(x=>[...acc(x)].some(y=>y.startsWith(v)))||D.find(x=>[...acc(x)].some(y=>y.includes(v)))||D.find(x=>fuzzy(x,k.target.value));
  if(c&&c.f)show(c,true);else k.target.classList.add('shake')}}
const vv=window.visualViewport,rs=document.documentElement.style;
let fT=0;const fit=()=>{const w=Math.round(vv?vv.width:innerWidth),h=Math.round(vv?vv.height:innerHeight);rs.setProperty('--w',w+'px');rs.setProperty('--h',h+'px');scrollTo(0,0);clearTimeout(fT);fT=setTimeout(()=>{fitPanel();const m=window.__onfit;m&&m()},60)};
if(vv){vv.addEventListener('resize',fit)}addEventListener('resize',fit);
addEventListener('orientationchange',()=>[50,250,600,1200].forEach(t=>setTimeout(fit,t)));fit();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
window.__wm={D,F,byId,SMALL,MK,openPanel,closePanel,get G(){return G},fuzzy,norm,acc,go(m,id){start(m);G.qs[0]=byId[id];ask()},detail,explore,dir};
home()})();
