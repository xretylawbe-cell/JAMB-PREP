/* content: part of the dashboard. Generated from the standalone page so both behave the same. */
window.Mods=window.Mods||{};
Mods.content={
html:"<div class=\"tabs\" id=\"tabs\"></div>\n<div class=\"card hid\" id=\"form\"></div>\n<div class=\"bar\"><button class=\"btn hi\" id=\"newb\">New</button><select id=\"flt\"></select><input id=\"srch\" placeholder=\"Search\"></div>\n<div id=\"list\"></div>",
css:".mod-content .card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:14px}.mod-content .field{margin:10px 0}.mod-content .field label{display:block;font-size:13px;font-weight:700;margin-bottom:5px}.mod-content input,.mod-content select,.mod-content textarea,.mod-content button{font:inherit}.mod-content input,.mod-content select,.mod-content textarea{width:100%;padding:11px;border:1.5px solid var(--line);border-radius:10px;background:#fff}.mod-content textarea{min-height:90px}.mod-content .btn{background:var(--ink);color:#fff;border:0;border-radius:10px;padding:9px 13px;font-weight:700;cursor:pointer}.mod-content .btn.hi{background:var(--hi);color:var(--ink)}.mod-content .btn.sec{background:#e8ecf8;color:var(--ink)}.mod-content .tabs{display:flex;gap:8px;margin-bottom:14px;overflow-x:auto}.mod-content .tabs button{border:0;border-radius:20px;padding:9px 16px;background:#e8ecf8;color:var(--ink);font-weight:700;cursor:pointer;white-space:nowrap}.mod-content .tabs .on{background:var(--ink);color:#fff}.mod-content .bar{display:grid;grid-template-columns:auto 1fr 1fr;gap:10px;margin-bottom:12px;align-items:center}@media(max-width:640px){.mod-content .bar{grid-template-columns:1fr 1fr}.mod-content .bar .btn{grid-column:1/-1}}.mod-content .item{display:flex;gap:8px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:11px 13px;margin-bottom:8px;flex-wrap:wrap}.mod-content .grow{flex:1;min-width:180px}.mod-content .note{padding:10px 12px;border-radius:10px;background:#eef2ff;margin:10px 0;font-size:14px}.mod-content .err{background:#fde8e8;color:#8f1d22}.mod-content .ok{background:#dff5ec;color:#08704c}.mod-content .hid{display:none!important}.mod-content .muted{color:var(--mut);font-size:13px}.mod-content .tag{display:inline-block;border-radius:20px;padding:2px 9px;font-size:12px;font-weight:700;background:#e8ecf8}.mod-content .tag.r{background:#fde8e8;color:#a3262b}.mod-content .chk{display:flex;gap:9px;align-items:center;padding:9px 11px;border:1.5px solid var(--line);border-radius:10px;margin:8px 0}.mod-content .chk input[type=checkbox],.mod-content .chk input[type=radio]{width:18px;height:18px;flex:none}.mod-content .chk input[type=text]{border:0;padding:4px}",
mount:function(db,user){
if(!document.getElementById("css-content")){var __s=document.createElement("style");__s.id="css-content";__s.textContent=Mods.content.css;document.head.appendChild(__s)}
const $=i=>document.getElementById(i),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const msg=(t,k="")=>{const e=$("fm");if(e)e.innerHTML=t?`<div class="note ${k}">${esc(t)}</div>`:""};
let tab="subjects",L={subjects:[],topics:[]},rows={},editRow=null,qe={};
const nm=(k,id)=>L[k].find(x=>x.id===id)?.name||"?";
/* field = [column, label, type, required]; types: text, area, num, chk, sel:<lookup>, opt:a,b,c */
const C={
 subjects:{t:"subjects",l:"Subject",o:"sort_order",s:"name",f:[["name","Name","text",1],["slug","Short name (use-of-english for English)","text",1],["description","Description","area"],["icon","Icon (one emoji)","text"],["sort_order","Order","num"],["is_published","Visible to students","chk"]],title:r=>r.name,sub:r=>r.slug},
 topics:{t:"topics",l:"Topic",o:"sort_order",s:"name",flt:["subject_id","subjects"],f:[["subject_id","Subject","sel:subjects",1],["name","Name","text",1],["description","Description","area"],["sort_order","Order","num"],["is_published","Visible to students","chk"]],title:r=>r.name,sub:r=>"Subject: "+nm("subjects",r.subject_id)},
 lessons:{t:"lessons",l:"Subtopic",o:"sort_order",s:"title",flt:["topic_id","topics"],f:[["topic_id","Topic","sel:topics",1],["title","Title","text",1],["summary","Short summary","text"],["lesson_type","Type","opt:written,audio,video"],["written_content","Notes (text)","area"],["audio_url","Audio link (https)","text"],["video_url","Video link (https)","text"],["duration_minutes","Minutes","num"],["sort_order","Order","num"],["is_published","Visible to students","chk"]],title:r=>r.title,sub:r=>"Topic: "+nm("topics",r.topic_id)},
 questions:{t:"questions",l:"Question",o:"id",s:"question_text",flt:["subject_id","subjects"],title:r=>(r.question_text||"").slice(0,90),sub:r=>nm("subjects",r.subject_id)+(r.question_year?", "+r.question_year:"")}
};
async function staff(){$("tabs").innerHTML=Object.keys(C).map(k=>`<button data-tab="${k}">${C[k].l}s</button>`).join("");await lookups();show("subjects")}
async function lookups(){const [a,b]=await Promise.all([db.from("subjects").select("id,name").order("sort_order"),db.from("topics").select("id,name,subject_id").order("sort_order")]);
 L.subjects=a.data||[];L.topics=(b.data||[]).map(t=>({...t,name:t.name+" ("+nm("subjects",t.subject_id)+")"}))}
function show(t){tab=t;document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.tab===t));$("form").classList.add("hid");$("srch").value="";
 const c=C[t];$("flt").classList.toggle("hid",!c.flt);if(c.flt)$("flt").innerHTML='<option value="">All</option>'+L[c.flt[1]].map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");load()}
$("tabs").onclick=e=>{const b=e.target.closest("[data-tab]");if(b)show(b.dataset.tab)};
$("flt").onchange=load;let st;$("srch").oninput=()=>{clearTimeout(st);st=setTimeout(load,300)};
async function load(){const c=C[tab];let q=db.from(c.t).select("*").order(c.o,{ascending:tab!=="questions"}).limit(50);
 if(c.flt&&$("flt").value)q=q.eq(c.flt[0],+$("flt").value);if($("srch").value.trim())q=q.ilike(c.s,"%"+$("srch").value.trim()+"%");
 const {data,error}=await q;if(error){$("list").innerHTML=`<div class="note err">${esc(error.message)}</div>`;return}
 rows={};(data||[]).forEach(r=>rows[r.id]=r);
 $("list").innerHTML=(data||[]).map(r=>`<div class="item"><span class="grow"><b>${esc(c.title(r))}</b> ${r.is_published?"":'<span class="tag r">Hidden</span>'}<div class="muted">${esc(c.sub(r))}</div></span>${tab==="lessons"?`<button class="btn sec" data-pg="${r.id}">Pages</button>`:""}<button class="btn sec" data-e="${r.id}">Edit</button><button class="btn sec" data-p="${r.id}">${r.is_published?"Hide":"Show"}</button><button class="btn sec" data-d="${r.id}">Delete</button></div>`).join("")||'<p class="muted">Nothing here yet. Tap New to add one.</p>'}
$("list").onclick=async e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset,c=C[tab];let r;
 if(d.pg)return openPages(+d.pg);
 if(d.e)return tab==="questions"?openQ(rows[d.e]):openForm(rows[d.e]);
 if(d.p)r=await db.from(c.t).update({is_published:!rows[d.p].is_published}).eq("id",+d.p);
 else if(d.d){if(!confirm("Delete this "+c.l.toLowerCase()+"? This cannot be undone."))return;r=await db.from(c.t).delete().eq("id",+d.d)}
 if(r?.error)alert(r.error.code==="23503"?"This is linked to other content or to students' past results, so it cannot be deleted. Hide it instead.":r.error.message);
 await lookups();load()};
