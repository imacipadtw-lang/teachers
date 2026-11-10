// 測試用：在 Node 裡執行 Code.gs（模擬 Apps Script 的試算表、指令碼屬性、快取等服務），並提供前端靜態檔
// 用法：node server.js <homework-check 目錄> [port]（一般請用 run.sh）
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const ROOT = path.resolve(process.argv[2]); const PORT = +process.argv[3] || 8787;
const LOG = []; // 記錄後端收到的請求（檢查密碼是否出現在網址）
const HANG = { on: false, list: [] }; // 模擬 Google 卡住不回應：/__hang 開、/__unhang 關（並切斷卡住的連線）

function makeEnv() {
  const props = {}; const cache = {};
  const sheets = {};
  function mkSheet(name) {
    const rows = []; // 二維陣列，1-based 對應
    const rangeObj = (r, c, nr, nc) => {
      nr = nr || 1; nc = nc || 1;
      const o = {
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => ((rows[r - 1 + i] || [])[c - 1 + j]) ?? '')),
        setValues: v => { v.forEach((row, i) => { rows[r - 1 + i] = rows[r - 1 + i] || []; row.forEach((x, j) => { rows[r - 1 + i][c - 1 + j] = x; }); }); return o; },
        setValue: x => o.setValues([[x]]),
      };
      ['setFontWeight', 'setBackground', 'setHorizontalAlignment'].forEach(k => { o[k] = () => o; });
      return o;
    };
    return {
      _rows: rows, getName: () => name,
      getLastRow: () => { let n = rows.length; while (n > 0 && !(rows[n - 1] || []).some(x => x !== '' && x != null)) n--; return n; },
      getRange: rangeObj, appendRow: v => { const n = sheets[name].getLastRow(); rows[n] = v.slice(); },
      deleteRow: i => rows.splice(i - 1, 1), setFrozenRows: () => { }, clear: () => { rows.length = 0; }, autoResizeColumns: () => { }
    };
  }
  const ss = { getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = mkSheet(n)), getUrl: () => 'https://docs.google.com/spreadsheets/d/TEST', getId: () => 'TEST' };
  const ctx = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); }, deleteProperty: k => { delete props[k]; } }) },
    CacheService: { getScriptCache: () => ({ get: k => { const e = cache[k]; return e && e.exp > Date.now() ? e.v : null; }, put: (k, v, s) => { cache[k] = { v: String(v), exp: Date.now() + (s || 600) * 1000 }; }, remove: k => { delete cache[k]; } }) },
    SpreadsheetApp: { openById: () => ss, getActiveSpreadsheet: () => null, create: () => ss },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => { }, releaseLock: () => { } }) },
    Utilities: { getUuid: () => crypto.randomUUID(), formatDate: d => d.toISOString(), sleep: () => { } },
    ContentService: { createTextOutput: t => ({ _t: t, setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
    Logger: { log: m => console.log('[Logger]', m) },
    console, Date, JSON, Math, String, Number, Object, Array, Error, parseInt, isNaN
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'apps-script/Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
  const counter = { reads: 0 }; const orig = ctx.readAll_; ctx.readAll_ = function () { counter.reads++; return orig.apply(this, arguments); };
  return { ctx, props, sheets, cache, counter };
}
let env = makeEnv();

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__reset') { env = makeEnv(); LOG.length = 0; res.end('ok'); return; }
  if (u.pathname === '/__sheet') { const sh = env.sheets[u.searchParams.get('name')]; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(sh ? sh._rows : null)); return; }
  if (u.pathname === '/__breaklog') { env.ctx.Utilities.formatDate = function () { throw new Error('boom'); }; res.end('ok'); return; }
  if (u.pathname === '/__hang') { HANG.on = true; res.end('ok'); return; }
  if (u.pathname === '/__unhang') { HANG.on = false; HANG.list.forEach(r => { try { r.socket.destroy(); } catch (e) { } }); HANG.list = []; res.end('ok'); return; }
  if (u.pathname === '/__reads') { res.end(String(env.counter.reads)); return; }
  if (u.pathname === '/__log') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(LOG)); return; }
  if (u.pathname === '/__seed') { // 建立測試資料：密碼 test1234、3 班、每班 6 人
    let body = ''; req.on('data', c => body += c); req.on('end', () => {
      const c = env.ctx; env.props.EDIT_KEY = 'test1234'; c.setupData_();
      const cfg = c.readAll_().config;
      const names = ['王小明', '李小華', '陳大同', '林美美', '張家豪', '黃怡君'];
      cfg.classes = cfg.classes.slice(0, 3).map((cl, i) => Object.assign(cl, { teacher: '測試' + (i + 1), students: names.map((n, j) => ({ no: j + 1, name: n })) }));
      c.put_('config', cfg); c.ensureAuth_(cfg, c.readAll_().auth); c.bump_();
      res.end('ok');
    }); return;
  }
  if (u.pathname === '/exec') {
    if (HANG.on) { HANG.list.push(res); return; } // 永遠不回應
    const fail = () => { if (process.env.FAIL_EXEC === '1' || fs.existsSync(path.join(__dirname, 'OFFLINE'))) { req.socket.destroy(); return true; } return false; };
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'GET') {
      if (fail()) return;
      LOG.push({ m: 'GET', url: req.url });
      const p = Object.fromEntries(u.searchParams);
      const out = env.ctx.doGet({ parameter: p }); res.setHeader('Content-Type', 'application/json'); res.end(out._t); return;
    }
    let body = ''; req.on('data', c => body += c); req.on('end', () => {
      if (fail()) return;
      LOG.push({ m: 'POST', url: req.url, body });
      const out = env.ctx.doPost({ postData: { contents: body } }); res.setHeader('Content-Type', 'application/json'); res.end(out._t);
    }); return;
  }
  let p = u.pathname.replace(/^\/+/, ''); if (!p || p.endsWith('/')) p += 'index.html';
  if (p === 'config.js') { res.setHeader('Content-Type', TYPES['.js']); res.end(fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8').replace(/apiUrl:\s*"[^"]*"/, 'apiUrl: "http://localhost:' + PORT + '/exec"').replace(/pollSeconds:\s*\d+/, 'pollSeconds: 45, timeoutMs: 1500').replace(/teacherLogin:\s*(true|false)/, 'teacherLogin: true')); return; }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.statusCode = 404; res.end('nf'); return; }
  res.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f));
}).listen(PORT, () => console.log('harness on', PORT, ROOT));
