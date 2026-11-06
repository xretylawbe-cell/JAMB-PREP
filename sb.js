/* sb.js: a small built-in client for the academy app.
   It talks to your Supabase project directly, so there is nothing to download
   and no outside website is needed. It only offers what the app's pages use. */
(function () {
  "use strict";

  function createClient(url, key) {
    url = String(url).replace(/\/+$/, "");
    var SK = "sb-" + url.split("//")[1].split(".")[0] + "-auth", mem = null, refreshing = null;
    var NET = "Cannot reach the server. Check your internet connection and try again.";

    function load() { try { var s = localStorage.getItem(SK); return s ? JSON.parse(s) : mem; } catch (e) { return mem; } }
    function save(s) { mem = s; try { s ? localStorage.setItem(SK, JSON.stringify(s)) : localStorage.removeItem(SK); } catch (e) {} }
    function hdrs(tok, extra) {
      var h = { apikey: key }, k;
      if (tok) h.Authorization = "Bearer " + tok;
      for (k in (extra || {})) h[k] = extra[k];
      return h;
    }
    function errMsg(j, status) {
      return (j && (j.error_description || j.msg || j.message || j.error)) || ("Request failed (" + status + ")");
    }
    function parse(t) { try { return t ? JSON.parse(t) : null; } catch (e) { return null; } }
    function encPath(p) { return String(p).split("/").map(encodeURIComponent).join("/"); }

    /* ---------- sign in ---------- */
    function authCall(path, body, tok) {
      return fetch(url + "/auth/v1/" + path, {
        method: "POST", headers: hdrs(tok, { "Content-Type": "application/json" }), body: JSON.stringify(body || {})
      }).then(function (r) { return r.text().then(function (t) { return { ok: r.ok, status: r.status, json: parse(t) }; }); });
    }
    function norm(j) {
      return {
        access_token: j.access_token, refresh_token: j.refresh_token, token_type: j.token_type || "bearer",
        expires_in: j.expires_in, expires_at: j.expires_at || (Math.floor(Date.now() / 1000) + (j.expires_in || 3600)),
        user: j.user
      };
    }
    function refresh(s) {
      if (refreshing) return refreshing;
      refreshing = authCall("token?grant_type=refresh_token", { refresh_token: s.refresh_token }).then(function (r) {
        refreshing = null;
        if (r.ok && r.json && r.json.access_token) { var n = norm(r.json); save(n); return n; }
        if (r.status >= 400 && r.status < 500) { save(null); return null; }
        return s;
      }, function () { refreshing = null; return s; });
      return refreshing;
    }
    function session() {
      var s = load();
      if (!s) return Promise.resolve(null);
      if (s.expires_at - Math.floor(Date.now() / 1000) < 60) return refresh(s);
      return Promise.resolve(s);
    }
    function token() { return session().then(function (s) { return s && s.access_token; }, function () { return null; }); }

    var auth = {
      getSession: function () { return session().then(function (s) { return { data: { session: s }, error: null }; }); },
      signInWithPassword: function (c) {
        return authCall("token?grant_type=password", { email: c.email, password: c.password }).then(function (r) {
          if (!r.ok) return { data: { user: null, session: null }, error: { message: errMsg(r.json, r.status), status: r.status } };
          var s = norm(r.json); save(s);
          return { data: { user: s.user, session: s }, error: null };
        }, function () { return { data: { user: null, session: null }, error: { message: NET } }; });
      },
      signUp: function (c) {
        var data = (c.options && c.options.data) || {};
        return authCall("signup", { email: c.email, password: c.password, data: data }).then(function (r) {
          if (!r.ok) return { data: { user: null, session: null }, error: { message: errMsg(r.json, r.status), status: r.status } };
          if (r.json && r.json.access_token) { var s = norm(r.json); save(s); return { data: { user: s.user, session: s }, error: null }; }
          return { data: { user: (r.json && r.json.user) || r.json, session: null }, error: null };
        }, function () { return { data: { user: null, session: null }, error: { message: NET } }; });
      },
      signOut: function () {
        var s = load(); save(null);
        if (!s) return Promise.resolve({ error: null });
        return authCall("logout", {}, s.access_token).then(function () { return { error: null }; }, function () { return { error: null }; });
      }
    };

    /* ---------- reading and saving data ---------- */
    function Q(table) { this.t = table; this.m = "GET"; this.p = []; this.o = []; this.pf = []; this.body = null; this.head = false; this.mode = null; }
    var P = Q.prototype;
    function val(v) { return v === null ? "null" : String(v); }
    function listVal(v) {
      var s = val(v);
      return /[,()"\s]/.test(s) ? '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"' : s;
    }
    P.select = function (c, o) {
      o = o || {};
      if (this.m !== "GET") this.pf.push("return=representation");
      this.p.push(["select", (c == null || c === "") ? "*" : String(c).replace(/\s+/g, "")]);
      if (o.count) this.pf.push("count=" + o.count);
      if (o.head) this.head = true;
      return this;
    };
    P.insert = function (rows) { this.m = "POST"; this.body = rows; return this; };
    P.upsert = function (rows, o) {
      o = o || {}; this.m = "POST"; this.body = rows;
      this.pf.push("resolution=" + (o.ignoreDuplicates ? "ignore" : "merge") + "-duplicates");
      if (o.onConflict) this.p.push(["on_conflict", o.onConflict]);
      return this;
    };
    P.update = function (v) { this.m = "PATCH"; this.body = v; return this; };
    P.delete = function () { this.m = "DELETE"; return this; };
    ["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is"].forEach(function (op) {
      P[op] = function (c, v) { this.p.push([c, op + "." + val(v)]); return this; };
    });
    P["in"] = function (c, arr) { this.p.push([c, "in.(" + arr.map(listVal).join(",") + ")"]); return this; };
    P.order = function (c, o) {
      o = o || {};
      this.o.push(c + "." + (o.ascending === false ? "desc" : "asc") + (o.nullsFirst === true ? ".nullsfirst" : o.nullsFirst === false ? ".nullslast" : ""));
      return this;
    };
    P.limit = function (n) { this.p.push(["limit", n]); return this; };
    P.range = function (a, b) { this.p.push(["offset", a]); this.p.push(["limit", b - a + 1]); return this; };
    P.single = function () { this.mode = "single"; return this; };
    P.maybeSingle = function () { this.mode = "maybe"; return this; };
    P._run = function () {
      var self = this;
      return token().then(function (tok) {
        var q = new URLSearchParams();
        self.p.forEach(function (x) { q.append(x[0], x[1]); });
        if (self.o.length) q.set("order", self.o.join(","));
        var h = hdrs(tok, { "Content-Type": "application/json" }), pf = self.pf.slice();
        if (self.m !== "GET" && pf.indexOf("return=representation") < 0) pf.push("return=minimal");
        if (pf.length) h.Prefer = pf.join(",");
        var method = (self.m === "GET" && self.head) ? "HEAD" : self.m, opts = { method: method, headers: h };
        if (self.body !== null && method !== "GET" && method !== "HEAD") opts.body = JSON.stringify(self.body);
        var qs = q.toString();
        return fetch(url + "/rest/v1/" + encodeURIComponent(self.t) + (qs ? "?" + qs : ""), opts).then(function (r) {
          return (method === "HEAD" ? Promise.resolve("") : r.text()).then(function (text) {
            var j = parse(text), count = null, cr = r.headers.get("content-range");
            if (cr && cr.indexOf("/") > -1) { var n = cr.split("/")[1]; if (n !== "*") count = +n; }
            if (!r.ok) return { data: null, error: { message: errMsg(j, r.status), code: j && j.code, details: j && j.details, hint: j && j.hint }, count: null, status: r.status };
            var data = j;
            if (self.mode) {
              var a = Array.isArray(j) ? j : (j == null ? [] : [j]);
              if (self.mode === "maybe") {
                if (a.length > 1) return { data: null, error: { message: "More than one row was returned", code: "PGRST116" }, count: count, status: 406 };
                data = a[0] || null;
              } else {
                if (a.length !== 1) return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" }, count: count, status: 406 };
                data = a[0];
              }
            } else if (method === "HEAD") { data = null; }
            return { data: data, error: null, count: count, status: r.status };
          });
        }, function () { return { data: null, error: { message: NET }, count: null, status: 0 }; });
      });
    };
    P.then = function (a, b) { return this._run().then(a, b); };

    function rpc(name, args) {
      return token().then(function (tok) {
        return fetch(url + "/rest/v1/rpc/" + encodeURIComponent(name), {
          method: "POST", headers: hdrs(tok, { "Content-Type": "application/json" }), body: JSON.stringify(args || {})
        }).then(function (r) {
          return r.text().then(function (t) {
            var j = parse(t);
            if (!r.ok) return { data: null, error: { message: errMsg(j, r.status), code: j && j.code, details: j && j.details, hint: j && j.hint }, status: r.status };
            return { data: j, error: null, status: r.status };
          });
        }, function () { return { data: null, error: { message: NET } }; });
      });
    }

    /* ---------- files ---------- */
    var storage = {
      from: function (bucket) {
        return {
          upload: function (path, file, o) {
            o = o || {};
            return token().then(function (tok) {
              var fd = new FormData(); fd.append("cacheControl", "3600"); fd.append("", file);
              return fetch(url + "/storage/v1/object/" + bucket + "/" + encPath(path), {
                method: "POST", headers: hdrs(tok, { "x-upsert": o.upsert ? "true" : "false" }), body: fd
              }).then(function (r) {
                return r.text().then(function (t) {
                  var j = parse(t);
                  if (!r.ok) return { data: null, error: { message: (j && (j.message || j.error)) || ("Upload failed (" + r.status + ")") } };
                  return { data: { path: path, id: j && j.Id, fullPath: j && j.Key }, error: null };
                });
              }, function () { return { data: null, error: { message: NET } }; });
            });
          },
          getPublicUrl: function (path) {
            return { data: { publicUrl: url + "/storage/v1/object/public/" + bucket + "/" + encPath(path) } };
          },
          createSignedUrl: function (path, secs) {
            return token().then(function (tok) {
              return fetch(url + "/storage/v1/object/sign/" + bucket + "/" + encPath(path), {
                method: "POST", headers: hdrs(tok, { "Content-Type": "application/json" }), body: JSON.stringify({ expiresIn: secs })
              }).then(function (r) {
                return r.text().then(function (t) {
                  var j = parse(t);
                  if (!r.ok || !j || !j.signedURL) return { data: null, error: { message: (j && (j.message || j.error)) || "Could not open the file" } };
                  return { data: { signedUrl: url + "/storage/v1" + j.signedURL }, error: null };
                });
              }, function () { return { data: null, error: { message: NET } }; });
            });
          }
        };
      }
    };

    /* ---------- live updates (the pages also refresh every few seconds, so this is a bonus) ---------- */
    function channel(name) {
      var ch = { subs: [], ws: null, hb: null, closed: false, ref: 1, tries: 0 };
      function send(o) { try { if (ch.ws && ch.ws.readyState === 1) ch.ws.send(JSON.stringify(o)); } catch (e) {} }
      function open() {
        if (typeof WebSocket === "undefined" || ch.closed) return;
        token().then(function (tok) {
          if (ch.closed) return;
          var ws;
          try { ws = new WebSocket(url.replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(key) + "&vsn=1.0.0"); } catch (e) { return; }
          ch.ws = ws;
          ws.onopen = function () {
            ch.tries = 0;
            send({
              topic: "realtime:" + name, event: "phx_join", ref: String(ch.ref++), join_ref: "1",
              payload: {
                config: {
                  broadcast: { ack: false, self: false }, presence: { key: "" }, private: false,
                  postgres_changes: ch.subs.map(function (x) {
                    var o = { event: x.f.event || "*", schema: x.f.schema || "public" };
                    if (x.f.table) o.table = x.f.table;
                    if (x.f.filter) o.filter = x.f.filter;
                    return o;
                  })
                },
                access_token: tok || key
              }
            });
            ch.hb = setInterval(function () { send({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(ch.ref++) }); }, 25000);
          };
          ws.onmessage = function (m) {
            var d = parse(m.data);
            if (!d || d.event !== "postgres_changes") return;
            var x = d.payload && d.payload.data;
            if (!x) return;
            ch.subs.forEach(function (s) {
              var f = s.f;
              if (f.table && f.table !== x.table) return;
              if (f.event && f.event !== "*" && f.event !== x.type) return;
              if (f.filter) {
                var mm = /^([^=]+)=eq\.(.*)$/.exec(f.filter);
                if (mm && String((x.record || x.old_record || {})[mm[1]]) !== mm[2]) return;
              }
              try { s.cb({ schema: x.schema, table: x.table, commit_timestamp: x.commit_timestamp, eventType: x.type, "new": x.record || {}, old: x.old_record || {}, errors: x.errors }); } catch (e) {}
            });
          };
          ws.onclose = function () { clearInterval(ch.hb); if (!ch.closed) { ch.tries++; setTimeout(open, Math.min(30000, 2000 * ch.tries)); } };
          ws.onerror = function () { try { ws.close(); } catch (e) {} };
        });
      }
      ch.on = function (type, filter, cb) { if (type === "postgres_changes") ch.subs.push({ f: filter || {}, cb: cb }); return ch; };
      ch.subscribe = function () { ch.closed = false; open(); return ch; };
      ch.unsubscribe = function () { ch.closed = true; clearInterval(ch.hb); try { if (ch.ws) ch.ws.close(); } catch (e) {} };
      return ch;
    }

    return {
      auth: auth,
      from: function (t) { return new Q(t); },
      rpc: rpc,
      storage: storage,
      channel: channel,
      removeChannel: function (ch) { if (ch && ch.unsubscribe) ch.unsubscribe(); }
    };
  }

  window.supabase = { createClient: createClient };
})();
