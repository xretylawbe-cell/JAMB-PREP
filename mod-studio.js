/* mod-studio.js: Content Studio. AI writes ORIGINAL questions and lessons; you review before anything is saved. */
window.Mods = window.Mods || {};
Mods.studio = {
html: '<div id="stu"></div>',
css: ".mod-studio .tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.mod-studio .tabs button{border:0;border-radius:20px;padding:9px 16px;background:#e8ecf8;color:var(--ink);font-weight:700;cursor:pointer}.mod-studio .tabs .on{background:var(--ink);color:#fff}" +
 ".mod-studio .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:640px){.mod-studio .grid2{grid-template-columns:1fr}}" +
 ".mod-studio .dq{border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px;background:#fff}.mod-studio .dq.flag{border-color:#e5484d;background:#fff6f6}" +
 ".mod-studio .dq textarea{min-height:60px}.mod-studio .opt{display:flex;gap:8px;align-items:center;margin:6px 0}.mod-studio .opt input[type=text]{flex:1}.mod-studio .opt input[type=radio]{width:18px;height:18px;flex:none}" +
 ".mod-studio .bar{position:sticky;bottom:0;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;z-index:3}" +
 ".mod-studio .gh{font-weight:800;margin:16px 0 8px;color:var(--mut)}.mod-studio .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.mod-studio .empty{text-align:center;color:var(--mut);padding:18px}",
mount: function (db, user) {
  if (!document.getElementById("css-studio")) { var __s = document.createElement("style"); __s.id = "css-studio"; __s.textContent = Mods.studio.css; document.head.appendChild(__s); }
  var $ = function (i) { return document.getElementById(i); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var root = $("stu"), tab = "q", subjects = [], topics = [], drafts = [], lesson = null, seq = 0, stopFlag = false, busy = false, preset = window.StudioPreset || null; window.StudioPreset = null;
  if (preset && preset.mode === "lesson") tab = "l";
  function msg(t, k) { var e = $("stmsg"); if (e) e.innerHTML = t ? '<div class="note ' + (k || "") + '">' + esc(t) + "</div>" : ""; }
  async function ai(body) { var r = await db.functions.invoke("ai-content", { body: body }); if (r.error) throw new Error(r.error.message); return r.data; }
  var subOpts = function (sel) { return subjects.map(function (s) { return '<option value="' + s.id + '" ' + (s.id === sel ? "selected" : "") + ">" + esc(s.name) + "</option>"; }).join(""); };
  var topOpts = function (sid, sel, any) { return (any ? '<option value="">' + any + "</option>" : "") + topics.filter(function (t) { return t.subject_id === sid; }).map(function (t) { return '<option value="' + t.id + '" ' + (t.id === sel ? "selected" : "") + ">" + esc(t.name) + "</option>"; }).join(""); };
  var subName = function (id) { var s = subjects.filter(function (x) { return x.id === id; })[0]; return s ? s.name : ""; };

  function draw() {
    var sid = preset && preset.subject_id || (subjects[0] && subjects[0].id), tid = preset && preset.topic_id || null;
    var head = '<h2>Content Studio</h2><p class="muted">AI writes original JAMB-style questions and lessons for you. It never copies real past papers. You check everything before it is saved.</p><div class="tabs">' +
      [["q", "Make questions"], ["x", "Import from text"], ["l", "Draft a lesson"], ["r", "Student reports"]].map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (tab === t[0] ? "on" : "") + '">' + t[1] + "</button>"; }).join("") + '</div><div id="stmsg"></div>';
    var body = "";
    if (tab === "q") body = '<div class="card"><div class="grid2"><div class="field"><label>Subject</label><select id="st_sub">' + subOpts(sid) + '</select></div><div class="field"><label>Topic</label><select id="st_top">' + topOpts(sid, tid, "Every topic in this subject") + '</select></div><div class="field"><label>Questions per topic</label><select id="st_n"><option>5</option><option selected>10</option><option>15</option></select></div><div class="field"><label>Difficulty</label><select id="st_d"><option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div></div><label class="chk"><input type="checkbox" id="st_v" checked>Double-check the answers (recommended: questions the AI is unsure about are flagged)</label><div class="actions"><button class="btn hi" id="st_go">Make questions</button><button class="btn sec hid" id="st_stop">Stop</button></div><div id="st_prog" class="muted" style="margin-top:8px"></div></div><div id="st_res"></div>';
    else if (tab === "x") body = '<div class="card"><p class="muted">Paste questions you wrote yourself or have permission to use, or choose a PDF. The AI tidies them into the right format. It does not make up answers: if the answer is missing you pick it.</p><div class="grid2"><div class="field"><label>Subject</label><select id="st_sub">' + subOpts(sid) + '</select></div><div class="field"><label>Topic (optional)</label><select id="st_top">' + topOpts(sid, tid, "No topic yet") + '</select></div><div class="field"><label>Year (only for real past questions)</label><input id="st_y" type="number" placeholder="e.g. 2019"></div><div class="field"><label>Or choose a PDF (under 4 MB)</label><input id="st_f" type="file" accept="application/pdf"></div></div><div class="field"><label>Paste the questions here</label><textarea id="st_t" style="min-height:140px"></textarea></div><label class="chk"><input type="checkbox" id="st_own">These questions are mine, or I have permission to use them</label><div class="actions"><button class="btn hi" id="st_ex">Tidy these questions</button></div></div><div id="st_res"></div>';
    else if (tab === "l") body = '<div class="card"><div class="grid2"><div class="field"><label>Subject</label><select id="st_sub">' + subOpts(sid) + '</select></div><div class="field"><label>Topic</label><select id="st_top">' + topOpts(sid, tid) + '</select></div></div><div class="field"><label>Subtopic (the lesson to write)</label><input id="st_s" placeholder="e.g. Parts of a cell"></div><div class="actions"><button class="btn hi" id="st_dl">Draft the lesson</button></div></div><div id="st_res"></div>';
    else body = '<div id="st_res"><p class="muted">Loading...</p></div>';
    root.innerHTML = head + body;
    if (tab === "r") loadReports(); else if (tab === "l") drawLesson(); else drawDrafts();
  }
  function qcard(d) {
    return '<div class="dq ' + (d.check ? "flag" : "") + '" data-id="' + d._id + '">' + (d.check ? '<div class="tag r" style="margin-bottom:6px">' + (d.correct ? "Check this one: the AI second pass disagreed" : "Choose the correct answer") + "</div>" : "") +
      '<textarea data-f="question">' + esc(d.question) + "</textarea>" + ["a", "b", "c", "d"].map(function (l) { return '<div class="opt"><input type="radio" name="r' + d._id + '" data-f="correct" value="' + l.toUpperCase() + '" ' + (d.correct === l.toUpperCase() ? "checked" : "") + '><b>' + l.toUpperCase() + '</b><input type="text" data-f="' + l + '" value="' + esc(d[l]) + '"></div>'; }).join("") +
      '<textarea data-f="explanation" placeholder="Explanation">' + esc(d.explanation) + '</textarea><div class="actions" style="margin-top:6px"><label class="chk" style="margin:0"><input type="checkbox" data-f="keep" ' + (d.keep ? "checked" : "") + '>Save this one</label><button class="btn sec" data-del="' + d._id + '">Remove</button></div></div>';
  }
  function drawDrafts() {
    var el = $("st_res"); if (!el) return;
    if (!drafts.length) { el.innerHTML = ""; return; }
    var groups = {}, order = []; drafts.forEach(function (d) { var k = d.topic || "No topic"; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(d); });
    var flagged = drafts.filter(function (d) { return d.check; }).length, kept = drafts.filter(function (d) { return d.keep; }).length;
    el.innerHTML = '<div class="card"><b>' + drafts.length + " draft question" + (drafts.length === 1 ? "" : "s") + "</b>" + (flagged ? ' <span class="tag r">' + flagged + " to check</span>" : "") + '<div class="muted">Read each one. Fix anything wrong, untick the ones you do not want, then save.</div></div>' +
      order.map(function (k) { return '<div class="gh">' + esc(k) + " (" + groups[k].length + ")</div>" + groups[k].map(qcard).join(""); }).join("") +
      '<div class="bar"><b id="st_cnt">' + kept + " selected</b><button class=\"btn sec\" data-all=\"1\">All</button><button class=\"btn sec\" data-all=\"0\">None</button><button class=\"btn sec\" data-all=\"ok\">Only unflagged</button><select id=\"st_pub\"><option value=\"0\">Save as hidden</option><option value=\"1\">Save and publish</option></select><button class=\"btn hi\" id=\"st_save\">Save selected</button></div>";
  }
  async function loadAll() {
    var a = await Promise.all([db.from("subjects").select("id,name").order("sort_order"), db.from("topics").select("id,name,subject_id").order("sort_order")]);
    subjects = a[0].data || []; topics = a[1].data || []; draw();
  }

  /* ----- make questions ----- */
  async function generate() {
    var sid = +$("st_sub").value, tv = $("st_top").value, n = +$("st_n").value, diff = $("st_d").value, verify = $("st_v").checked;
    var list = tv ? topics.filter(function (t) { return t.id === +tv; }) : topics.filter(function (t) { return t.subject_id === sid; });
    if (!list.length) return msg("This subject has no topics yet. Add topics in Content first.", "err");
    busy = true; stopFlag = false; drafts = []; msg(""); $("st_go").disabled = true; $("st_stop").classList.remove("hid");
    var fails = [], i, t, av, r;
    for (i = 0; i < list.length; i++) {
      if (stopFlag) break; t = list[i]; $("st_prog").textContent = "Topic " + (i + 1) + " of " + list.length + ": " + t.name + "...";
      av = await db.from("questions").select("question_text").eq("topic_id", t.id).limit(25);
      try {
        r = await ai({ mode: "questions", subject: subName(sid), topic: t.name, count: n, difficulty: diff, verify: verify, avoid: (av.data || []).map(function (x) { return x.question_text; }) });
        (r.questions || []).forEach(function (q) { q.subject_id = sid; q.topic = t.name; q.keep = !q.check; q._id = ++seq; drafts.push(q); });
      } catch (e) { fails.push(t.name + ": " + e.message); if (/limit|key|credit|set up|model|signed|staff/i.test(e.message)) break; }
      drawDrafts();
    }
    busy = false; $("st_go").disabled = false; $("st_stop").classList.add("hid"); $("st_prog").textContent = "";
    msg(drafts.length ? "Done. " + drafts.length + " draft question(s) are ready to review." + (fails.length ? " Some topics failed: " + fails.join("; ") : "") : (fails.join("; ") || "No questions were made."), drafts.length && !fails.length ? "ok" : "err");
  }
  async function extract() {
    if (!$("st_own").checked) return msg("Please tick the box to confirm you may use these questions.", "err");
    var sid = +$("st_sub").value, tv = $("st_top").value, text = $("st_t").value, f = $("st_f").files[0], year = $("st_y").value.trim(), body = { mode: "extract", subject: subName(sid), topic: tv ? (topics.filter(function (t) { return t.id === +tv; })[0] || {}).name : "", text: text };
    if (!text.trim() && !f) return msg("Paste some questions or choose a PDF first.", "err");
    $("st_ex").disabled = true; msg("Reading the questions...");
    try {
      if (f) { if (f.size > 4e6) throw new Error("That PDF is over 4 MB. Split it into smaller parts."); body.pdf_base64 = await new Promise(function (res, rej) { var rd = new FileReader(); rd.onload = function () { res(String(rd.result).split(",")[1]); }; rd.onerror = rej; rd.readAsDataURL(f); }); }
      var r = await ai(body); drafts = (r.questions || []).map(function (q) { q.subject_id = sid; q.topic = body.topic || ""; q.year = year; q.keep = !q.check; q._id = ++seq; return q; });
      msg(drafts.length + " question(s) found. " + (drafts.filter(function (d) { return d.check; }).length ? "Some have no answer yet: choose it before saving." : ""), "ok");
    } catch (e) { msg(e.message, "err"); }
    $("st_ex").disabled = false; drawDrafts();
  }
  async function saveDrafts() {
    var pick = drafts.filter(function (d) { return d.keep; });
    if (!pick.length) return msg("Nothing is selected.", "err");
    var bad = pick.filter(function (d) { return !d.correct || !d.question || !d.a || !d.b; });
    if (bad.length) return msg(bad.length + " selected question(s) still need a correct answer or text. Fix or untick them.", "err");
    var pub = $("st_pub").value === "1", ok = 0, i, chunk, r, bySub = {};
    pick.forEach(function (d) { (bySub[d.subject_id] = bySub[d.subject_id] || []).push({ question: d.question, a: d.a, b: d.b, c: d.c || "", d: d.d || "", correct: d.correct, explanation: d.explanation || "", difficulty: d.difficulty || "medium", year: d.year || "", topic: d.topic || "", published: pub }); });
    $("st_save").disabled = true;
    for (var sid in bySub) for (i = 0; i < bySub[sid].length; i += 50) {
      chunk = bySub[sid].slice(i, i + 50); r = await db.rpc("import_questions", { p_subject_id: +sid, p_rows: chunk });
      if (r.error) { $("st_save").disabled = false; return msg("Saved " + ok + " before an error: " + r.error.message, "err"); }
      ok += chunk.length;
    }
    drafts = drafts.filter(function (d) { return !d.keep; }); drawDrafts(); msg(ok + " question(s) saved" + (pub ? " and published." : " as hidden. Publish them from Content when you are happy."), "ok");
  }

  /* ----- lesson ----- */
  async function draftLesson() {
    var sid = +$("st_sub").value, tv = $("st_top").value, sub = $("st_s").value.trim();
    if (!tv) return msg("Choose a topic first.", "err"); if (!sub) return msg("Type the subtopic to write.", "err");
    var t = topics.filter(function (x) { return x.id === +tv; })[0]; $("st_dl").disabled = true; msg("Writing the lesson...");
    try { var r = await ai({ mode: "lesson", subject: subName(sid), topic: t.name, subtopic: sub }); lesson = r.lesson; lesson.topic_id = t.id; msg("Lesson drafted. Read it, fix anything, then save.", "ok"); }
    catch (e) { msg(e.message, "err"); }
    $("st_dl").disabled = false; drawLesson();
  }
  function drawLesson() {
    var el = $("st_res"); if (!el || !lesson) { if (el) el.innerHTML = ""; return; }
    el.innerHTML = '<div class="card"><div class="field"><label>Title</label><input id="ls_t" value="' + esc(lesson.title) + '"></div><div class="field"><label>Summary</label><input id="ls_s" value="' + esc(lesson.summary) + '"></div></div>' +
      lesson.pages.map(function (p, i) {
        return '<div class="dq" data-pi="' + i + '"><b>' + (i + 1) + ". " + (p.kind === "quiz" ? "Question" : "Card") + "</b>" + (p.kind === "text" ? '<div class="field"><label>Heading</label><input data-pf="title" value="' + esc(p.title) + '"></div><div class="field"><label>Text</label><textarea data-pf="body">' + esc(p.body) + "</textarea></div>" :
          '<div class="field"><label>Question</label><textarea data-pf="body">' + esc(p.body) + '</textarea></div><div class="field"><label>Options, one per line</label><textarea data-pf="options">' + esc(p.options.join("\n")) + '</textarea></div><div class="field"><label>Right option number</label><input data-pf="ci" type="number" min="1" value="' + (p.correct_index + 1) + '"></div><div class="field"><label>Explanation</label><textarea data-pf="explanation">' + esc(p.explanation) + "</textarea></div>") + '<button class="btn sec" data-pdel="' + i + '">Remove this card</button></div>';
      }).join("") + '<div class="bar"><button class="btn hi" id="ls_save">Save lesson (hidden)</button></div>';
  }
  async function saveLesson() {
    var title = $("ls_t").value.trim(); if (!title) return msg("The lesson needs a title.", "err");
    var pages = [], i, p, o, c;
    for (i = 0; i < lesson.pages.length; i++) {
      p = lesson.pages[i];
      if (p.kind === "quiz") { o = p.options.filter(Boolean); c = p.correct_index; if (o.length < 2 || !(c >= 0 && c < o.length)) return msg("Question " + (i + 1) + " needs 2 or more options and a valid right answer.", "err"); pages.push({ kind: "quiz", body: p.body, options: o, correct_index: c, explanation: p.explanation || null, position: (i + 1) * 10 }); }
      else pages.push({ kind: "text", title: p.title || null, body: p.body, position: (i + 1) * 10 });
    }
    $("ls_save").disabled = true;
    var cnt = await db.from("lessons").select("id", { count: "exact", head: true }).eq("topic_id", lesson.topic_id);
    var ins = await db.from("lessons").insert({ topic_id: lesson.topic_id, title: title, summary: $("ls_s").value.trim() || null, lesson_type: "written", sort_order: (cnt.count || 0) + 1, is_published: false }).select("id").single();
    if (ins.error) { $("ls_save").disabled = false; return msg(ins.error.message, "err"); }
    pages.forEach(function (x) { x.lesson_id = ins.data.id; });
    var r = await db.from("lesson_pages").insert(pages); if (r.error) { $("ls_save").disabled = false; return msg("The lesson was created but its pages failed: " + r.error.message, "err"); }
    lesson = null; drawLesson(); msg("Lesson saved as hidden. Open it in Content to add pictures, then show it to students.", "ok");
  }

  /* ----- student reports ----- */
  async function loadReports() {
    var r = await db.rpc("list_reports"), el = $("st_res"); if (!el) return;
    if (r.error) { el.innerHTML = '<div class="note err">' + esc(r.error.message) + "</div>"; return; }
    el.innerHTML = (r.data || []).map(function (q) {
      return '<div class="dq"><div class="muted">' + esc(q.subject) + (q.topic ? ", " + esc(q.topic) : "") + ' <span class="tag r">' + q.count + " report" + (q.count === 1 ? "" : "s") + "</span>" + (q.published ? "" : ' <span class="tag">Hidden</span>') + "</div><p><b>" + esc(q.text) + "</b></p>" +
        (q.options || []).map(function (o) { return '<div class="opt"><b>' + esc(o.label) + "</b> " + esc(o.text) + (o.correct ? ' <span class="tag g">marked correct</span>' : "") + "</div>"; }).join("") + (q.explanation ? '<p class="muted">' + esc(q.explanation) + "</p>" : "") +
        (q.reasons && q.reasons.length ? '<p class="muted">Students say: ' + q.reasons.map(esc).join(" | ") + "</p>" : "") +
        '<div class="actions"><button class="btn sec" data-rhide="' + q.question_id + '">Hide question</button><button class="btn sec" data-rok="' + q.question_id + '">Looks fine, dismiss</button></div></div>';
    }).join("") || '<div class="empty">No reports. Students can tap "Report a mistake" after a test.</div>';
  }

  /* ----- events ----- */
  root.onclick = async function (e) {
    var b = e.target.closest("button"); if (!b) return; var d = b.dataset, r;
    if (d.tab) { tab = d.tab; draft_clear(); return draw(); }
    if (b.id === "st_go") return generate(); if (b.id === "st_stop") { stopFlag = true; return; }
    if (b.id === "st_ex") return extract(); if (b.id === "st_save") return saveDrafts();
    if (b.id === "st_dl") return draftLesson(); if (b.id === "ls_save") return saveLesson();
    if (d.del) { drafts = drafts.filter(function (x) { return x._id !== +d.del; }); return drawDrafts(); }
    if (d.all !== undefined) { drafts.forEach(function (x) { x.keep = d.all === "1" || (d.all === "ok" && !x.check); }); return drawDrafts(); }
    if (d.pdel !== undefined) { lesson.pages.splice(+d.pdel, 1); return drawLesson(); }
    if (d.rhide) { r = await db.from("questions").update({ is_published: false }).eq("id", +d.rhide); if (r.error) return msg(r.error.message, "err"); await db.rpc("resolve_reports", { p_question: +d.rhide }); return loadReports(); }
    if (d.rok) { r = await db.rpc("resolve_reports", { p_question: +d.rok }); if (r.error) return msg(r.error.message, "err"); return loadReports(); }
  };
  function draft_clear() { drafts = []; lesson = null; }
  root.oninput = root.onchange = function (e) {
    var t = e.target;
    if (t.id === "st_sub") { $("st_top").innerHTML = topOpts(+t.value, null, tab === "q" ? "Every topic in this subject" : tab === "x" ? "No topic yet" : ""); return; }
    var card = t.closest && t.closest("[data-id]");
    if (card && t.dataset.f) { var d = drafts.filter(function (x) { return x._id === +card.dataset.id; })[0]; if (!d) return; var f = t.dataset.f;
      if (f === "keep") { d.keep = t.checked; var c = $("st_cnt"); if (c) c.textContent = drafts.filter(function (x) { return x.keep; }).length + " selected"; }
      else if (f === "correct") { d.correct = t.value; if (d.check) { d.check = false; card.classList.remove("flag"); } } else d[f] = t.value; return; }
    var pc = t.closest && t.closest("[data-pi]");
    if (pc && t.dataset.pf && lesson) { var p = lesson.pages[+pc.dataset.pi], pf = t.dataset.pf; if (pf === "options") p.options = t.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean); else if (pf === "ci") p.correct_index = (+t.value || 1) - 1; else p[pf] = t.value; }
  };
  loadAll();
  return { unmount: function () { stopFlag = true; } };
}};
