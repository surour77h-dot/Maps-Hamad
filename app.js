(async()=>{
const $=s=>document.querySelector(s),A=$('#app'),W=900,H=560;
const [D,T]=await Promise.all([fetch('data.json').then(r=>r.json()),fetch('world.json').then(r=>r.json())]);
const F=topojson.feature(T,T.objects.countries).features.filter(f=>f.id!=='010');
const byN={},byId={};F.forEach(f=>byN[f.id]=f);
function main(f){const g=f.geometry;if(g.type!=='MultiPolygon')return f;const ps=g.coordinates.map(c=>({type:'Polygon',coordinates:c})),ar=ps.map(d3.geoArea),m=Math.max(...ar);
 return{type:'Feature',geometry:{type:'GeometryCollection',geometries:ps.filter((_,i)=>ar[i]>=m*.3)}}}
D.forEach(c=>{byId[c.id]=c;if(!c.cur.length)c.cur=[{k:'USD',ar:'دولار أمريكي'}];c.f=byN[c.n];if(c.f){c.main=main(c.f);c.sr=d3.geoArea(c.f);c.ct=d3.geoCentroid(c.main)}});
const CN={AF:'أفريقيا',AS:'آسيا',EU:'أوروبا',NA:'أمريكا الشمالية',SA:'أمريكا الجنوبية',OC:'أوقيانوسيا'};
const MODES=[['en','الدولة بالإنجليزية','🌍'],['ar','الدولة بالعربية','🗺️'],['shape','شكل الخريطة','🔷'],['cap','عاصمة الدولة','🏛️'],['flag','علم الدولة','🏳️'],['cur','عملة الدولة','💰']];
let S=Object.assign({time:20,count:10,conts:Object.keys(CN)},JSON.parse(localStorage.wm||'{}'));
const save=()=>localStorage.wm=JSON.stringify(S);
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]/gu,'').replace(/^the(?=.{4})/,'').replace(/^ال(?=.{3})/,'');
const AL={cz:'Czech Republic',sz:'Swaziland',mm:'Burma',mk:'Macedonia',tl:'East Timor',tr:'Turkiye',ci:'Ivory Coast',cg:'Congo Republic',cd:'DR Congo,DRC',us:'USA,America',gb:'UK,Britain',ae:'UAE',va:'Vatican',kr:'South Korea',kp:'North Korea',cv:'Cape Verde',ps:'Palestinian Territories',mm2:''};
const acc=c=>c._a||(c._a=new Set([c.en,c.ar,...c.alt,...(AL[c.a]||'').split(',')].filter(Boolean).flatMap(x=>{const n=norm(x);return n.startsWith('saint')?[n,'st'+n.slice(5)]:[n]})));
const strip=s=>s.split(' ')[0],shuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
const flag=(c,cl='')=>`<img class="${cl}" src="flags/${c.a}.svg" alt="">`;
function pick(pool,n,w){const r=[],p=[...pool];while(r.length<n&&p.length){let x=Math.random()*p.reduce((s,c)=>s+w(c),0),i=0;for(;i<p.length-1;i++){x-=w(p[i]);if(x<0)break}r.push(p.splice(i,1)[0])}return r}
function mapSvg(c,kind){const p=d3.geoNaturalEarth1();
 if(kind==='shape')p.fitExtent([[14,14],[W-14,H-14]],{type:'FeatureCollection',features:[c.main]});
 else{let l=c.nb.map(i=>byId[i]).filter(x=>x&&x.f);
  if(l.length<2)l=D.filter(x=>x.f&&x!==c).sort((a,b)=>d3.geoDistance(c.ct,a.ct)-d3.geoDistance(c.ct,b.ct)).slice(0,3);
  p.fitExtent([[14,14],[W-14,H-14]],{type:'FeatureCollection',features:[c.main,...l.map(x=>x.main),{type:'Feature',geometry:d3.geoCircle().center(c.ct).radius(7)()}]})}
 p.clipExtent([[0,0],[W,H]]);const g=d3.geoPath(p);let s=`<svg viewBox="0 0 ${W} ${H}" class="map">`;
 if(kind==='shape')s+=`<path class="t" d="${g(c.f)}"/>`;else F.forEach(f=>{const d=g(f);if(d)s+=`<path class="${f.id===c.n?'t':'o'}" d="${d}"/>`});
 return s+'</svg>'}
