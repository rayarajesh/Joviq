import { chromium } from './browser.mjs';
import fs from 'node:fs/promises';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');
const slugs=await page.evaluate(async()=> (await import('/src/data/siteContent.ts')).allPrograms.map(p=>p.slug));
const routes=['/','/programs','/features','/about','/campus-delegate','/campus-partners','/careers','/reviews','/privacy-policy','/terms','/return-policy','/login','/login?role=admin','/request-callback','/auth/callback','/auth/google/callback','/verify/layout-fixture',...slugs.map(s=>'/programs/'+s),...['Overview','My Program','Projects','Certificates','Payments','Notifications'].map(s=>'/dev/student-dashboard?section='+encodeURIComponent(s))];
const sizes=process.env.FULL ? [[375,667],[393,852],[430,932],[360,780],[412,915],[768,1024],[820,1180],[1024,1366],[800,1280],[1280,720],[1440,900],[1920,1080]].flatMap(([w,h])=>[[w,h],[h,w]]) : [[360,780],[768,1024],[1024,1366],[1440,900]];
const results=[];
for(const route of routes){
 await page.goto('http://localhost:5173'+route,{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(120);
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>{document.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager')});
  await page.waitForTimeout(40);
  const result=await page.evaluate(()=>{
   const w=innerWidth;
   const overflow=[...document.querySelectorAll('body *')].filter(e=>{
    const r=e.getBoundingClientRect(); if(!r.width||!r.height||r.right<=w+2&&r.left>=-2) return false;
    let p=e.parentElement; while(p&&p!==document.body){if(['hidden','clip','auto','scroll'].includes(getComputedStyle(p).overflowX)) return false;p=p.parentElement} return true;
   }).slice(0,12).map(e=>({tag:e.tagName,cls:typeof e.className==='string'?e.className:'svg',right:Math.round(e.getBoundingClientRect().right),text:e.textContent?.slice(0,50)}));
   return {scroll:document.documentElement.scrollWidth,overflow,links:[...document.querySelectorAll("a[href]")].map(e=>e.getAttribute("href")),ids:[...document.querySelectorAll("[id]")].map(e=>e.id),broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src'))};
  });
  results.push({route,width,height,...result});
 }
 console.log(route,results.filter(r=>r.route===route&&(r.overflow.length||r.scroll>r.width+2)).map(r=>r.width+':'+r.overflow.map(e=>e.cls).join(',')).join(' | '));
}
await fs.writeFile('tmp/'+(process.env.FULL?'responsive-final':'responsive-baseline')+'.json',JSON.stringify({routes,sizes,errors,results},null,2));
await page.goto('http://localhost:5173'); await page.setViewportSize({width:360,height:780}); await page.screenshot({path:'tmp/home-mobile.png',fullPage:true});
await browser.close();


if(errors.length || results.some(r => r.scroll > r.width + 2 || r.overflow.length || r.broken.length)) process.exitCode = 1;
