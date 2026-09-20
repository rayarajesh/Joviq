import { chromium } from './browser.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch();const page=await browser.newPage({reducedMotion:'reduce'});const results=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
const sizes=[[375,667],[393,852],[430,932],[360,780],[412,915],[768,1024],[820,1180],[1024,1366],[800,1280],[1280,720],[1440,900],[1920,1080]].flatMap(([w,h])=>[[w,h],[h,w]]);
let valid=true;
await page.route('**/api/v1/public/certificates/verify/**',r=>r.fulfill({json:{succeeded:true,data:{isValid:valid,certificateId:'JOVIQ-CERTIFICATE-RESPONSIVE-2026-123456789',studentName:'Responsive Test Learner',programTitle:'International Business Management',type:'Training',fromDate:'2026-01-01',toDate:'2026-09-01',authorizedSignatory:'Sample Signatory'}}}));
for(const isValid of [true,false]){
 valid=isValid;await page.goto('http://localhost:5173/verify/layout-fixture');await page.locator('.certificate-verification-status').waitFor();
 for(const [width,height] of sizes){await page.setViewportSize({width,height});const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);results.push({isValid,width,height,scroll,ok:scroll<=width+2})}
}
await page.setViewportSize({width:360,height:780});await page.screenshot({path:'tmp/verification-mobile.png',fullPage:true});await fs.writeFile('tmp/certificate-states.json',JSON.stringify({results,errors},null,2));await browser.close();

if(errors.length || results.some(r => !r.ok)) process.exitCode = 1;