const thumbs={};function thumb(c){if(!c.f)return flag(c);return thumbs[c.id]||(thumbs[c.id]=(()=>{const p=d3.geoNaturalEarth1().fitExtent([[4,4],[96,96]],{type:'FeatureCollection',features:[c.main]});return`<svg viewBox="0 0 100 100"><path class="t" d="${d3.geoPath(p)(c.f)}"/></svg>`})())}
/* ---------- home ---------- */
function home(){clearInterval(G.tm);const chip=(k,v,on)=>`<button data-k="${k}" data-v="${v}" class="${on?'on':''}">${k==='conts'?CN[v]:v+(k==='time'?' ث':'')}</button>`;
 A.innerHTML=`<h1>🌍 لعبة خرائط العالم</h1><div class="home"><aside>
 <h3>⏱️ وقت كل سؤال</h3><div class="chips">${[10,15,20,30,45,60].map(v=>chip('time',v,S.time==v)).join('')}</div>
 <h3>🔢 عدد الأسئلة</h3><div class="chips">${[10,20,30,50,100].map(v=>chip('count',v,S.count==v)).join('')}</div>
 <h3>🧭 القارات</h3><div class="chips">${Object.keys(CN).map(v=>chip('conts',v,S.conts.includes(v))).join('')}</div></aside>
 <div class="main"><details class="how" ${innerWidth>820?'open':''}><summary>طريقة اللعب</summary> اختر الوقت وعدد الأسئلة والقارات من الجانب، ثم اضغط على نوع الأسئلة. أجب قبل انتهاء العداد؛ الكتابة تقبل الأسماء البديلة، والاختيارات تحتاج زر تأكيد.</details>
 <div class="modes">${MODES.map(m=>`<button data-m="${m[0]}"><i>${m[2]}</i>${m[1]}</button>`).join('')}<button class="guide" id="gd" style="grid-column:span 2"><i>📖</i>دليل الدول</button></div></div></div>`;
 A.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{const k=b.dataset.k,v=k==='conts'?b.dataset.v:+b.dataset.v;
  if(k==='conts'){S.conts=S.conts.includes(v)?S.conts.filter(x=>x!==v):[...S.conts,v];if(!S.conts.length)S.conts=[v]}else S[k]=v;save();home()});
 A.querySelectorAll('.modes [data-m]').forEach(b=>b.onclick=()=>start(b.dataset.m));$('#gd').onclick=dir}
/* ---------- game ---------- */
let G={};
function start(m){const mp=['en','ar','shape'].includes(m);let pool=D.filter(c=>S.conts.includes(c.co)&&(!mp||c.f));
 G={mode:m,qs:pick(pool,Math.min(S.count,pool.length),mp?c=>Math.min(1,Math.max(.1,Math.sqrt(c.sr)/.02)):()=>1),i:0,score:0,miss:[]};ask()}
