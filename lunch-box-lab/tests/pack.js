const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});const e=[];p.on('pageerror',x=>e.push(x.message));p.on('console',m=>{if(m.type()==='error')e.push(m.text())});
const f=(process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html');
await p.goto(f+'#pack');await p.click('#pk-start');await p.waitForTimeout(1700);
let tot=0;
for(let i=0;i<6;i++){
  // find correct answer by reading the page state: click each option until the slot fills (tests retry/hint logic too)
  await p.waitForTimeout(450);
  const n=await p.$$eval('.shelf .opt',x=>x.length);
  let filled=false;
  for(let k=0;k<n&&!filled;k++){await p.click(`.shelf .opt >> nth=${k}`);await p.waitForTimeout(150);
    filled=await p.$$eval('.shelf .opt',x=>x.every(o=>o.disabled));}
  if(i===0)await p.screenshot({path:'b-pack.png'});
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(500);
console.log('end title:',await p.textContent('h1'));console.log('stars',(await p.textContent('.hud')).replace(/\s+/g,' '));
console.log('menu items',await p.$$eval('.menu-item',x=>x.map(y=>y.textContent.trim().slice(0,32))));
await p.screenshot({path:'b-pack-end.png'});
await p.goto(f+'#card');console.log('card stat:',(await p.textContent('.stats')).replace(/\s+/g,' '));
await p.setViewportSize({width:390,height:844});for(const v of ['pack','card','home']){await p.goto(f+'#'+v);await p.waitForTimeout(100);const o=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>0)console.log('overflow',v,o);}
await p.goto(f+'#pack');await p.click('#pk-start');await p.waitForTimeout(2200);await p.screenshot({path:'b-pack-phone.png',fullPage:true});
console.log('ERR',e);await b.close();})();
