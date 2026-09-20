import { chromium } from './browser.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch();const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:1440,height:900}});
const routes=['/','/programs','/features','/about','/campus-delegate','/campus-partners','/careers','/reviews','/privacy-policy','/terms','/return-policy','/login','/request-callback','/programs/generative-ai'];
const results=[];
for(const route of routes){
 await page.goto('http://localhost:5173'+route,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);
 const compare=await page.evaluate(()=>{
  const sheet=[...document.styleSheets].find(s=>s.ownerNode?.getAttribute('data-vite-dev-id')?.endsWith('/responsive.css'));
  const elements=[...document.querySelectorAll('main h1,main h2,main h3,main p,.site-header,.site-header__brand,.public-footer')];
  const measure=()=>elements.map(e=>({text:e.textContent.slice(0,50),...Object.fromEntries(['x','y','width','height'].map(k=>[k,Math.round(e.getBoundingClientRect()[k])]))}));
  const after=measure();if(sheet)sheet.disabled=true;const before=measure();if(sheet)sheet.disabled=false;
  return after.filter((r,i)=>['x','y','width','height'].some(k=>Math.abs(r[k]-before[i][k])>1)).map(r=>({after:r,before:before[after.indexOf(r)]}));
 });results.push({route,changes:compare});console.log(route,compare.length);
 for(const [width,height] of [[360,780],[820,1180]]){
  await page.setViewportSize({width,height});await page.screenshot({path:`tmp/visual-${route.replaceAll('/','')||'home'}-${width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:900});
}
await fs.writeFile('tmp/desktop-regression.json',JSON.stringify(results,null,2));await browser.close();
