(async()=>{
const A=document.getElementById('app'),H=document.documentElement;
const CO={AF:['أفريقيا','Africa'],AS:['آسيا','Asia'],EU:['أوروبا','Europe'],NA:['أمريكا الشمالية','North America'],SA:['أمريكا الجنوبية','South America'],OC:['أوقيانوسيا','Oceania']};
const T={ar:{title:'جدول الدول',back:'› رجوع',search:'ابحث بالاسم أو العاصمة أو الكود أو العملة...',cnt:n=>n+' دولة',none:'لا توجد نتائج',
 h:{name:'الدولة',flag:'العلم',cap:'العاصمة',code:'الكود',cur:'العملة',co:'القارة',area:'المساحة',pop:'السكان'},u:{area:'كم²'}},
 en:{title:'Countries Table',back:'‹ Back',search:'Search by name, capital, code or currency...',cnt:n=>n+' countries',none:'No results',
 h:{name:'Country',flag:'Flag',cap:'Capital',code:'Code',cur:'Currency',co:'Continent',area:'Area',pop:'Pop.'},u:{area:'km²'}}};
let lang='ar';try{lang=localStorage.wmLang==='en'?'en':'ar'}catch(_){}
let D;try{D=await(await fetch('data.json')).json()}catch(e){A.textContent='تعذّر تحميل البيانات / Could not load data';return}
const cEn=new Intl.DisplayNames('en',{type:'currency'}),nf=new Intl.NumberFormat('en');
const curEn=c=>c.cur.map(x=>{try{return cEn.of(x.k)}catch(_){return x.k}}).join(', ');
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[ً-ٰٟ̀-ͯ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[^a-z0-9؀-ۿ ]/g,'');
const R=D.map(c=>({c,hay:norm([c.ar,c.en,c.capAr,c.cap,c.a,c.id,c.cur.map(x=>x.ar+' '+x.k).join(' '),curEn(c),CO[c.co][0],CO[c.co][1]].join(' '))}));
const V={ // sort/display value per column, per language
 name:(c,l)=>l==='ar'?c.ar:c.en, flag:(c,l)=>l==='ar'?c.ar:c.en,
 cap:(c,l)=>l==='ar'?c.capAr:c.cap, code:c=>c.a.toUpperCase(),
 cur:(c,l)=>l==='ar'?c.cur.map(x=>x.ar).join('، '):curEn(c), co:(c,l)=>CO[c.co][l==='ar'?0:1],
 area:c=>c.area||null, pop:c=>c.pop||null};
const COLS=['name','flag','cap','cur','area','co','pop','code'];
let q='',sk=null,sd=1;
const cell={
 name:(c,l)=>{const a=l==='ar'?c.ar:c.en,b=l==='ar'?c.en:c.ar;return`<b>${a}</b><small dir="${l==='ar'?'ltr':'rtl'}">${b}</small>`},
 flag:c=>`<img src="flags/${c.a}.svg" alt="" loading="lazy">`,
 cap:(c,l)=>{const a=l==='ar'?c.capAr:c.cap,b=l==='ar'?c.cap:c.capAr;return`<b>${a}</b><small>${b}</small>`},
 code:c=>`<span class="cd">${c.a.toUpperCase()}<small>${c.id}</small></span>`,
 cur:(c,l)=>`<b>${V.cur(c,l)}</b><small>${c.cur.map(x=>x.k).join(' · ')}</small>`,
 co:(c,l)=>V.co(c,l),
 area:c=>c.area?nf.format(c.area):'—', pop:c=>c.pop?nf.format(c.pop):'—'};
function sorted(rows){const col=new Intl.Collator(lang==='ar'?'ar':'en',{numeric:true,sensitivity:'base'});
 const key=sk&&sk!=='flag'?sk:sk==='flag'?'name':'name',val=r=>V[key](r.c,lang);
 return rows.slice().sort((a,b)=>{const x=val(a),y=val(b);
  if(!sk)return col.compare(V.name(a.c,lang),V.name(b.c,lang));
  if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return-1;
  const r=typeof x==='number'?x-y:col.compare(String(x),String(y));return r*sd||col.compare(V.name(a.c,lang),V.name(b.c,lang))})}
function lockScroll(w){const adj=()=>{const mh=w.scrollHeight-w.clientHeight,mw=w.scrollWidth-w.clientWidth,rtl=getComputedStyle(w).direction==='rtl';
  if(mh>2){if(w.scrollTop<=0)w.scrollTop=1;else if(w.scrollTop>=mh)w.scrollTop=mh-1}
  if(mw>2){const lo=rtl?-mw:0,hi=rtl?0:mw;if(w.scrollLeft<=lo)w.scrollLeft=lo+1;else if(w.scrollLeft>=hi)w.scrollLeft=hi-1}};
 w.addEventListener('touchstart',adj,{passive:true})}
function draw(){const t=T[lang];H.lang=lang;H.dir=lang==='ar'?'rtl':'ltr';document.title=t.title;
 const nq=norm(q),rows=sorted(R.filter(r=>!nq||r.hay.includes(nq)));
 if(!A.querySelector('.tbar')){A.innerHTML=`<div class="bar2 tbar"><button id="bk"></button><h2 class="qt" id="tt"></h2><input id="q" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div><div class="tinfo" id="ti"></div><div class="tbw"><table class="ct"><thead><tr id="hr"></tr></thead><tbody id="tb"></tbody></table><p class="mut none" id="nn"></p></div>`;
  A.querySelector('#bk').onclick=()=>{location.href='index.html'};
  A.querySelector('#q').oninput=e=>{q=e.target.value;draw()};
  lockScroll(A.querySelector('.tbw'))}
 A.querySelector('#bk').textContent=t.back;A.querySelector('#tt').textContent='📊 '+t.title;A.querySelector('#q').placeholder=t.search;
 A.querySelector('#ti').textContent=t.cnt(rows.length);A.querySelector('#nn').textContent=rows.length?'':t.none;
 A.querySelector('#hr').innerHTML=COLS.map(k=>`<th data-k="${k}" class="${sk===k?'on':''}">${t.h[k]}${t.u[k]?`<small>${t.u[k]}</small>`:''}</th>`).join('');
 A.querySelectorAll('#hr th').forEach(h=>h.onclick=()=>{const k=h.dataset.k;if(sk!==k){sk=k;sd=1}else if(sd>0)sd=-1;else{sk=null;sd=1}draw()});
 A.querySelector('#tb').innerHTML=rows.map(r=>`<tr>${COLS.map(k=>`<td class="c-${k}">${cell[k](r.c,lang)}</td>`).join('')}</tr>`).join('')}
draw();
const vv=window.visualViewport,fit=()=>{H.style.setProperty('--h',Math.round(vv?vv.height:innerHeight)+'px');scrollTo(0,0)};
if(vv)vv.addEventListener('resize',fit);addEventListener('resize',fit);addEventListener('orientationchange',()=>[50,300,800].forEach(t=>setTimeout(fit,t)));fit();
['gesturestart','gesturechange','gestureend'].forEach(e=>document.addEventListener(e,ev=>ev.preventDefault(),{passive:false}));
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
})();