function ask(){clearInterval(G.tm);if(G.i>=G.qs.length)return result();const c=G.c=G.qs[G.i],m=G.mode;G.lock=false;G.sel=null;
 const inp=(ph,d)=>`<input dir="${d}" placeholder="${ph}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">`;
 let b='';
 if(m==='en'||m==='ar'||m==='shape'||m==='flag'){
  b=(m==='flag'?flag(c,'flagbig'):`<div class="mapbox">${mapSvg(c,m==='shape'?'shape':'ctx')}</div>`)+
   `<div class="in">${m==='en'?inp('Country name in English','ltr'):m==='ar'?inp('اسم الدولة بالعربية','rtl'):inp('English','ltr')+inp('عربي','rtl')}<button id="sk">تخطي</button></div>`}
 else{let o;if(m==='cap'){const t=shuf(D).filter(x=>x.cap&&x.cap!==c.cap);o=[{t:c.cap,ok:1},...[...new Map(t.map(x=>[x.cap,x])).values()].slice(0,5).map(x=>({t:x.cap}))]}
  else{const ok=new Set(c.cur.map(x=>strip(x.ar))),seen=new Set(ok);o=[{t:strip(c.cur[0].ar),ok:1}];shuf(D).forEach(x=>{const t=strip(x.cur[0].ar);if(o.length<6&&!seen.has(t)){seen.add(t);o.push({t})}})}
  G.o=shuf(o);b=`<h1 class="big">${c.ar}</h1><p class="sub">${c.en}</p><div class="opts">${G.o.map((x,i)=>`<button data-i="${i}">${x.t}</button>`).join('')}</div><button class="go" id="go" disabled>تأكيد</button>`}
 A.innerHTML=`<div class="qh"><b>${G.i+1} / ${G.qs.length}</b><button class="x" id="qx">✕</button><span id="tm">${S.time}</span></div><div class="pb"><i id="pb"></i></div><div class="stage">${b}</div>`;
 $('#qx').onclick=()=>confirm('إنهاء اللعبة؟')&&home();
 A.querySelectorAll('.in input').forEach(e=>{e.oninput=()=>{const v=norm(e.value);if(v&&acc(c).has(v))done(true)};e.onkeydown=k=>{if(k.key==='Enter'){e.blur();if(!acc(c).has(norm(e.value))){e.classList.remove('shake');void e.offsetWidth;e.classList.add('shake')}}}});
 if($('#sk'))$('#sk').onclick=()=>done(false,'skip');
 A.querySelectorAll('.opts button').forEach(e=>e.onclick=()=>{if(G.lock)return;A.querySelectorAll('.opts button').forEach(x=>x.classList.remove('sel'));e.classList.add('sel');G.sel=+e.dataset.i;$('#go').disabled=false});
 if($('#go'))$('#go').onclick=()=>{if(G.sel!=null)done(!!G.o[G.sel].ok)};
 G.end=Date.now()+S.time*1000;G.tm=setInterval(()=>{const l=Math.max(0,(G.end-Date.now())/1000);$('#tm').textContent=Math.ceil(l);$('#tm').classList.toggle('low',l<=5);$('#pb').style.width=l/S.time*100+'%';if(l<=0)done(false,'time')},100)}
function done(ok,why){if(G.lock)return;G.lock=true;clearInterval(G.tm);const c=G.c;ok?G.score++:G.miss.push(c);
 if(G.o)A.querySelectorAll('.opts button').forEach((e,i)=>{if(G.o[i].ok)e.classList.add('good');else if(i===G.sel)e.classList.add('bad')});
 const d=document.createElement('div');d.className='fb '+(ok?'ok':'no');
 d.innerHTML=`<div>${ok?'✅ إجابة صحيحة':why==='time'?'⏰ انتهى الوقت':why==='skip'?'⏭️ تم التخطي':'❌ إجابة خاطئة'}</div>${flag(c)}<div>${c.ar} — ${c.en}</div><div style="font-size:22px">${c.cap}</div>`;A.appendChild(d);
 setTimeout(()=>{G.i++;ask()},ok?1200:2600)}