$("newb").onclick=()=>tab==="questions"?openQ(null):openForm(null);
function fld(k,l,t,v){const id="x_"+k;
 if(t==="chk")return `<label class="chk"><input type="checkbox" id="${id}" ${v?"checked":""}>${l}</label>`;
 if(t==="area")return `<div class="field"><label>${l}</label><textarea id="${id}">${esc(v)}</textarea></div>`;
 if(/^(sel|opt):/.test(t)){const s=t.startsWith("sel:");let o=s?L[t.slice(4)].map(x=>[x.id,x.name]):t.slice(4).split(",").map(x=>[x,x]);
  if(v&&!o.some(x=>String(x[0])===String(v)))o.unshift([v,v]);
  return `<div class="field"><label>${l}</label><select id="${id}">${o.map(([a,b])=>`<option value="${esc(a)}" ${String(a)===String(v)?"selected":""}>${esc(b)}</option>`).join("")}</select></div>`}
 return `<div class="field"><label>${l}</label><input id="${id}" type="${t==="num"?"number":"text"}" value="${esc(v)}"></div>`}
function openForm(r){editRow=r;const c=C[tab];$("form").classList.remove("hid");
 $("form").innerHTML=`<h3>${r?"Edit":"New"} ${c.l.toLowerCase()}</h3>`+c.f.map(([k,l,t])=>fld(k,l,t,r?r[k]:(t==="chk"?true:(k==="sort_order"?0:"")))).join("")+`<div class="grid"><button class="btn hi" id="save">Save</button> <button class="btn sec" id="cancel">Cancel</button></div><div id="fm"></div>`;
 $("save").onclick=save;$("cancel").onclick=()=>$("form").classList.add("hid");scrollTo(0,0)}
