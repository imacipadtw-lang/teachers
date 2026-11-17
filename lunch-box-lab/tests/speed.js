const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1280,height:800},permissions:['clipboard-read','clipboard-write']});const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));p.on('console',m=>{if(m.type()==='error')e.push(m.text())});
const f=(process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html');
await p.goto(f+'#home');await p.waitForTimeout(900);await p.screenshot({path:'d-home.png'});
await p.goto(f+'#speed');
const seen=[];
for(let i=0;i<7;i++){await p.keyboard.press('Space');await p.waitForTimeout(200);seen.push((await p.textContent('#sr-seat')).trim());
  if(i===0){await p.waitForTimeout(1200);console.log('sec after 1.4s',await p.textContent('#sr-sec'));await p.screenshot({path:'d-speed.png'});}
  await p.keyboard.press(i%3===2?'2':'1');await p.waitForTimeout(150);}
console.log('draw order',seen);
console.log('board',(await p.textContent('#sr-board')).replace(/\s+/g,' '));
// timeout path
await p.keyboard.press('Space');await p.waitForTimeout(10800);console.log('after timeout frame:',await p.textContent('#sr-frame'),'| ok disabled?',await p.isDisabled('#sr-ok'));
await p.keyboard.press('2');
await p.goto(f+'#evidence');console.log((await p.textContent('.view')).replace(/\s+/g,' ').match(/每位同學的口說.{0,260}/)[0]);
await p.click('#ev-copy');await p.waitForTimeout(200);console.log((await p.evaluate(()=>navigator.clipboard.readText())).split('\n').filter(l=>l.startsWith('口說')||l.startsWith('兩組')));
await p.goto(f+'#teacher');console.log('groups',(await p.textContent('.groups')).replace(/\s+/g,' '));
for(const w of [390,820]){await p.setViewportSize({width:w,height:900});for(const v of ['home','speed','evidence']){await p.goto(f+'#'+v);await p.waitForTimeout(100);const o=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>0)console.log('overflow',w,v,o);}}
await p.setViewportSize({width:390,height:844});await p.goto(f+'#home');await p.waitForTimeout(900);await p.screenshot({path:'d-home-phone.png'});
console.log('ERR',e);await b.close();})();
