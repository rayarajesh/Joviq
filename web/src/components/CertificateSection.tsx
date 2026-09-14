import { useState } from "react";
import { Award, BarChart3, Check, ClipboardList, Code2, GraduationCap, Share2, ShieldCheck, Star } from "lucide-react";
const steps = [
 { label: "Training", icon: GraduationCap, text: "Learn from industry experts", title: "Training" },
 { label: "Assessment", icon: ClipboardList, text: "Complete evaluations", title: "Assessment" },
 { label: "Project", icon: Code2, text: "Build real-world projects", title: "Project Completion" },
 { label: "Certification", icon: Award, text: "Earn and showcase", title: "Completion" }
];
export function CertificateSection() {
 const [active, setActive] = useState(0);
 return <section id="certifications" className="credential-showcase" aria-labelledby="credential-title">
 <header className="credential-showcase__header"><span><Award size={25}/> CERTIFICATION</span><h2 id="credential-title">Turn Your Learning Into<br/>A <em>Recognized Credential</em></h2><p>Complete industry-relevant programs and earn a verifiable certificate<br className="credential-showcase__break"/> to showcase your skills with confidence.</p></header>
 <div className="credential-showcase__stage">
 <aside className="credential-benefit credential-benefit--verified"><span><Check size={40}/></span><div><h3>Verified<br/>Credential</h3><p>Digitally secured<br/>and verifiable</p></div></aside>
 <div className="credential-preview"><div className="credential-document" aria-label="Sample certificate preview">
 <header><img src="/assets/joviq-logo.svg" alt="Joviq Technologies"/><span>CERTIFICATE ID<strong>JOVIQ-2024-7H3K9</strong></span></header>
 <div className="credential-document__body"><p>This certifies that</p><strong>Alex Morgan</strong><span>has successfully completed the requirements for the</span><h3 aria-live="polite">CERTIFICATE OF {steps[active].title.toUpperCase()}</h3><p>Issued for successful completion of project-based career learning.</p></div>
 <footer><div className="credential-document__signature"><i>Jane Wood</i><strong>Jane Wood</strong><span>Academic Director</span><span>Joviq Technologies</span></div><span className="credential-document__seal" aria-hidden="true"><Star size={39} fill="currentColor"/><span>JOVIQ</span></span><div className="credential-document__date"><span>Issue Date</span><strong>10 Sept 2025</strong></div><div className="credential-document__sample"><ShieldCheck size={36}/><span>Sample Certificate</span></div></footer>
 </div><span className="credential-preview__caption">Sample preview - Issued after completion and review</span></div>
 <div className="credential-showcase__benefits"><aside className="credential-benefit"><span><BarChart3 size={37}/></span><div><h3>Showcase<br/>Your Skills</h3><p>Stand out in your career</p></div></aside><aside className="credential-benefit credential-benefit--share"><span><Share2 size={34}/></span><div><h3>Share Anywhere</h3><p>Add to LinkedIn,<br/>resume, or portfolio</p></div></aside></div>
 </div><div className="credential-steps" aria-label="Certificate preview stages">{steps.map((step,index)=>{const Icon=step.icon;return <button key={step.label} className={index<=active?"is-complete":""} aria-pressed={active===index} onClick={()=>setActive(index)}><span><Icon size={28}/></span><strong>{step.label}</strong><small>{step.text}</small></button>})}</div>
 </section>;
}
