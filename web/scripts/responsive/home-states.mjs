import { chromium } from './browser.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch();const page=await browser.newPage({reducedMotion:'reduce',hasTouch:true});const results=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
const check=(ok,label)=>{results.push({ok,label});if(!ok)console.log('FAIL',label)};
const sizes=[[375,667],[393,852],[430,932],[360,780],[412,915],[768,1024],[820,1180],[1024,1366],[800,1280],[1280,720],[1440,900],[1920,1080]].flatMap(([w,h])=>[[w,h],[h,w]]);
for(const [width,height] of sizes){
 await page.setViewportSize({width,height});
 for(const hash of ['register','login']){
  await page.goto('http://localhost:5173/#'+hash,{waitUntil:'domcontentloaded'});const dialog=page.getByRole('dialog');await dialog.waitFor();
  const rect=await dialog.boundingBox();check(rect&&rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+2&&rect.y+rect.height<=height+2,hash+' fits '+width+'x'+height);
  await dialog.locator('button').last().scrollIntoViewIfNeeded();await page.keyboard.press('Tab');check(await dialog.evaluate(e=>e.contains(document.activeElement)),hash+' focus '+width+'x'+height);
  await page.keyboard.press('Escape');check(await dialog.count()===0,hash+' Escape '+width+'x'+height);
 }
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'home width '+width+'x'+height);
 console.log('Home dialogs',width,height);
}
for(const [width,height] of [[360,780],[780,360],[820,1180],[1440,900]]){
 await page.setViewportSize({width,height});await page.goto('http://localhost:5173/');
 const milestones=page.locator('.path-milestones button');for(let i=0;i<await milestones.count();i++){await milestones.nth(i).click();check(await milestones.nth(i).getAttribute('aria-pressed')==='true','milestone '+i+' '+width)}
 const flips=page.locator('.success-flip__toggle');for(let i=0;i<await flips.count();i++){await flips.nth(i).click();check(await flips.nth(i).getAttribute('aria-expanded')==='true','success flip '+i+' '+width);await page.keyboard.press('Escape')}
 await page.getByRole('button',{name:'Next programs',exact:true}).click();check(await page.locator('.directory-refresh__dots button[aria-current]').count()===1,'program carousel '+width);
 await page.getByRole('textbox',{name:'Search Joviq programs'}).fill('generative');check(await page.locator('.directory-course').count()===1,'home program search '+width);
 await page.getByRole('link',{name:'Start Your Journey',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.getByRole('link',{name:'Start Your Journey',exact:true}).click();await page.getByRole('dialog').waitFor();check(true,'registration reopens '+width);
 await page.goto('http://localhost:5173/reviews');const old=await page.locator('.reviews-featured-content').innerText();await page.getByRole('button',{name:'Next student story'}).click();check(await page.locator('.reviews-featured-content').innerText()!==old,'reviews carousel '+width);
}
await fs.writeFile('tmp/home-states.json',JSON.stringify({results,errors},null,2));await browser.close();
if(errors.length||results.some(r=>!r.ok))process.exitCode=1;
