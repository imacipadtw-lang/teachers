/* 本土語直播共學代課費只算「直播共學老師」請假的（115.11.27）。執行：node daike-calendar/tests/live-teacher.js
 * 直播共學老師請假 → 本土語直播共學代課費（另一個會計科目）；另一位本土語老師請假 → 校內代課鐘點費。 */
const fs = require("fs"), path = require("path"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const i = html.indexOf("var PAY = (function"), j = html.indexOf("})();", i) + 5;
const PAY = new Function(html.slice(i, j) + "; return PAY;")();
const a = html.indexOf("const FEE_ON_RE"), b = html.indexOf("async function apiPost0");
const F = new Function(html.slice(a, b) + "; return { nameHash, LIVE_T, isLiveTeacher, liveLeaverOf, feeFix };")();
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; console.log("  ✓ " + m); };
ok(F.LIVE_T.size === 1, "設定了一位直播共學老師（姓名雜湊，倉庫裡沒有姓名）");
ok(!F.isLiveTeacher("己老師") && !F.isLiveTeacher("") && !F.isLiveTeacher(undefined), "其他人、空白都不是直播共學老師");
F.LIVE_T.add(F.nameHash("己老師"));                             // 測試用：把「己老師」當成直播共學老師
ok(F.isLiveTeacher(" 己老師 "), "前後空白不影響");
const base = { type: "sub", date: "2026-11-27", period: "2", cls: "五甲", subject: "本土語/客家語海陸腔", nofee: true, exempt: "本土語直播共學", rate: 405 };
const mk = (o) => F.feeFix(Object.assign({}, base, o));
const live1 = mk({ id: "L1", who: "甲老師", other: "己老師" });                   // 直播共學老師請假
const reg1  = mk({ id: "R1", who: "乙老師", other: "庚老師" });                   // 本土語老師請假
const reg2  = mk({ id: "R2", who: "丙老師", other: "辛老師", period: "3", cls: "三甲", subject: "本土語/卡群布農語" });
const dup2  = mk({ id: "R3", who: "乙老師", other: "庚老師", flags: ["重複登錄（和 R1 相同），不重複計算"] });
const dup1  = mk({ id: "R4", who: "丁老師", other: "壬老師", date: "2026-11-20", flags: ["這筆有重複登錄（R4、R5），只算一次"] });
const hol   = mk({ id: "R6", who: "丁老師", other: "壬老師", date: "2026-11-13", flags: ["國定假日還有代課紀錄"] });
const self  = mk({ id: "S1", who: "丁老師", other: "壬老師", self: true });
const lvLeave = F.feeFix({ type: "leave", who: "庚老師", other: "乙老師", date: "2026-11-27", period: "2", nofee: true, exempt: "本土語直播共學" });
const tut   = F.feeFix({ type: "tutor", who: "丙老師", other: "庚老師", date: "2026-11-27", days: 1, cls: "五甲", nofee: true, exempt: "本土語直播共學", rate: 133 });
ok(live1.nofee && live1.exempt === "本土語直播共學" && PAY.isLive(live1), "直播共學老師請假：照舊列本土語直播共學代課費");
ok(!reg1.nofee && reg1.exempt === "" && reg1.liveReg && !PAY.isLive(reg1), "本土語老師請假（客家語）：改算校內代課費");
ok(!reg2.nofee && !PAY.isLive(reg2), "本土語老師請假（原住民語）：改算校內代課費");
ok(dup2.nofee && !PAY.isLive(dup2), "重複登錄的第二筆：兩邊都不算");
ok(!dup1.nofee, "重複登錄的第一筆：照算一次");
ok(hol.nofee && !PAY.isLive(hol), "假日的紀錄：照舊不計");
ok(self.exempt === "本土語直播共學" && self.self, "費用自理的不動");
ok(lvLeave.exempt === "" && F.liveLeaverOf(lvLeave) === "庚老師", "請假那一筆（本土語老師）也一起改");
ok(!tut.nofee && !PAY.isLive(tut), "代導師同樣看請假的是誰");
const ctx = { events: [live1, reg1, reg2, dup2, dup1, hol, self, tut], heli: [], rateSub: 405, rateTutor: 133 };
const A = PAY.acct(ctx, "2026-11"), L = PAY.live(ctx, "2026-11");
ok(L.total === 405 && L.n === 1 && L.T["甲老師"] && !L.T["乙老師"], "本土語直播共學代課費只有 1 節 405（代直播共學老師那一節）");
ok(A.T["乙老師"].amt === 405 && A.T["丙老師"].amt === 405 && A.T["丁老師"].amt === 405 && A.tfee === 133, "校內代課：代本土語老師的節照 405 算、代導 133（重複只算一次、假日不算）");
ok(A.total === 405 * 3 + 133 && A.total === A.byTeacher && A.total === A.recSum, "校內代課合計 1,348 元，三方核對一致");
console.log(`✓ 直播共學老師 ${n} 項全部通過`);
