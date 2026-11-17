const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});const e=[];p.on('pageerror',x=>e.push(x.message));p.on('console',m=>{if(m.type()==='error')e.push(m.text())});
const f=(process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html');
await p.goto(f+'#home');console.log('CHARS',await p.evaluate(()=>window.CHARS.length),'svgs on home',await p.$$eval('.cell svg',x=>x.length));
await p.screenshot({path:'a-home.png'});
await p.goto(f+'#spin');console.log('wheel segs',await p.$$eval('.wseg',x=>x.length));
await p.click('#sp-hub');await p.waitForTimeout(600);await p.screenshot({path:'a-spin-mid.png'});await p.waitForTimeout(4200);
const word=await p.textContent('#sp-word');
// verify the segment under the pointer is the landed word
const check=await p.evaluate(()=>{const el=document.querySelector('#sp-wheel');const m=el.style.transform.match(/rotate\(([-\d.]+)deg\)/);const rot=+m[1];const n=document.querySelectorAll('.wseg').length;const seg=360/n;const idx=Math.round((((360-rot%360)%360)+360)%360/seg)%n;return {rot:Math.round(rot),idx,n};});
console.log('landed',word,'pointer idx',check, 'word at idx', ['rice','cream','egg','hamburger','cake','apple','noodle','fish','dumpling','chicken','naan','curry','samosa'][check.idx]);
await p.screenshot({path:'a-spin.png'});
await p.keyboard.press('1');console.log('box1',(await p.textContent('.box.b1')).replace(/\s+/g,' ').slice(0,60));
await p.goto(f+'#catch');await p.click('#c-start');await p.waitForTimeout(1600);console.log('opt svgs',await p.$$eval('.opt svg',x=>x.length));await p.click('.opt >> nth=0');await p.waitForTimeout(300);await p.screenshot({path:'a-catch.png'});
await p.goto(f+'#impostor');await p.click('#i-none');await p.waitForTimeout(300);await p.screenshot({path:'a-imp.png'});
await p.goto(f+'#words');await p.click('#ic-emoji');await p.goto(f+'#catch');await p.click('#c-start');await p.waitForTimeout(1500);console.log('emoji mode svgs',await p.$$eval('.opt svg',x=>x.length),'emo',await p.$$eval('.opt .emo',x=>x.length));
await p.goto(f+'#words');await p.click('#ic-clay');
await p.setViewportSize({width:390,height:844});for(const v of ['home','spin','catch','card','evidence']){await p.goto(f+'#'+v);await p.waitForTimeout(100);const o=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>0)console.log('overflow',v,o);}
await p.goto(f+'#spin');await p.screenshot({path:'a-spin-phone.png',fullPage:true});
console.log('ERR',e);await b.close();})();
