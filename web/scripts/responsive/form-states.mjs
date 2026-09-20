import { chromium } from './browser.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch();const page=await browser.newPage({reducedMotion:'reduce',hasTouch:true});const results=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/v1/**',r=>r.fulfill({json:{succeeded:true,data:r.request().url().includes('refresh')?null:{userId:'fixture',resetToken:'fixture',emailVerificationRequired:true,verificationEmailSent:true}}}));
async function inspect(label){
 const state=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,dialogs:[...document.querySelectorAll('dialog[open]')].map(e=>e.getBoundingClientRect().toJSON())}));
 const ok=state.scroll<=state.width+2&&state.dialogs.every(r=>r.x>=0&&r.y>=0&&r.right<=state.width+2&&r.bottom<=page.viewportSize().height+2);results.push({label,ok,...state});if(!ok)console.log('FAIL',label,state);
}
for(const [width,height] of [[360,780],[780,360],[820,1180],[1440,900]]){
 await page.setViewportSize({width,height});
 await page.goto('http://localhost:5173/features');
 const toggles=page.locator('.feature-flip__toggle');
 for(let i=0;i<await toggles.count();i++){await toggles.nth(i).click();await inspect('feature '+i+' '+width);await page.keyboard.press('Escape')}
 await page.goto('http://localhost:5173/about');await page.locator('.about-watch').click();await inspect('about story '+width);await page.getByRole('button',{name:'Story chapter 3'}).click();await page.keyboard.press('Escape');
 await page.goto('http://localhost:5173/login');await page.getByRole('button',{name:'Show password',exact:true}).click();await inspect('password visible '+width);
 await page.getByRole('button',{name:'Forgot password?',exact:true}).click();await inspect('password recovery email '+width);
 await page.getByLabel('Account email').fill('responsive@example.test');await page.getByRole('button',{name:'Send reset OTP',exact:true}).click();await page.getByLabel('Email OTP').fill('123456');await inspect('password recovery OTP '+width);
 await page.getByRole('button',{name:'Verify reset OTP',exact:true}).click();await page.getByLabel('New password',{exact:true}).waitFor();await inspect('password recovery reset '+width);
 await page.goto('http://localhost:5173/login');await page.locator('.login-page__register-prompt button').click();await inspect('registration '+width);
 await page.locator('input[name=fullName]').fill('Responsive Test');await page.locator('input[name=email]').fill('responsive@example.test');await page.locator('input[name=phoneNumber]').fill('9876543210');await page.locator('input[name=password]').fill('Responsive#2026');await page.locator('input[name=confirmPassword]').fill('Responsive#2026');await page.locator('input[name=acceptedTerms]').check();await page.getByRole('button',{name:'Register as student'}).click();await page.getByRole('heading',{name:'Verify email OTP'}).waitFor();await inspect('registration OTP '+width);
 console.log('Public states',width,height);
}
await fs.writeFile('tmp/public-states.json',JSON.stringify({results,errors},null,2));await browser.close();


if(errors.length || results.some(r => !r.ok)) process.exitCode = 1;