async function save(){const c=C[tab],r={};
 for(const [k,l,t,req] of c.f){const e=$("x_"+k);let v=t==="chk"?e.checked:e.value.trim();
  if(t==="num")v=v===""?null:+v;else if(t.startsWith("sel:"))v=+v;else if(v==="")v=null;
  if(req&&(v===null||v===""))return msg(l+" is required.","err");r[k]=v}
 for(const k of ["audio_url","video_url"])if(r[k]&&!/^https:\/\//i.test(r[k]))return msg("Links must start with https://","err");
 const {error}=await(editRow?db.from(c.t).update(r).eq("id",editRow.id):db.from(c.t).insert(r));
 if(error)return msg(error.message,"err");$("form").classList.add("hid");await lookups();load()}
/* lesson pages: short cards that students go through one at a time */
let PG={l:0,rows:[],e:null};
async function openPages(id){PG.l=id;const {data,error}=await db.from("lesson_pages").select("*").eq("lesson_id",id).order("position").order("id");if(error)return alert(error.message);PG.rows=data||[];drawPages()}
function drawPages(){const l=rows[PG.l];$("form").classList.remove("hid");
 $("form").innerHTML=`<h3>Pages: ${esc(l?.title||"")}</h3><p class="muted">Students go through these one page at a time. Add text, pictures, video, audio and quick questions. With no pages, the notes are split into cards automatically.</p>`+
 (PG.rows.map((p,i)=>`<div class="item"><span class="grow"><b>${i+1}. ${esc(p.kind==="quiz"?"question":p.kind)}</b> ${esc(p.title||"")}<div class="muted">${esc((p.body||p.media_url||"").slice(0,80))}</div></span><button class="btn sec" data-pu="${i}" aria-label="Move up">↑</button><button class="btn sec" data-pd="${i}" aria-label="Move down">↓</button><button class="btn sec" data-pe="${p.id}">Edit</button><button class="btn sec" data-px="${p.id}">Delete</button></div>`).join("")||'<p class="muted">No pages yet.</p>')+
 `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${["text","image","video","audio","quiz"].map(k=>`<button class="btn" data-pk="${k}">+ ${k==="quiz"?"question":k}</button>`).join("")}<button class="btn sec" id="pgclose">Close</button></div><div id="pgform"></div><div id="fm"></div>`;
 $("pgclose").onclick=()=>$("form").classList.add("hid");scrollTo(0,0)}
function pageForm(k,p){PG.e={k,id:p?.id};let h=`<div class="card" style="margin-top:12px;border:2px dashed var(--ink)"><h3>${p?"Edit":"New"} ${k==="quiz"?"question":k} page</h3>`;
 if(k!=="quiz")h+=`<div class="field"><label>Heading (optional)</label><input id="pg_t" value="${esc(p?.title||"")}"></div>`;
 h+=`<div class="field"><label>${k==="quiz"?"Question":k==="text"?"Text (put **two stars** around words to bold them)":"Caption (optional)"}</label><textarea id="pg_b">${esc(p?.body||"")}</textarea></div>`;
 if(["image","video","audio"].includes(k))h+=`<div class="field"><label>${k==="video"?"Video link (YouTube or https), or upload a file":"Upload a file"}</label>${k==="video"?`<input id="pg_u" placeholder="https://" value="${esc(p?.media_url||"")}">`:""}<input type="file" id="pg_f" accept="${k}/*" style="margin-top:6px"></div>`;
 if(k==="quiz")h+=`<div class="field"><label>Options, one per line (2 to 5)</label><textarea id="pg_o">${esc((p?.options||[]).join("\n"))}</textarea></div><div class="field"><label>Right option number</label><input id="pg_c" type="number" min="1" value="${p?(p.correct_index??0)+1:1}"></div><div class="field"><label>Explanation (shown after answering)</label><textarea id="pg_x">${esc(p?.explanation||"")}</textarea></div>`;
 h+=`<button class="btn hi" id="pg_s">Save page</button> <button class="btn sec" id="pg_c2">Cancel</button></div>`;$("pgform").innerHTML=h;$("pg_c2").onclick=()=>$("pgform").innerHTML="";$("pg_s").onclick=savePage;$("pgform").scrollIntoView({behavior:"smooth"})}
async function savePage(){const {k,id}=PG.e,old=PG.rows.find(r=>r.id===id),r={lesson_id:PG.l,kind:k};$("pg_s").disabled=true;
 try{
  if(k!=="quiz")r.title=$("pg_t").value.trim()||null;
  r.body=$("pg_b").value.trim()||null;if(k==="text"&&!r.body)throw new Error("Write the text first.");
  if(["image","video","audio"].includes(k)){let u=old?.media_url||null;if(k==="video"&&$("pg_u").value.trim())u=$("pg_u").value.trim();
   const f=$("pg_f").files[0];if(f){if(f.size>2e7)throw new Error("That file is over 20 MB.");const p=`l${PG.l}/${Date.now()}-${f.name.replace(/[^\w.-]/g,"_")}`;const up=await db.storage.from("lesson-media").upload(p,f);if(up.error)throw up.error;u=db.storage.from("lesson-media").getPublicUrl(p).data.publicUrl}
   if(!u)throw new Error("Add a file"+(k==="video"?" or a link":"")+" first.");if(!/^https:\/\//i.test(u))throw new Error("Links must start with https://");r.media_url=u}
  if(k==="quiz"){const o=$("pg_o").value.split("\n").map(x=>x.trim()).filter(Boolean),c=+$("pg_c").value;
   if(!r.body)throw new Error("Write the question first.");if(o.length<2||o.length>5)throw new Error("Add 2 to 5 options.");if(!(c>=1&&c<=o.length))throw new Error("The right option number must match one of your options.");
   r.options=o;r.correct_index=c-1;r.explanation=$("pg_x").value.trim()||null}
  if(id){const {error}=await db.from("lesson_pages").update(r).eq("id",id);if(error)throw error}
  else{r.position=(PG.rows.length?Math.max(...PG.rows.map(x=>x.position)):0)+10;const {error}=await db.from("lesson_pages").insert(r);if(error)throw error}
  await openPages(PG.l)
 }catch(e){msg(e.message,"err");const s=$("pg_s");if(s)s.disabled=false}}
$("form").addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset;
 if(d.pk)pageForm(d.pk,null);
 else if(d.pe){const p=PG.rows.find(r=>r.id===+d.pe);pageForm(p.kind,p)}
 else if(d.px){if(!confirm("Delete this page?"))return;const {error}=await db.from("lesson_pages").delete().eq("id",+d.px);if(error)alert(error.message);openPages(PG.l)}
 else if(d.pu!==undefined||d.pd!==undefined){const i=+(d.pu??d.pd),j=d.pu!==undefined?i-1:i+1,a=PG.rows[i],c=PG.rows[j];if(!a||!c)return;
  await db.from("lesson_pages").update({position:c.position}).eq("id",a.id);await db.from("lesson_pages").update({position:a.position}).eq("id",c.id);openPages(PG.l)}});
/* questions: one editor for the question, its options and the answer key */
async function openQ(r){let o=[],a=null;
 if(r){const [x,y]=await Promise.all([db.from("question_options").select("*").eq("question_id",r.id),db.from("question_answers").select("*").eq("question_id",r.id).maybeSingle()]);o=x.data||[];a=y.data}
 qe={r,opts:Object.fromEntries(o.map(z=>[z.option_label,z]))};
 const cor=a?o.find(z=>z.id===a.correct_option_id)?.option_label:"";
 $("form").classList.remove("hid");
 $("form").innerHTML=`<h3>${r?"Edit":"New"} question</h3>`+fld("subject_id","Subject","sel:subjects",r?.subject_id||$("flt").value||L.subjects[0]?.id)+fld("question_text","Question","area",r?.question_text||"")+
 `<label style="font-size:13px;font-weight:700">Options (tick the correct one)</label>`+["A","B","C","D"].map(l=>`<label class="chk"><input type="radio" name="corr" value="${l}" ${cor===l?"checked":""}><b>${l}</b><input type="text" id="o_${l}" value="${esc(qe.opts[l]?.option_text||"")}" placeholder="Option ${l}"></label>`).join("")+
 fld("explanation","Explanation shown after the test","area",a?.explanation||"")+fld("question_year","Year","num",r?.question_year||"")+fld("difficulty","Difficulty","opt:easy,medium,hard",r?.difficulty||"medium")+fld("is_published","Visible in tests","chk",r?r.is_published:true)+
 `<div class="grid"><button class="btn hi" id="save">Save question</button> <button class="btn sec" id="cancel">Cancel</button></div><div id="fm"></div>`;
 $("save").onclick=saveQ;$("cancel").onclick=()=>$("form").classList.add("hid");scrollTo(0,0)}
async function saveQ(){const g=k=>$("x_"+k).value.trim(),lab=["A","B","C","D"],tx=Object.fromEntries(lab.map(l=>[l,$("o_"+l).value.trim()])),cor=document.querySelector("input[name=corr]:checked")?.value;
 if(!g("question_text"))return msg("Write the question first.","err");
 if(lab.filter(l=>tx[l]).length<2)return msg("Add at least two options.","err");
 if(!cor||!tx[cor])return msg("Tick the correct option, and fill it in.","err");
 const q={subject_id:+g("subject_id"),question_text:g("question_text"),question_year:g("question_year")?+g("question_year"):null,difficulty:g("difficulty"),is_published:$("x_is_published").checked};
 let id=qe.r?.id,e;if(id)e=(await db.from("questions").update(q).eq("id",id)).error;else{const r=await db.from("questions").insert(q).select("id").single();e=r.error;id=r.data?.id}
 if(e)return msg(e.message,"err");
 const ids={};
 for(const l of lab){if(!tx[l])continue;const ex=qe.opts[l];
  if(ex){const r=await db.from("question_options").update({option_text:tx[l]}).eq("id",ex.id);if(r.error)return msg(r.error.message,"err");ids[l]=ex.id}
  else{const r=await db.from("question_options").insert({question_id:id,option_label:l,option_text:tx[l]}).select("id").single();if(r.error)return msg(r.error.message,"err");ids[l]=r.data.id}}
 const r2=await db.from("question_answers").upsert({question_id:id,correct_option_id:ids[cor],explanation:g("explanation")||null},{onConflict:"question_id"});
 if(r2.error)return msg(r2.error.message,"err");
 for(const l of lab){const ex=qe.opts[l];if(ex&&!tx[l])await db.from("question_options").delete().eq("id",ex.id)}
 $("form").classList.add("hid");load()}
staff();
return {unmount:function(){}};
}};
