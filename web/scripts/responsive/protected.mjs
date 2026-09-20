import { chromium } from './browser.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch();
const seed=await browser.newPage(); await seed.goto('http://localhost:5173');
const data=await seed.evaluate(async()=>({...(await import('/src/data/studentPreview.ts')),program:(await import('/src/data/siteContent.ts')).allPrograms[0]})); await seed.close();
const {studentPreviewDashboard:dashboard,studentPreviewWorkspace:workspace}=data;
const project={id:'project',programId:'preview-program',title:'Build a production-ready portfolio application',description:'Create an accessible application and document your implementation decisions.',requiredArtifacts:['Source code','Project report'],usefulLinks:[],maxScore:100,isPublished:true,assignedStudentCount:1};
workspace.projects=[project];
workspace.payments=[{id:'payment',programId:'preview-program',studentId:'preview-student',enrollmentId:'preview-enrollment',gateway:'Cashfree',gatewayOrderId:'order-responsive-fixture',mode:'Full',status:'Verified',amount:4999,originalAmount:4999,discountAmount:0,currency:'INR',createdAt:'2026-09-01T00:00:00Z',programTitle:'Full Stack Web Development'}];
workspace.certificates=[{id:'certificate',programId:'preview-program',studentId:'preview-student',programTitle:'Full Stack Web Development',type:'Completion',status:'Issued',studentName:'Responsive Test Learner',fromDate:'2026-01-01',toDate:'2026-09-01',authorizedSignatory:'Sample Signatory',signatureText:'Director',certificateId:'JOVIQ-RESPONSIVE-LAYOUT-CERTIFICATE-2026',verificationSlug:'fixture',issuedAt:'2026-09-01T00:00:00Z'}];
dashboard.notifications=[{id:'notification',title:'Your project review is ready',body:'Open your learning workspace to read the feedback and continue your program.',status:'Unread',createdAt:'2026-09-01T00:00:00Z'}];
const program={...data.program,id:'preview-program',status:'Published',learningMode:'Online',thumbnailUrl:'/assets/programs/generative-ai.jpg',startingPrice:8000,projects:[],categoryId:'category',categoryName:'Computer Science & IT',plans:data.program.plans.map((p,i)=>({...p,id:'plan'+i,programId:'preview-program'})),curriculum:[{id:'module',programId:'preview-program',title:'Practical foundations and project implementation',description:'Build and review a real project.',sortOrder:1,isActive:true,lessons:[{id:'lesson',title:'Getting started with your development environment and project',summary:'Read the lesson notes and prepare your workspace.',durationMinutes:25,sortOrder:1,isActive:true,isLocked:false,accessLevel:'Full',resources:[]}]}]};
const sizes=process.env.FULL?[[375,667],[393,852],[430,932],[360,780],[412,915],[768,1024],[820,1180],[1024,1366],[800,1280],[1280,720],[1440,900],[1920,1080]].flatMap(([w,h])=>[[w,h],[h,w]]):[[360,780],[768,1024],[1024,768],[1440,900]];
const results=[];const errors=[];const interactions=[];
for(const role of ['Student','Admin']){
const context=await browser.newContext({reducedMotion:'reduce'});
const user={id:'preview-student',userId:'preview-student',fullName:'Responsive Test Learner',email:'responsive.layout@example.test',emailConfirmed:true,phoneNumberConfirmed:true,phoneNumber:'9876543210',roles:[role],accountStatus:'Active',onboardingStatus:'Completed'};
await context.addInitScript(p=>localStorage.setItem('joviq-pending-enrollment',JSON.stringify({slug:p.slug,planCode:p.plans[0].code,programTitle:p.title,programId:p.id})),program);
await context.route('**/api/v1/**',async route=>{
 const path=new URL(route.request().url()).pathname;
 let value=[];
 if(path.endsWith('/auth/refresh')) value={accessToken:'layout-fixture',expiresIn:3600,user};
 else if(path.endsWith('/account/profile')||path.endsWith('/auth/me')) value=user;
 else if(path.includes('/onboarding')) value={...user,personal:{},academic:{},career:{skills:[]},resume:{},completionPercentage:20,missingFields:[]};
 else if(path.endsWith('/dashboard')) value=dashboard;
 else if(path.endsWith('/workspace')) value=workspace;
 else if(path.endsWith('/my-programs')) value={programs:[{enrollment:dashboard.enrollment,program,certificates:[],completedLessons:0,totalLessons:1,progressPercentage:0}],availablePrograms:[]};
 else if(path.includes('/programs/')||path.endsWith('/my-program')) value=program;
 else if(path.endsWith('/programs')) value=[program];
 else if(path.endsWith('/categories')) value=[{id:'category',name:'Computer Science & IT',slug:'computer-science',description:'Practical technology programs',isPublished:true,programCount:1,programs:[program],sortOrder:1}];
 else if(path.endsWith('/curriculum')) value=program.curriculum;
 else if(path.endsWith('/projects')) value=[project];
 else if(path.endsWith('/payments')) value=workspace.payments;
 else if(path.endsWith('/certificates')) value=workspace.certificates;
 else if(path.endsWith('/summary')) value={totalUsers:1,activeUsers:1,students:1,totalStudents:1,totalPrograms:1,publishedPrograms:1,totalEnrollments:1,totalPayments:0,verifiedRevenue:0,roleCounts:{Student:1}};
 else if(path.endsWith('/audit-logs')||path.endsWith('/users')) value={items:[],page:1,pageSize:20,totalCount:0,totalPages:0};
 else if(path.endsWith('/enrollments')) value=[dashboard.enrollment];
 await route.fulfill({json:{succeeded:true,data:value,message:'Browser-only responsive fixture'}});
});
const page=await context.newPage();page.on('pageerror',e=>errors.push({role,url:page.url(),message:e.stack}));
const sections=role==='Admin'?['Overview','Categories','Programs','Curriculum','Projects','Certificates','Students','Enrollments','Payments','Coupons','Audit Logs']:['Overview','Notifications','My Program','Projects','Payments','Certificates'];
const routes=[...sections.map(s=>'/dashboard?section='+encodeURIComponent(s)),'/profile',...(role==='Student'?['/student/onboarding','/learning/preview-program','/checkout']:[])];
for(const route of (process.env.INTERACTIONS?[]:process.env.ONLY?routes.filter(r=>r.includes(process.env.ONLY)):routes)){
 await page.goto('http://localhost:5173'+route,{waitUntil:'domcontentloaded'});await page.waitForTimeout(250);
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});await page.waitForTimeout(30);
  const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||r.right<=innerWidth+2&&r.left>=-2)return false;for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){if(['auto','scroll','hidden','clip'].includes(getComputedStyle(p).overflowX))return false}return true}).slice(0,12).map(e=>({cls:e.className,text:e.textContent.slice(0,60),right:Math.round(e.getBoundingClientRect().right)})),blank:!document.querySelector('main, .checkout-page, .checkout-empty, .checkout-launcher')}));
  results.push({role,route,width,height,...layout});
  if(width===360) await page.screenshot({path:`tmp/auth-${role}-${route.replaceAll(/[^a-zA-Z]/g,'')}.png`,fullPage:true});
 }
 console.log(role,route,JSON.stringify(results.filter(r=>r.role===role&&r.route===route&&(r.scroll>r.width+2||r.overflow.length))));
}
if(process.env.INTERACTIONS){
 const check=(ok,label)=>{interactions.push({role,label,ok});if(!ok)console.log('FAIL',role,label)};
 const inspect=async(label)=>{
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),label+' page width');
  const dialog=page.getByRole('dialog');
  if(await dialog.count()){
   const rect=await dialog.boundingBox();console.log(label,JSON.stringify(rect));await page.screenshot({path:'tmp/dialog-'+label.replaceAll(/[^a-z0-9]/gi,'')+'.png'});check(rect&&rect.x>=0&&rect.x+rect.width<=page.viewportSize().width+2&&rect.y>=0&&rect.y+rect.height<=page.viewportSize().height+2,label+' dialog fits');
   const buttons=dialog.locator('button');await buttons.last().scrollIntoViewIfNeeded();
   await page.keyboard.press('Escape');check(await dialog.count()===0,label+' Escape');
   check(await page.evaluate(()=>document.body.style.overflow!=='hidden'),label+' body restored');
  }
 };
 for(const [width,height] of [[360,780],[780,360],[820,1180],[1440,900]]){
  await page.setViewportSize({width,height});const suffix=` ${width}x${height}`;
  await page.goto('http://localhost:5173/profile');
  for(const name of ['Notifications','Open profile menu']){
   await page.getByRole('button',{name,exact:true}).click();
   const popover=page.locator('.auth-nav__popover');const r=await popover.boundingBox();check(r&&r.x>=0&&r.x+r.width<=width&&r.y+r.height<=height,name+suffix);
   await page.keyboard.press('Escape');
  }
  if(role==='Admin'){
   await page.getByRole('button',{name:'Edit Details',exact:true}).click();await inspect('edit profile'+suffix);
   await page.getByRole('button',{name:'Preferences',exact:true}).click();await inspect('profile preferences'+suffix);
   for(const [section,selector] of [['Categories','.admin-category-add'],['Programs','.category-page-header .primary-action'],['Projects','.project-create-button']]){
    await page.goto('http://localhost:5173/dashboard?section='+section);await page.locator(selector).click();await inspect(section+suffix);
   }
   await page.goto('http://localhost:5173/dashboard?section=Curriculum');await page.locator('.curriculum-program-choice').first().click();await inspect('expanded curriculum'+suffix);
   await page.getByRole('button',{name:'View lessons',exact:true}).first().click();await inspect('visible lessons'+suffix);for(const name of ['Add module','Add lesson','Edit module','Edit lesson','Preview lesson']){
    await page.getByRole('button',{name,exact:true}).first().click();await inspect(name+suffix);
   }
   await page.goto('http://localhost:5173/dashboard?section=Projects');
   for(const name of ['Edit','Review submissions','Assign students']){
    const button=page.getByRole('button',{name,exact:true}).first();if(await button.count()){await button.click();await inspect(name+suffix)}
   }
  } else {
   await page.goto('http://localhost:5173/student/onboarding');
   const steps=page.locator('.onboarding-stepper button');
   for(let i=0;i<await steps.count();i++){await steps.nth(i).click();await inspect('onboarding step '+i+suffix)}
  }
  console.log('Protected interactions',role,width,height);
 }
}
await context.close();
}
await fs.writeFile('tmp/auth-audit'+(process.env.INTERACTIONS?'-interactions':process.env.FULL?'-full':'')+'.json',JSON.stringify({results,errors,interactions},null,2));await browser.close();


if(errors.length || results.some(r => r.scroll > r.width + 2 || r.overflow.length || r.blank) || interactions.some(r => !r.ok)) process.exitCode = 1;