function result(){const n=G.qs.length,p=Math.round(G.score/n*100);
 A.innerHTML=`<div class="res"><h1>${p>=80?'🏆':p>=50?'👏':'💪'} النتيجة: ${G.score} / ${n} (${p}%)</h1>
 ${G.miss.length?`<h2>الأخطاء</h2><table>${G.miss.map(c=>`<tr><td>${flag(c)}</td><td>${c.ar}</td><td dir="ltr">${c.en}</td><td>${c.cap}</td></tr>`).join('')}</table>`:'<h2>بدون أخطاء! 🎉</h2>'}
 <div class="chips" style="justify-content:center"><button class="go" id="ag">إعادة اللعب</button><button id="hm" style="font-size:22px">الرئيسية</button></div></div>`;
 $('#ag').onclick=()=>start(G.mode);$('#hm').onclick=home}
/* ---------- guide ---------- */
function dir(v='n',q=''){const L=D.filter(c=>!q||acc(c).has(norm(q))||norm(c.ar).includes(norm(q))||norm(c.en).includes(norm(q))).sort((a,b)=>a.ar.localeCompare(b.ar,'ar'));
 if(!$('#g')){A.innerHTML=`<div class="bar2"><button id="bk">› رجوع</button><input id="q" placeholder="بحث..." value="${q}"><div class="seg"><button data-v="n">أسماء</button><button data-v="m">خرائط</button></div></div><div class="grid" id="g"></div>`;
  $('#bk').onclick=home;$('#q').oninput=e=>dir(G.dv,e.target.value);A.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>dir(b.dataset.v,$('#q').value))}
 G.dv=v;A.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
 $('#g').innerHTML=L.map(c=>`<button class="tile" data-id="${c.id}">${v==='n'?flag(c)+`<b>${c.ar}</b><small>${c.en}</small>`:thumb(c)}</button>`).join('');
 $('#g').querySelectorAll('.tile').forEach(b=>b.onclick=()=>detail(byId[b.dataset.id]))}
function detail(c){let e=$('#dt');if(!e){e=document.createElement('div');e.id='dt';document.body.appendChild(e)}
 const nb=c.nb.map(i=>byId[i]);
 e.innerHTML=`<div class="bar2"><button id="cl">✕ إغلاق</button><h2 style="margin:0">${c.ar} — <span dir="ltr">${c.en}</span></h2></div><div class="dg">
 <div style="text-align:center">${flag(c,'flagbig')}</div>
 <div class="kv"><b>بالعربية</b><span>${c.ar}</span><b>بالإنجليزية</b><span dir="ltr">${c.en}</span><b>العاصمة</b><span dir="ltr">${c.cap}</span><b>القارة</b><span>${CN[c.co]}</span>
 <b>العملة</b><span>${c.cur.map(x=>x.ar+' ('+x.k+')').join('، ')}</span><b>المساحة</b><span>${c.area.toLocaleString('en')} كم²</span>
 <b>اللغات</b><span dir="ltr">${c.lang.join(', ')}</span><b>رمز الاتصال</b><span dir="ltr">${c.idd}</span><b>الموقع</b><span>${c.ll?'دولة غير ساحلية':'لها منفذ بحري'}</span></div>
 <div style="grid-column:1/-1"><b>الدول المجاورة:</b> ${nb.length?nb.map(x=>`<button class="nb" data-id="${x.id}">${x.ar}</button>`).join(''):'لا توجد حدود برية'}</div>
 ${c.f?`<div>${mapSvg(c,'ctx')}</div><div>${mapSvg(c,'shape')}</div>`:''}
 <div style="grid-column:1/-1;color:#9db4cc">المعلومات المختصرة وسبب التسمية: تُضاف في المرحلة التالية.</div></div>`;
 $('#cl').onclick=()=>e.remove();e.querySelectorAll('.nb').forEach(b=>b.onclick=()=>{detail(byId[b.dataset.id]);e.scrollTop=0})}
const vv=window.visualViewport,fit=()=>{document.documentElement.style.setProperty('--h',(vv?vv.height:innerHeight)+'px');scrollTo(0,0)};
if(vv){vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)}addEventListener('orientationchange',()=>setTimeout(fit,300));fit();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
home()})();
