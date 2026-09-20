import { chromium } from './browser.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch();const page=await browser.newPage({reducedMotion:'reduce',hasTouch:true});
const sizes=[[375,667],[393,852],[430,932],[360,780],[412,915],[768,1024],[820,1180],[1024,1366],[800,1280],[1280,720],[1440,900],[1920,1080]].flatMap(([w,h])=>[[w,h],[h,w]]);
const results=[];
function check(ok,label){results.push({label,ok});if(!ok)console.log('FAIL',label)}
for(const [width,height] of sizes){
 await page.setViewportSize({width,height}); await page.goto('http://localhost:5173/programs',{waitUntil:'domcontentloaded'});
 const menu=page.getByRole('button',{name:'Open navigation menu'});
 if(width<=1220){
  check(await menu.isVisible(),`menu available ${width}x${height}`);
  if(await menu.isVisible()){
   await menu.click(); const mobile=page.locator('#site-mobile-menu');
   check(await mobile.isVisible(),`menu opens ${width}x${height}`);
   const rect=await mobile.boundingBox();check(rect&&rect.y>=0&&rect.y+rect.height<=height,`menu fits ${width}x${height}`);
   await page.keyboard.press('Escape');check(await menu.getAttribute('aria-expanded')==='false',`menu Escape ${width}x${height}`);
   check(await menu.evaluate(e=>e===document.activeElement),`menu restores focus ${width}x${height}`);
   await menu.click();await mobile.getByRole('link',{name:'Login',exact:true}).click();check(page.url().includes('/login'),`menu link ${width}x${height}`);
  }
 }
 await page.goto('http://localhost:5173/programs/generative-ai',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Continue to registration',exact:true}).click();
 const dialog=page.getByRole('dialog'); await dialog.waitFor();
 const box=await dialog.boundingBox();check(box&&box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=height+1,`registration fits ${width}x${height}`);
 const submit=dialog.locator('button[type=submit]'); await submit.scrollIntoViewIfNeeded();check(await submit.isVisible(),`registration submit reachable ${width}x${height}`);
 const sb=await submit.boundingBox();check(sb&&sb.y>=0&&sb.y+sb.height<=height,`registration submit in viewport ${width}x${height}`);
 await page.keyboard.press('Tab');check(await dialog.evaluate(e=>e.contains(document.activeElement)),`registration traps focus ${width}x${height}`);
 if(width===360&&height===780)await page.screenshot({path:'tmp/registration-mobile.png'});
 await page.keyboard.press('Escape');check(await dialog.count()===0,`registration Escape ${width}x${height}`);
 check(await page.evaluate(()=>document.body.style.overflow!=='hidden'),`registration unlocks body ${width}x${height}`);
 console.log('Interactions',width,height);
}
for(const route of ['/','/programs/generative-ai','/campus-delegate','/campus-partners','/careers']){
 await page.setViewportSize({width:360,height:780});await page.goto('http://localhost:5173'+route,{waitUntil:'domcontentloaded'});
 const summaries=page.locator('summary');for(let i=0;i<await summaries.count();i++){const wasOpen=await summaries.nth(i).evaluate(e=>e.parentElement.open);await summaries.nth(i).click();check(await summaries.nth(i).evaluate(e=>e.parentElement.open)!==wasOpen,`${route} accordion ${i}`)}
}
await page.goto('http://localhost:5173/programs');await page.getByRole('textbox',{name:'Search programs'}).fill('full stack');check(await page.locator('.pc-card').count()===1,'program search');
await page.getByRole('button',{name:'Reset',exact:true}).click();await page.getByRole('button',{name:'Load More Programs'}).click();check(await page.locator('.pc-card').count()>6,'load more programs');
await page.getByRole('button',{name:'Save Full Stack Web Development',exact:true}).click();check(await page.getByRole('button',{name:'Unsave Full Stack Web Development',exact:true}).getAttribute('aria-pressed')==='true','save program');
await fs.writeFile('tmp/interaction-audit.json',JSON.stringify(results,null,2));await browser.close();

if(results.some(r => !r.ok)) process.exitCode = 1;
