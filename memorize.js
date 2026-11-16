/* دفتر الحفظ — study list: mark the countries you have memorised (v21) */
(async()=>{
const A=document.getElementById('app'),H=document.documentElement;
const CO={AF:['أفريقيا','Africa'],AS:['آسيا','Asia'],EU:['أوروبا','Europe'],NA:['أمريكا الشمالية','North America'],SA:['أمريكا الجنوبية','South America'],OC:['أوقيانوسيا','Oceania']};
const T={
 ar:{title:'دفتر الحفظ',back:'› رجوع',search:'ابحث بالاسم أو العاصمة أو العملة...',none:'لا توجد نتائج',
  fAll:'الكل',fTodo:'لم أحفظها',fDone:'حفظتها',allCo:'كل القارات',
  prog:(a,b)=>`حفظت <b>${a}</b> من ${b}`,progCo:(n,a,b)=>`${n}: ${a} من ${b}`,shown:n=>`المعروض ${n}`,
  review:'وضع المراجعة',reviewOn:'إنهاء المراجعة',reviewHint:'المراجعة: الأعمدة مخفية، اضغط أي خانة لإظهارها ثم ضع ✓ على ما تعرفه.',
  exp:'نسخ تقدّمي',imp:'استيراد',
  h:{chk:'✓',name:'الدولة',cap:'العاصمة',flag:'العلم',shape:'الشكل',nb:'الدول المجاورة',cur:'العملة',area:'المساحة'},u:{area:'كم²'},
  island:'لا حدود برية',
  expT:'نسخ تقدّمي',expP:n=>`هذا الرمز يحمل ${n} دولة محفوظة. انسخه والصقه في «استيراد» على الجهاز الآخر.`,copy:'نسخ',copied:'تم النسخ ✓',share:'مشاركة',close:'إغلاق',
  impT:'استيراد التقدّم',impP:'الصق رمز التقدّم المنسوخ من الجهاز الآخر:',impPh:'WM1-...',bad:'الرمز غير صحيح، تأكد أنك نسخته كاملاً.',
  impQ:(a,b)=>`الرمز يحمل ${b} دولة محفوظة، وعندك الآن ${a}.`,replace:'استبدال تقدّمي',merge:'دمج مع تقدّمي',done:n=>`تم ✓ — المحفوظ الآن ${n} دولة`},
 en:{title:'Study List',back:'‹ Back',search:'Search by name, capital or currency...',none:'No results',
  fAll:'All',fTodo:'To learn',fDone:'Learned',allCo:'All continents',
  prog:(a,b)=>`Learned <b>${a}</b> of ${b}`,progCo:(n,a,b)=>`${n}: ${a} of ${b}`,shown:n=>`Showing ${n}`,
  review:'Review mode',reviewOn:'End review',reviewHint:'Review: columns are hidden — tap any cell to reveal it, then tick what you know.',
  exp:'Copy progress',imp:'Import',
  h:{chk:'✓',name:'Country',cap:'Capital',flag:'Flag',shape:'Shape',nb:'Neighbours',cur:'Currency',area:'Area'},u:{area:'km²'},
  island:'No land borders',
  expT:'Copy my progress',expP:n=>`This code holds ${n} learned countries. Copy it and paste it into “Import” on your other device.`,copy:'Copy',copied:'Copied ✓',share:'Share',close:'Close',
  impT:'Import progress',impP:'Paste the progress code copied from your other device:',impPh:'WM1-...',bad:'Invalid code — make sure you copied all of it.',
  impQ:(a,b)=>`The code holds ${b} learned countries; you have ${a} now.`,replace:'Replace my progress',merge:'Merge with mine',done:n=>`Done ✓ — ${n} countries learned`}};
let lang='ar';try{lang=localStorage.wmLang==='en'?'en':'ar'}catch(_){}
let D,SH;
try{[D,SH]=await Promise.all([fetch('data.json').then(r=>r.json()),fetch('shapes.json').then(r=>r.json())])}catch(e){A.textContent='تعذّر تحميل البيانات / Could not load data';return}
/* same conventions as the game: FSM uses USD; Western Sahara is drawn with Morocco, so Morocco borders Mauritania */
const byId={};D.forEach(c=>{byId[c.id]=c;if(!c.cur.length)c.cur=[{k:'USD',ar:'دولار أمريكي'}]});
if(byId.MAR&&byId.MRT){if(!byId.MAR.nb.includes('MRT'))byId.MAR.nb.push('MRT');if(!byId.MRT.nb.includes('MAR'))byId.MRT.nb.push('MAR')}
const cEn=new Intl.DisplayNames('en',{type:'currency'}),nf=new Intl.NumberFormat('en');
const curEn=c=>c.cur.map(x=>{try{return cEn.of(x.k)}catch(_){return x.k}}).join(', ');
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[ً-ٰٟ̀-ͯ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[^a-z0-9؀-ۿ ]/g,'');
const hay={};D.forEach(c=>hay[c.id]=norm([c.ar,c.en,c.capAr,c.cap,c.a,c.id,c.cur.map(x=>x.ar+' '+x.k).join(' '),curEn(c),(c.alt||[]).join(' ')].join(' ')));
const nm=c=>lang==='ar'?c.ar:c.en;

/* ---------- saved state ---------- */
let M=new Set();try{M=new Set(JSON.parse(localStorage.wmMem||'[]').filter(id=>byId[id]))}catch(_){}
const saveM=()=>{try{localStorage.wmMem=JSON.stringify([...M])}catch(_){}};
let P={f:'all',co:'',sk:null,sd:1};try{Object.assign(P,JSON.parse(localStorage.wmMemUI||'{}'))}catch(_){}
const saveP=()=>{try{localStorage.wmMemUI=JSON.stringify(P)}catch(_){}};
let q='',rv=false;const shown=new Set();/* revealed cells in review mode: "ID:col" */

/* ---------- progress code: WM1- + base64url of a bitset over the alphabetical ISO3 list ---------- */
const IDS=D.map(c=>c.id).sort();
function enc(){const b=new Uint8Array(Math.ceil(IDS.length/8));IDS.forEach((id,i)=>{if(M.has(id))b[i>>3]|=1<<(i&7)});
 let s='';b.forEach(x=>s+=String.fromCharCode(x));return'WM1-'+btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function dec(code){const m=String(code||'').replace(/\s+/g,'').match(/WM1-([A-Za-z0-9_-]+)/);if(!m)return null;
 try{let t=m[1].replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';const s=atob(t);if(s.length!==Math.ceil(IDS.length/8))return null;
  const out=new Set();IDS.forEach((id,i)=>{if(s.charCodeAt(i>>3)&(1<<(i&7)))out.add(id)});return out}catch(_){return null}}

/* ---------- columns ---------- */
const COLS=['chk','name','cap','flag','shape','nb','cur','area'];
const V={chk:c=>M.has(c.id)?0:1,name:c=>nm(c),cap:c=>lang==='ar'?c.capAr:c.cap,flag:c=>nm(c),shape:c=>nm(c),
 nb:c=>c.nb.length,cur:c=>lang==='ar'?c.cur.map(x=>x.ar).join('، '):curEn(c),area:c=>c.area||null};
const flagImg=(c,cls='')=>`<img class="${cls}" src="flags/${c.a}.svg" alt="" loading="lazy">`;
const shapeSvg=c=>`<svg viewBox="0 0 480 320" class="mshp"><path d="${SH[c.id]||''}"/></svg>`;
const cell={
 chk:c=>`<button class="mk" aria-label="✓">✓</button>`,
 name:c=>{const a=nm(c),b=lang==='ar'?c.en:c.ar;return`<b>${a}</b><small dir="${lang==='ar'?'ltr':'rtl'}">${b}</small>`},
 cap:c=>{const a=lang==='ar'?c.capAr:c.cap,b=lang==='ar'?c.cap:c.capAr;return`<b>${a}</b><small>${b}</small>`},
 flag:c=>flagImg(c),
 shape:c=>shapeSvg(c),
 nb:c=>c.nb.length?`<div class="nbs">${c.nb.map(id=>byId[id]).filter(Boolean).sort((a,b)=>nm(a).localeCompare(nm(b),lang)).map(n=>`<button class="nbc${M.has(n.id)?' ok':''}" data-go="${n.id}">${flagImg(n)}<span>${nm(n)}</span></button>`).join('')}</div>`:`<span class="isl">🏝️ ${T[lang].island}</span>`,
 cur:c=>`<b>${V.cur(c)}</b><small>${c.cur.map(x=>x.k).join(' · ')}</small>`,
 area:c=>nf.format(c.area)};

function rows(){const nq=norm(q),col=new Intl.Collator(lang==='ar'?'ar':'en',{numeric:true,sensitivity:'base'});
 let r=D.filter(c=>(!nq||hay[c.id].includes(nq))&&(!P.co||c.co===P.co)&&(P.f==='all'||(P.f==='done')===M.has(c.id)));
 const k=P.sk,byName=(a,b)=>col.compare(nm(a),nm(b));
 return r.sort((a,b)=>{if(!k)return byName(a,b);const x=V[k](a),y=V[k](b);
  if(x==null&&y==null)return byName(a,b);if(x==null)return 1;if(y==null)return-1;
  const d=typeof x==='number'?x-y:col.compare(String(x),String(y));return d*P.sd||byName(a,b)})}

function lockScroll(w){const adj=()=>{const mh=w.scrollHeight-w.clientHeight,mw=w.scrollWidth-w.clientWidth,rtl=getComputedStyle(w).direction==='rtl';
  if(mh>2){if(w.scrollTop<=0)w.scrollTop=1;else if(w.scrollTop>=mh)w.scrollTop=mh-1}
  if(mw>2){const lo=rtl?-mw:0,hi=rtl?0:mw;if(w.scrollLeft<=lo)w.scrollLeft=lo+1;else if(w.scrollLeft>=hi)w.scrollLeft=hi-1}};
 w.addEventListener('touchstart',adj,{passive:true})}
const $=s=>A.querySelector(s);

function shell(){A.innerHTML=`<div class="bar2 tbar"><button id="bk"></button><h2 class="qt" id="tt"></h2><input id="q" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
 <div class="mtools"><div class="seg" id="fs"><button data-f="all"></button><button data-f="todo"></button><button data-f="done"></button></div>
 <select id="co"></select><button id="rv" class="tbtn"></button><span class="sp"></span><button id="ex" class="tbtn"></button><button id="im" class="tbtn"></button></div>
 <div class="mprog"><div class="mpt"><span id="pg"></span><span id="pc"></span><span id="ps"></span></div><div class="pb mpb"><i id="pb"></i></div></div>
 <p class="rvh" id="rh"></p>
 <div class="tbw" id="tw"><table class="ct mtb"><thead><tr id="hr"></tr></thead><tbody id="tb"></tbody></table><p class="mut none" id="nn"></p></div>`;
 $('#bk').onclick=()=>{location.href='index.html'};
 $('#q').oninput=e=>{q=e.target.value;body()};
 $('#fs').onclick=e=>{const b=e.target.closest('button');if(!b)return;P.f=b.dataset.f;saveP();body()};
 $('#co').onchange=e=>{P.co=e.target.value;saveP();body()};
 $('#rv').onclick=()=>{rv=!rv;shown.clear();A.classList.toggle('rv',rv);labels();body()};
 $('#ex').onclick=expDlg;$('#im').onclick=impDlg;
 $('#hr').onclick=e=>{const h=e.target.closest('th');if(!h)return;const k=h.dataset.k;if(P.sk!==k){P.sk=k;P.sd=1}else if(P.sd>0)P.sd=-1;else{P.sk=null;P.sd=1}saveP();head();body()};
 $('#tb').onclick=onTap;
 lockScroll($('#tw'))}

function labels(){const t=T[lang];H.lang=lang;H.dir=lang==='ar'?'rtl':'ltr';document.title=t.title;
 $('#bk').textContent=t.back;$('#tt').textContent='📝 '+t.title;$('#q').placeholder=t.search;
 $('#fs').querySelectorAll('button').forEach(b=>b.textContent={all:t.fAll,todo:t.fTodo,done:t.fDone}[b.dataset.f]);
 $('#co').innerHTML=`<option value="">🧭 ${t.allCo}</option>`+Object.keys(CO).map(k=>`<option value="${k}">${CO[k][lang==='ar'?0:1]}</option>`).join('');
 $('#rv').textContent=(rv?'✋ ':'🙈 ')+(rv?t.reviewOn:t.review);$('#rv').classList.toggle('on',rv);
 $('#ex').textContent='📤 '+t.exp;$('#im').textContent='📥 '+t.imp;$('#rh').textContent=rv?t.reviewHint:'';head()}

function head(){const t=T[lang];$('#hr').innerHTML=COLS.map(k=>`<th data-k="${k}" class="h-${k}${P.sk===k?' on':''}">${t.h[k]}${t.u[k]?`<small>${t.u[k]}</small>`:''}</th>`).join('')}

function prog(){const t=T[lang],n=D.length,a=D.filter(c=>M.has(c.id)).length;
 $('#pg').innerHTML=t.prog(a,n);$('#pb').style.width=(a/n*100)+'%';
 if(P.co){const cs=D.filter(c=>c.co===P.co);$('#pc').textContent=' · '+t.progCo(CO[P.co][lang==='ar'?0:1],cs.filter(c=>M.has(c.id)).length,cs.length)}else $('#pc').textContent='';
 $('#ps').textContent=' · '+t.shown($('#tb').children.length)}

function rowHtml(c){return`<tr data-id="${c.id}" class="${M.has(c.id)?'done':''}">${COLS.map(k=>{const hid=rv&&k!=='chk'&&k!=='name'&&!shown.has(c.id+':'+k);return`<td class="c-${k}${hid?' hz':''}" data-k="${k}">${cell[k](c)}</td>`}).join('')}</tr>`}

function body(){$('#fs').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.f===P.f));$('#co').value=P.co;
 const r=rows();$('#tb').innerHTML=r.map(rowHtml).join('');$('#nn').textContent=r.length?'':T[lang].none;prog()}

function toggle(tr){const id=tr.dataset.id,on=!M.has(id);if(on)M.add(id);else M.delete(id);saveM();
 tr.classList.toggle('done',on);A.querySelectorAll(`.nbc[data-go="${id}"]`).forEach(b=>b.classList.toggle('ok',on));
 if(P.f!=='all'&&(P.f==='done')!==on){tr.classList.add('gone');setTimeout(()=>{tr.remove();prog();if(!$('#tb').children.length)$('#nn').textContent=T[lang].none},380)}
 prog()}

function goTo(id){let tr=$(`#tb tr[data-id="${id}"]`);
 if(!tr){q='';$('#q').value='';P.co='';if(P.f!=='all')P.f='all';saveP();body();tr=$(`#tb tr[data-id="${id}"]`)}
 if(!tr)return;const w=$('#tw'),hh=$('#hr').offsetHeight;w.scrollTo({top:tr.offsetTop-hh-8,behavior:'smooth'});
 tr.classList.remove('flash');void tr.offsetWidth;tr.classList.add('flash')}

function onTap(e){const td=e.target.closest('td');if(!td)return;const tr=td.parentNode,id=tr.dataset.id,k=td.dataset.k;
 if(k==='chk'){toggle(tr);return}
 if(td.classList.contains('hz')){shown.add(id+':'+k);td.classList.remove('hz');return}
 const nb=e.target.closest('.nbc');if(nb){goTo(nb.dataset.go);return}
 if(k==='shape'||k==='flag')bigDlg(byId[id])}

/* ---------- dialogs ---------- */
function dlg(html){const d=document.createElement('div');d.className='fb mdlg';d.innerHTML=`<div class="card">${html}</div>`;
 d.onclick=e=>{if(e.target===d)d.remove()};document.body.appendChild(d);return d}
function bigDlg(c){const d=dlg(`<div class="bigt">${flagImg(c,'bf')}<div><b>${nm(c)}</b><small>${lang==='ar'?c.en:c.ar}</small></div></div>
 <svg viewBox="0 0 480 320" class="mshp big"><path d="${SH[c.id]||''}"/></svg><button class="x">${T[lang].close}</button>`);d.querySelector('.x').onclick=()=>d.remove();const bs=d.querySelector('.mshp.big');bs.style.cursor='pointer';bs.insertAdjacentHTML('afterend',`<div class="wlh">🌍 ${lang==='ar'?'اضغط على الخريطة لرؤية موقعها في العالم':'Tap the map to see where it is in the world'}</div>`);bs.onclick=()=>{location.href='index.html#wl='+c.id}}
function expDlg(){const t=T[lang],code=enc(),d=dlg(`<h3>📤 ${t.expT}</h3><p>${t.expP(M.size)}</p><textarea class="code" readonly rows="2">${code}</textarea>
 <div class="row">${navigator.share?`<button class="sh">${t.share}</button>`:''}<button class="cp">${t.copy}</button><button class="x">${t.close}</button></div>`);
 const ta=d.querySelector('.code');ta.onclick=()=>{ta.select();ta.setSelectionRange(0,9999)};
 d.querySelector('.cp').onclick=async e=>{let ok=false;try{await navigator.clipboard.writeText(code);ok=true}catch(_){}
  if(!ok){ta.select();ta.setSelectionRange(0,9999);try{ok=document.execCommand('copy')}catch(_){}}if(ok)e.target.textContent=t.copied};
 const sh=d.querySelector('.sh');if(sh)sh.onclick=()=>navigator.share({text:code}).catch(()=>{});
 d.querySelector('.x').onclick=()=>d.remove()}
function impDlg(){const t=T[lang],d=dlg(`<h3>📥 ${t.impT}</h3><p>${t.impP}</p><textarea class="code" rows="3" placeholder="${t.impPh}" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea><p class="msg"></p>
 <div class="row act"><button class="go" disabled>${t.imp}</button><button class="x">${t.close}</button></div>`);
 const ta=d.querySelector('.code'),msg=d.querySelector('.msg'),act=d.querySelector('.act');let S=null;
 ta.oninput=()=>{S=dec(ta.value);d.querySelector('.go')&&(d.querySelector('.go').disabled=!S);msg.textContent=ta.value.trim()&&!S?t.bad:S?t.impQ(M.size,S.size):''};
 const fin=()=>{saveM();body();msg.textContent=t.done(M.size);act.innerHTML=`<button class="x">${t.close}</button>`;act.querySelector('.x').onclick=()=>d.remove()};
 d.querySelector('.go').onclick=()=>{if(!S)return;act.innerHTML=`<button class="rp">${t.replace}</button><button class="mg">${t.merge}</button><button class="x">${t.close}</button>`;
  act.querySelector('.rp').onclick=()=>{M=new Set(S);fin()};act.querySelector('.mg').onclick=()=>{S.forEach(id=>M.add(id));fin()};act.querySelector('.x').onclick=()=>d.remove()};
 d.querySelector('.x').onclick=()=>d.remove();setTimeout(()=>ta.focus(),50)}

shell();labels();body();
const vv=window.visualViewport,fit=()=>{H.style.setProperty('--h',Math.round(vv?vv.height:innerHeight)+'px');scrollTo(0,0)};
if(vv)vv.addEventListener('resize',fit);addEventListener('resize',fit);addEventListener('orientationchange',()=>[50,300,800].forEach(t=>setTimeout(fit,t)));fit();
['gesturestart','gesturechange','gestureend'].forEach(e=>document.addEventListener(e,ev=>ev.preventDefault(),{passive:false}));
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
})();
