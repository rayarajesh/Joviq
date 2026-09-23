import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, BarChart3, BriefcaseBusiness, CheckCheck, ClipboardCheck, Code2, FileSearch, FileText, GraduationCap, Lightbulb, MessageCircle, PlayCircle, Rocket, ShieldCheck, Target, Trophy, UsersRound, Video, X } from "lucide-react";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/features-page.css";

const features = [
  { icon: MessageCircle, title: "AI Interview", text: "Practice with AI-powered interviews and get feedback to improve your confidence.", color: "purple" },
  { icon: ClipboardCheck, title: "AI Assessment", text: "Assess your skills with AI-driven tests and personalized recommendations.", color: "orange" },
  { icon: Video, title: "Live Classes", text: "Attend interactive live classes with expert instructors and clarify your doubts in real time.", color: "green" },
  { icon: PlayCircle, title: "Recorded Classes", text: "Learn at your own pace with recorded sessions available anytime, anywhere.", color: "purple" },
  { icon: Code2, title: "Real-Time Projects", text: "Work on industry-relevant projects and gain hands-on experience.", color: "blue" },
  { icon: FileSearch, title: "Project Reviews", text: "Get constructive feedback on your projects from mentors and industry experts.", color: "pink" },
  { icon: UsersRound, title: "Mentor Support", text: "Receive continuous guidance and support from experienced mentors.", color: "purple" },
  { icon: ClipboardCheck, title: "Assignments", text: "Complete structured assignments to strengthen your concepts and skills.", color: "green" },
  { icon: UsersRound, title: "Mock Interviews", text: "Experience real-world interviews and improve your performance with practice.", color: "orange" },
  { icon: FileText, title: "Resume Support", text: "Get expert help to create a professional and ATS-friendly resume.", color: "blue" },
  { icon: BriefcaseBusiness, title: "Portfolio Development", text: "Build a standout portfolio to showcase your skills and projects.", color: "orange" },
  { icon: Award, title: "Certification", text: "Earn a certificate upon successful completion of your program.", color: "pink" },
  { icon: ShieldCheck, title: "Certificate Verification", text: "Verify your certificates and share them with employers and professional networks.", color: "green" },
  { icon: BarChart3, title: "Career Support", text: "Get career guidance, job assistance, and support for your next step.", color: "purple" },
  { icon: BarChart3, title: "Progress Tracking", text: "Track your learning progress, completed modules, and achievements in one place.", color: "blue" }
];

export function FeaturesPage() {
  const [selected, setSelected] = useState<typeof features[number] | null>(null);
  return <div className="site-page features-page"><PublicNavbar /><main>
    <section className="ft-hero">
      <div className="ft-hero-copy"><span className="ft-eyebrow">FEATURES</span><h1>Learn Better.<br />Build Skills.<br />Get <span>Career Ready.</span></h1><p>Powerful learning features designed to give you real skills, hands-on experience, and the right support at every step of your journey.</p>
        <div className="ft-actions"><Link className="ft-button" to="/programs">Explore Programs <ArrowRight size={18} /></Link></div>
        <div className="ft-benefits"><span><GraduationCap />Learn<br />In-Demand Skills</span><span><Target />Gain<br />Real Experience</span><span><BriefcaseBusiness />Build a<br />Successful Career</span></div>
      </div>
      <div className="ft-art"><img src="/assets/programs/programs-student.png" alt="Smiling learner holding a laptop" /><div className="ft-float ft-learn"><BarChart3 /><span><b>Learn</b><br />Practice<br />Grow<br />Succeed</span></div><div className="ft-float ft-guidance"><Lightbulb /><b>Expert<br />Guidance<br />Always</b></div><div className="ft-float ft-projects"><UsersRound /><b>Real Projects<br />Real Skills</b></div><div className="ft-float ft-career"><Trophy /><b>Career<br />Ready You</b></div></div>
    </section>
    <section className="ft-features" id="learning-features"><header><span className="ft-eyebrow">JOVIQ LEARNING FEATURES</span><h2>Everything You Need in One Place</h2><p>Explore our powerful features designed to help you learn, practice, build, and grow with real-world support.</p></header>
      <div className="ft-grid">{features.map(feature => <FeatureFlipCard feature={feature} key={feature.title} onSelect={setSelected} />)}<Link className="ft-card ft-future" to="/programs"><Rocket /><strong>Your<br />Future is Closer<br />with Joviq</strong><span className="ft-card-arrow"><ArrowRight size={16} /></span></Link></div>
      <section className="ft-cta"><div><span className="ft-eyebrow">READY TO TAKE THE NEXT STEP?</span><h2>Start Your Learning Journey with <span>Joviq</span></h2><p>Get access to learning features, expert guidance, and real-world opportunities.</p><div className="ft-actions"><Link className="ft-button" to="/programs">Explore Programs <ArrowRight size={18} /></Link></div></div><div className="ft-cta-note"><Rocket /><span>Learn.<br />Build.<br />Grow.</span></div><div className="ft-checklist">{["New Skills", "Real Projects", "New Opportunities", "A Brighter You"].map(text => <span key={text}><CheckCheck size={16} />{text}</span>)}</div></section>
    </section>
  </main><SiteFooter />{selected && <div className="ft-modal-backdrop" onClick={() => setSelected(null)}><dialog className="ft-modal" aria-labelledby="feature-title" ref={node => { if (node && !node.open) node.showModal(); }} onCancel={() => setSelected(null)} tabIndex={-1} onKeyDown={event => { if(event.key === "Escape") setSelected(null); }} onClick={event => event.stopPropagation()}><button className="ft-close" aria-label="Close feature details" onClick={() => setSelected(null)} autoFocus><X /></button><span className={`ft-icon ${selected.color}`}><selected.icon /></span><h2 id="feature-title">{selected.title}</h2><p>{selected.text}</p><p>Explore our programs to find the learning plan and support that fit your goals.</p><Link className="ft-button" to="/programs">Explore Programs <ArrowRight size={18} /></Link></dialog></div>}</div>;
}

function FeatureFlipCard({ feature, onSelect }: { feature: typeof features[number]; onSelect: (feature: typeof features[number]) => void }) {
 const [open,setOpen]=useState(false),[hover,setHover]=useState(false);const flipped=open||hover;
 return <article className={`feature-flip feature-flip--${feature.color} ${flipped?"is-flipped":""}`} onPointerEnter={e=>{if(e.pointerType==="mouse")setHover(true)}} onPointerLeave={()=>setHover(false)} onKeyDown={e=>{if(e.key==="Escape"){setOpen(false);setHover(false);e.currentTarget.querySelector<HTMLButtonElement>("button")?.focus()}}}>
 <button className="feature-flip__toggle" aria-label={`Explore: ${feature.title}`} aria-haspopup="dialog" onClick={()=>onSelect(feature)}><ArrowRight size={17}/></button>
 <div className="feature-flip__inner"><div className="feature-flip__face feature-flip__front" aria-hidden={flipped} onClick={()=>setOpen(true)}><span className={`ft-icon ${feature.color}`}><feature.icon/></span><div><small>LEARN. PRACTICE. GROW.</small><h3>{feature.title}</h3><p>Explore this learning feature</p></div></div>
 <div className="feature-flip__face feature-flip__back" aria-hidden={!flipped} inert={!flipped}><span className={`ft-icon ${feature.color}`}><feature.icon/></span><h3>{feature.title}</h3><p>{feature.text}</p><Link to="/programs" onFocus={()=>setOpen(true)}>Explore Programs <ArrowRight size={15}/></Link></div></div></article>;
}
