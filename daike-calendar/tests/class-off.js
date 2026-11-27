/* 班級停課（115.11.27）：只有某一班停課（例：六甲畢業典禮），合理員額老師上那班的節不計薪，其他班照常。執行：node daike-calendar/tests/class-off.js */
const fs = require("fs"), path = require("path"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const i = html.indexOf("var PAY = (function"), j = html.indexOf("})();", i) + 5;
const PAY = new Function(html.slice(i, j) + "; return PAY;")();
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; console.log("  ✓ " + m); };
const T = "甲老師";
const tt = { "五|5|六甲": { subject: "視覺藝術", teachers: [T] }, "五|6|六甲": { subject: "視覺藝術", teachers: [T] },
  "五|3|一甲": { subject: "視覺藝術", teachers: [T] }, "五|3|二甲": { subject: "視覺藝術", teachers: [T] }, "五|3|低年級": { subject: "視覺藝術", teachers: [T] },
  "四|1|三甲": { subject: "視覺藝術", teachers: [T] } };
const tSlot = { ["五|5|" + T]: ["六甲"], ["五|6|" + T]: ["六甲"], ["五|3|" + T]: ["一甲", "二甲"], ["四|1|" + T]: ["三甲"] };
const base = { events: [], meta: { tt, tSlot }, heli: [T], off: {}, term: { from: "2026-08-31", to: "2027-01-20" }, rateSub: 405, rateComb: 608 };
const run = (o) => PAY.heli(Object.assign({}, base, o), "2026-11").T[0];
const H0 = run({});
ok(H0.units === 18 && H0.amt === 18 * 405, "沒有停課：11 月 4 個週五（1＋1＋1.5）＋4 個週四 1 節＝18 節");
const H1 = run({ classOff: { "2026-11-27": [{ name: "六甲畢業典禮", classes: ["六甲"] }] } });
ok(H1.units === 16 && H1.amt === 16 * 405, "11/27 六甲停課：第5、6節不計，少 2 節（810 元）");
const l27 = H1.L.filter(l => l.date === "2026-11-27");
ok(l27.filter(l => l.st === "off").length === 2 && l27.find(l => l.p === "3").st === "self", "同一天別班（一、二甲合班）照常計");
ok(/六甲畢業典禮（六甲停課，不計）/.test(l27.find(l => l.p === "5").why), "明細說明寫「六甲畢業典禮（六甲停課，不計）」");
ok(!H1.warn && !(PAY.heli(Object.assign({}, base, { classOff: { "2026-11-27": [{ name: "六甲畢業典禮", classes: ["六甲"] }] } }), "2026-11").warn || []).some(w => /要不要照給/.test(w)), "管理者已決定不計，不再提醒「要不要照給」");
const H2 = run({ classOff: { "2026-11-20": [{ name: "一甲戶外教學", classes: ["一甲"] }] } });
ok(H2.units === 18, "合班（一甲＋二甲）只有一甲停課：那節照計 1.5");
const H3 = run({ classOff: { "2026-11-13": [{ name: "低年級校外教學", classes: ["一甲"] }, { name: "低年級校外教學", classes: ["二甲"] }] } });
ok(H3.units === 16.5 && H3.pay === 17, "合班兩班都停課（兩列）：那節 1.5 不計，16.5 節進位 17 節");
const R4 = PAY.heli(Object.assign({}, base, { off: { "2026-11-26": { name: "運動會補休", kind: "補假", scope: "全天" } } }), "2026-11");
ok(R4.T[0].units === 17 && R4.warn.some(w => /要不要照給/.test(w)), "全校停課（補假）照舊：不計並提醒要不要照給");
const R5 = PAY.heli(Object.assign({}, base, { off: { "2026-11-27": { name: "颱風假", kind: "颱風假", scope: "全天" } }, classOff: { "2026-11-27": [{ name: "六甲畢業典禮", classes: ["六甲"] }] } }), "2026-11");
ok(R5.T[0].units === 18, "同一天是颱風假：照常計薪（全校的假優先）");
const sub = { type: "sub", who: "乙老師", other: T, date: "2026-11-27", period: "5", cls: "六甲", subject: "視覺藝術", rate: 405, id: "代-T1" };
const lv = Object.assign({}, sub, { type: "leave", who: T, other: "乙老師" });
const R6 = PAY.heli(Object.assign({}, base, { events: [sub, lv], classOff: { "2026-11-27": [{ name: "六甲畢業典禮", classes: ["六甲"] }] } }), "2026-11");
ok(!R6.S["乙老師"] && R6.warn.some(w => /停課（班級停課），不計/.test(w)), "停課那節若有人登記代課：代課費也不計，並提醒");
console.log(`✓ 班級停課 ${n} 項全部通過`);
