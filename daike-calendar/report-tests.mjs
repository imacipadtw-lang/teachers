import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const chunk = (from, to) => script.slice(script.indexOf(from), script.indexOf(to, script.indexOf(from)));
const nodes = new Map();
const node = id => { if (!nodes.has(id)) nodes.set(id, {value:'2026-10', focus(){this.focused=true;}}); return nodes.get(id); };
let messages=[], printed='', requests=[];
const state = {role:'admin',viewing:'甲老師',cred:{name:'王教務',h:'demo'}};
let payload;
const ctx = vm.createContext({
  state, RATE_SUB:405, RATE_TUTOR:133, DOW:['日','一','二','三','四','五','六'],
  KIND:{sub:'代課',leave:'請假',tutor:'代導師',tutorLeave:'請假',swap:'調課'},
  $:node, isAll:()=>state.viewing==='__all__',
  describe:e=>({w:e.who,f:''}), esc:s=>String(s??'').replace(/</g,'&lt;'),
  rangeLabel:r=>r, printedAt:()=> '115 年 10 月 23 日',
  inTerm:d=>d>='2026-08-31'&&d<='2027-01-20',
  toast:m=>messages.push(m),busy:()=>{},
  printSheets:s=>printed=s,
  fetchData:async(...args)=>{requests.push(args);return payload;}
});
vm.runInContext(chunk('const feeOf =','const leaveWord'),ctx);
vm.runInContext(chunk('function tally(', 'function monthSummary('),ctx);
vm.runInContext(chunk('function tableRows(', 'function totalsFor('),ctx);
vm.runInContext(chunk('function reportAmountsValid(', '$("#dlExcel").onclick'),ctx);
vm.runInContext(chunk('function bigNum(', '/* ---------- 背景節點'),ctx);
const sub={id:'A1',type:'sub',date:'2026-10-05',period:'1',who:'甲老師',other:'乙老師',cls:'三甲',rate:'405'};
ctx.events=[sub,{...sub,id:'A2',rate:'608'},{...sub,id:'A3',rate:0},{...sub,id:'A4',nofee:true},
  {...sub,type:'leave',who:'甲老師',other:'丙老師'},{...sub,type:'tutor',days:0.5}];
assert.equal(vm.runInContext('tally(events).subFee',ctx),1013);
assert.equal(vm.runInContext('tally(events).tutorFee',ctx),66.5);
assert.equal(vm.runInContext('tableRows(events).reduce((s,r)=>s+r.fee,0)',ctx),1079.5);
assert.equal(vm.runInContext('tableRows(events)[0].date',ctx),'2026-10-05');
assert.equal(vm.runInContext('tableRows(events)[4].fee',ctx),0);
assert.equal(vm.runInContext('reportAmountsValid([{type:"sub",rate:"錯誤"}])',ctx),false);
assert.equal(vm.runInContext('reportAmountsValid([{type:"sub",rate:-1}])',ctx),false);
const handler=node('#openSign').onclick;
node('#rangeSel').value='';
await handler();
assert.equal(requests.length,0);
assert.equal(node('#rangeSel').focused,true);
node('#rangeSel').value='2026-10';
state.role='teacher';
await handler();
assert.equal(requests.length,0);
state.role='admin';
payload={ok:false,error:'讀取失敗'};
await handler();
assert.equal(printed,'');
payload={ok:true,role:'admin',viewing:'甲老師',events:[sub]};
await handler();
assert.equal(printed,'');
payload={ok:true,role:'admin',viewing:'__all__',events:[{...sub,flags:['衝堂待確認']}]};
await handler();
assert.deepEqual(requests.at(-1),['王教務','demo','__all__',true]);
assert.ok(printed.includes('待核對草稿'));
assert.ok(printed.includes('不表示款項已收訖'));
assert.ok(printed.includes('405'));
printed='';
payload={...payload,events:[{...sub,rate:'格式錯誤'}]};
await handler();
assert.equal(printed,'');
assert.ok(messages.at(-1).includes('格式有誤'));
console.log('PASS: script syntax, numeric totals, zero rate, excluded entries, half-day totals, personal leave, full dates, invalid amounts, month selection, role gate, failed/incomplete responses, fresh data request, draft and signature wording.');
