/* ============================================================================
 * 代課調課網站「程式伺服器」：先登入，才把網站程式交出去（115.11.9）
 * 著作權所有 (c) 2025-2026 imacipadtw-lang，保留一切權利。詳見倉庫 LICENSE。
 *
 * 這是一個「獨立」的 Apps Script 專案（不要貼進原本的後端）。
 * 運作方式：
 *   1. 公開網址只有登入頁。老師（教務組／會計）輸入密碼後，登入頁把「姓名＋密碼雜湊」送到這裡。
 *   2. 這裡拿去問原本的後端（MAIN_API 的 action=data）：密碼對、而且是可以登入的人才繼續。
 *   3. 從「私人」GitHub 倉庫讀出完整網站程式，連同後端回來的資料一起交給登入頁。
 *   密碼錯、或不是可以登入的人，什麼程式都拿不到。
 *
 * 指令碼屬性（專案設定 → 指令碼屬性），金鑰只放這裡，不要貼到任何地方：
 *   MAIN_API   原本後端的網址（/exec 結尾，網站 index.html 裡 API_URL 那一個）
 *   GH_TOKEN   GitHub 細粒度權杖（Fine-grained token）：只選私人程式倉庫、權限 Contents＝Read-only
 *   GH_REPO    私人程式倉庫，例如 imacipadtw-lang/daike-src
 *   GH_PATH    （可省略）程式檔名，預設 index.html
 *   GH_REF     （可省略）分支，預設 main
 *
 * 部署：部署 → 新增部署作業 → 類型「網頁應用程式」→ 執行身分「我」→ 誰可以存取「所有人」→ 部署，
 *       把網址交給 Claude 填進網站。之後這個檔案有更新時：管理部署作業 → 編輯 → 新版本 → 部署。
 * ========================================================================== */

var CODE_CACHE_SEC = 300;          // 程式在這裡暫存 5 分鐘（推新版後最多 5 分鐘生效）
var CHUNK = 30000;                 // CacheService 每格上限 100KB，中文一字 3 位元組，所以 3 萬字一格
var FAIL_MAX = 10, FAIL_SEC = 600; // 同一個名字 10 分鐘內錯 10 次就暫停 10 分鐘

function doPost(e) {
  var out;
  try {
    var b = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (b.action === "ping") return json_({ ok: true, server: "code", at: new Date().toISOString() });
    if (b.action !== "app") return json_({ ok: false, error: "不支援的動作" });
    var name = String(b.name || "").trim(), h = String(b.h || "").toLowerCase();
    if (!name || name.length > 20 || !/^[0-9a-f]{64}$/.test(h)) return json_({ ok: false, error: "姓名或密碼不正確" });

    var cache = CacheService.getScriptCache(), fk = "fail:" + name, fails = +(cache.get(fk) || 0);
    if (fails >= FAIL_MAX) return json_({ ok: false, error: "密碼錯太多次，請 10 分鐘後再試" });

    var P = PropertiesService.getScriptProperties(), api = P.getProperty("MAIN_API");
    if (!api) return json_({ ok: false, error: "程式伺服器還沒設定 MAIN_API" });
    var r = UrlFetchApp.fetch(api + "?action=data&name=" + encodeURIComponent(name) + "&h=" + h + "&_=" + Date.now(),
                              { muteHttpExceptions: true, followRedirects: true });
    var d;
    try { d = JSON.parse(r.getContentText()); } catch (x) { return json_({ ok: false, error: "後端沒有回應，請稍後再試" }); }
    if (!d || !d.ok) {
      cache.put(fk, String(fails + 1), FAIL_SEC);
      return json_({ ok: false, error: (d && d.error) || "姓名或密碼不正確" });
    }
    if (d.role !== "admin" && d.role !== "acct") return json_({ ok: false, error: "網站目前只開放教務組與會計" });
    cache.remove(fk);
    out = { ok: true, code: code_(), data: d };
  } catch (err) {
    out = { ok: false, error: "程式伺服器錯誤：" + (err && err.message ? err.message : err) };
  }
  return json_(out);
}

function doGet() {
  return ContentService.createTextOutput("代課調課網站程式伺服器：只接受登入後的請求。").setMimeType(ContentService.MimeType.TEXT);
}

/* 從私人 GitHub 倉庫讀網站程式（有暫存） */
function code_() {
  var cache = CacheService.getScriptCache(), n = +(cache.get("code:n") || 0);
  if (n > 0) {
    var keys = []; for (var i = 0; i < n; i++) keys.push("code:" + i);
    var got = cache.getAll(keys), parts = [];
    for (var j = 0; j < n; j++) { if (got["code:" + j] == null) { parts = null; break; } parts.push(got["code:" + j]); }
    if (parts) return parts.join("");
  }
  var P = PropertiesService.getScriptProperties();
  var tok = P.getProperty("GH_TOKEN"), repo = P.getProperty("GH_REPO");
  var path = P.getProperty("GH_PATH") || "index.html", ref = P.getProperty("GH_REF") || "main";
  if (!tok || !repo) throw new Error("還沒設定 GH_TOKEN／GH_REPO");
  var url = "https://api.github.com/repos/" + repo + "/contents/" + encodeURI(path) + "?ref=" + encodeURIComponent(ref);
  var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: {
    Authorization: "Bearer " + tok, Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28" } });
  if (r.getResponseCode() !== 200) throw new Error("讀不到程式（GitHub " + r.getResponseCode() + "），請檢查權杖與倉庫名稱");
  var text = r.getContentText("UTF-8"), put = {}, k = 0;
  for (var s = 0; s < text.length; s += CHUNK) put["code:" + (k++)] = text.slice(s, s + CHUNK);
  try { cache.putAll(put, CODE_CACHE_SEC); cache.put("code:n", String(k), CODE_CACHE_SEC); } catch (x) {}
  return text;
}

/* 手動測試：在編輯器選這個函式按「執行」，執行紀錄會顯示讀到的程式有多大（不會顯示權杖） */
function 測試讀取程式() {
  CacheService.getScriptCache().remove("code:n");
  var t = code_();
  Logger.log("讀到網站程式 " + t.length + " 字，開頭：" + t.slice(0, 60));
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
