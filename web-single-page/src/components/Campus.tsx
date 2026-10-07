import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarRange,
  Check,
  ChevronDown,
  GraduationCap,
  Handshake,
  Layers3,
  MapPin,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Mic,
  Network,
  Plus,
  Presentation,
  Rocket,
  Sparkles,
  Target,
  Trophy,
  Users
} from "lucide-react";
import { tilt, untilt } from "./Programs";
import { scrollToSection } from "./Navbar";

// Content mirrors /web's Campus Delegate and Campus Partners pages.

export type CampusInterest = "ambassador" | "partner";

const img = (name: string) => `/assets/campus/${name}`;
const order = (index: number) => ({ "--i": index }) as CSSProperties;

/* ---------- Campus Ambassador (delegate) ---------- */

const highlights = [
  { Icon: Users, tone: "mint", title: "Connect", text: "Introduce peers to career-focused programs." },
  { Icon: Handshake, tone: "peach", title: "Collaborate", text: "Coordinate activities with the Joviq team." },
  { Icon: Sparkles, tone: "sky", title: "Grow", text: "Practice leadership through real outreach." }
];
const skills = [
  { Icon: Mic, label: "Communication" },
  { Icon: Target, label: "Leadership" },
  { Icon: Megaphone, label: "Campus outreach" },
  { Icon: CalendarRange, label: "Event coordination" },
  { Icon: Network, label: "Networking" },
  { Icon: Handshake, label: "Teamwork" },
  { Icon: Rocket, label: "Initiative" }
];
const responsibilities = [
  { Icon: Megaphone, tone: "peach", title: "Spread the word", text: "Introduce students to Joviq’s learning programs through campus communities, sessions, and referrals." },
  { Icon: BookOpen, tone: "sky", title: "Help peers explore", text: "Share accurate program information and connect interested students with the team for guidance." },
  { Icon: CalendarRange, tone: "mint", title: "Bring people together", text: "Coordinate workshops, demos, and student engagement activities with Joviq." },
  { Icon: MessageCircle, tone: "rose", title: "Support the next step", text: "Help interested peers navigate enrollment and share campus questions with the team." }
];
const fitTraits = [
  "Helping peers discover learning opportunities",
  "Communicating with student groups and communities",
  "Taking initiative and organising campus activities",
  "Working with a team and following through"
];
const joinSteps = [
  { title: "Request a callback", text: "Mention your college and that you’d like to become a campus ambassador." },
  { title: "Talk with the team", text: "Discuss responsibilities, time commitment, and reward terms." },
  { title: "Start on campus", text: "Begin outreach with guidance from the Joviq team." }
];
const ambassadorFaqs = [
  { question: "What is a campus ambassador?", answer: "A student representative who introduces Joviq to their campus, helps peers explore learning opportunities, and coordinates outreach activities with the team." },
  { question: "Do I need previous leadership experience?", answer: "An interest in communication, community building, and helping peers is a good starting point. Discuss your experience and suitability with the team when you request a callback." },
  { question: "How much time will I need to commit?", answer: "Discuss the expected activities and schedule with the team before joining, so you can understand how the role fits alongside your studies." },
  { question: "How do recognition and referral rewards work?", answer: "The program includes recognition opportunities and referral rewards. The team can explain current eligibility, conditions, and reward details before you join." },
  { question: "How do I express interest?", answer: "Select “Become an ambassador” and complete the callback form. Let the team know you are interested in the campus ambassador program and share your college details." }
];

/* ---------- Campus Partners ---------- */

const audiences = [
  { Icon: Building2, label: "Institutions & colleges", tone: "lilac" },
  { Icon: Users, label: "Student communities", tone: "mint" },
  { Icon: Layers3, label: "Organisations & teams", tone: "sky" }
];
const opportunities = [
  { Icon: Presentation, art: "3d-laptop", tone: "lilac", tag: "Learning & skills", title: "Bring practical learning to campus.", text: "Explore workshops, training bootcamps, and focused sessions that connect classroom knowledge with real-world application.", points: ["Workshops and learning sessions", "Practical, project-focused training", "Programs aligned with student interests"] },
  { Icon: Users, art: "3d-gear", tone: "peach", tag: "Community & outreach", title: "Create a more engaged student community.", text: "Collaborate on campus initiatives that introduce students to relevant programs and encourage active participation.", points: ["Student outreach and campus programs", "Events and awareness initiatives", "Visibility through meaningful engagement"] },
  { Icon: GraduationCap, art: "3d-growth", tone: "sky", tag: "Talent & careers", title: "Connect learning with the next opportunity.", text: "Build connections with motivated students through curated talent engagement, projects, and career-focused initiatives.", points: ["Student talent connections", "Internship and project conversations", "Career readiness and placement support"] }
];
const principles = [
  { Icon: Target, tone: "mint", title: "Shared learning goals", text: "Keep activities focused on student learning outcomes and project readiness." },
  { Icon: Handshake, tone: "peach", title: "Structured engagement", text: "Discuss roles and expectations so campus initiatives have a clear direction." },
  { Icon: Building2, tone: "sky", title: "Lasting relationships", text: "Explore ongoing collaboration with institutions and student communities." }
];
const partnerProcess = [
  { Icon: MessagesSquare, tone: "lilac", title: "Share your goals", text: "Tell us about your institution or organisation, your student community, and what you hope to achieve." },
  { Icon: Handshake, tone: "peach", title: "Shape the collaboration", text: "Discuss suitable activities, responsibilities, schedules, and partnership terms with the Joviq team." },
  { Icon: Rocket, tone: "mint", title: "Plan the next step", text: "Agree on the scope and coordinate a campus initiative around your shared learning objectives." }
];
const partnerFaqs = [
  { question: "Who can explore a partnership?", answer: "Institutions, student communities, and organisations interested in practical learning, campus engagement, and emerging talent can start a conversation with Joviq." },
  { question: "Can we discuss a specific campus requirement?", answer: "Yes. Share your intended audience, learning goals, preferred activities, and schedule so the team can discuss a suitable collaboration." },
  { question: "What should we share when contacting you?", answer: "Include your institution or organisation name, your role, contact details, and a brief outline of the collaboration you have in mind." },
  { question: "How are the scope and costs decided?", answer: "Discuss the proposed activities, responsibilities, schedule, and any applicable costs with the team before confirming a partnership." }
];

const tabs: { key: CampusInterest; label: string; Icon: typeof GraduationCap }[] = [
  { key: "ambassador", label: "Campus Ambassador", Icon: GraduationCap },
  { key: "partner", label: "Campus Partners", Icon: Handshake }
];

export function CampusSection({ onContact }: { onContact: (interest: CampusInterest) => void }) {
  const [tab, setTab] = useState<CampusInterest>("ambassador");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const update = () => {
      const active = tabsRef.current?.querySelector<HTMLElement>("[aria-selected='true']");
      if (active) setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [tab]);

  function switchTab(next: CampusInterest) {
    setTab(next);
    scrollToSection("campus");
  }

  return (
    <section className="section campus" id="campus" aria-labelledby="campus-title">
      <div className="container">
        <div className="section-head section-head--center" data-reveal>
          <span className="eyebrow"><GraduationCap size={14} /> Campus programs</span>
          <h2 id="campus-title">Lead on your campus. <span className="text-gradient">Partner with Joviq.</span></h2>
          <p>Students can represent Joviq as campus ambassadors, and institutions can partner with us to bring practical learning to their community.</p>
        </div>

        <div className="campus__switch" ref={tabsRef} role="tablist" aria-label="Campus programs" data-reveal>
          <span className="campus__switch-pill" style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }} aria-hidden="true" />
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} id={`campus-tab-${key}`} role="tab" aria-selected={tab === key} aria-controls="campus-panel" type="button" onClick={() => setTab(key)}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </div>

        <div id="campus-panel" role="tabpanel" aria-labelledby={`campus-tab-${tab}`} className="campus__panel" key={tab}>
          {tab === "ambassador"
            ? <Ambassador onApply={() => onContact("ambassador")} onPartners={() => switchTab("partner")} />
            : <Partners onApply={() => onContact("partner")} onAmbassador={() => switchTab("ambassador")} />}
        </div>
      </div>
    </section>
  );
}

function Ambassador({ onApply, onPartners }: { onApply: () => void; onPartners: () => void }) {
  return (
    <>
      <div className="amb-hero">
        <div className="amb-hero__copy">
          <span className="chip"><span className="pulse" aria-hidden="true" /><GraduationCap size={15} /> Joviq Campus Ambassador</span>
          <h3><span>Your campus.</span> <span>Your community.</span> <em className="text-gradient">Your impact.</em></h3>
          <p>Connect your peers with practical learning opportunities. Build your leadership skills as you help your campus learn, collaborate, and grow.</p>
          <div className="campus__actions">
            <button className="btn btn--primary" type="button" onClick={onApply}>Become an ambassador <ArrowRight size={17} /></button>
            <button className="btn btn--ghost" type="button" onClick={onPartners}>For institutions <ArrowRight size={16} /></button>
          </div>
          <ul className="amb-chips" aria-label="Program highlights">
            <li><MapPin size={15} /> Campus outreach across India</li>
            <li><Users size={15} /> Student-first collaboration</li>
          </ul>
        </div>
        <div className="amb-hero__visual">
          <div className="amb-orbit" aria-hidden="true"><span /><span /></div>
          <div className="amb-blob" aria-hidden="true" />
          <img className="amb-student" src={img("delegate-student.webp")} alt="Joviq campus ambassador holding notebooks" width={680} height={1020} loading="lazy" />
          <ul className="amb-floaters" aria-label="The role at a glance">
            {highlights.map(({ Icon, tone, title, text }, index) => (
              <li key={title} className={`tone-${tone}`} style={order(index)}>
                <span className="icon-badge"><Icon size={17} /></span>
                <span><strong>{title}</strong>{text}</span>
              </li>
            ))}
          </ul>
          <span className="amb-award" aria-hidden="true"><Award size={22} /></span>
        </div>
      </div>

      <div className="skill-marquee" role="region" aria-label="Skills you build as an ambassador">
        <div className="skill-marquee__track">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1 || undefined}>
              {skills.map(({ Icon, label }) => <li key={label}><Icon size={17} />{label}</li>)}
            </ul>
          ))}
        </div>
      </div>

      <div className="campus-block">
        <div className="section-head section-head--center" data-reveal>
          <span className="eyebrow">Why join</span>
          <h3>Give your campus more. Take your skills further.</h3>
        </div>
        <div className="amb-bento">
          <article className="amb-bento__photo" data-reveal>
            <img src={img("campus-team.webp")} alt="Students collaborating around a laptop" width={1100} height={733} loading="lazy" />
            <div>
              <span className="eyebrow eyebrow--light">Campus connections</span>
              <h4>Be the person who brings people together.</h4>
              <p>Represent Joviq. Share opportunities. Make learning a campus conversation.</p>
            </div>
          </article>
          <article className="amb-card tone-rose" data-reveal style={order(1)}>
            <span className="icon-badge"><Megaphone size={21} /></span>
            <h4>Find your voice</h4>
            <p>Build confidence in communication, campus outreach, and leading student activities.</p>
            <div className="amb-wave" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={order(index)} />)}</div>
          </article>
          <article className="amb-card tone-sky" data-reveal style={order(2)}>
            <span className="icon-badge"><Users size={21} /></span>
            <h4>Grow your network</h4>
            <p>Connect with peers and the Joviq team while building a learning community on campus.</p>
            <div className="amb-avatars" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => <img key={n} src={img(`peer-${n}.webp`)} alt="" width={44} height={44} loading="lazy" />)}
              <span><Plus size={15} /></span>
            </div>
          </article>
          <article className="amb-card amb-card--award tone-butter" data-reveal style={order(3)}>
            <div>
              <span className="icon-badge"><BadgeCheck size={21} /></span>
              <h4>Get recognised</h4>
              <p>Explore leadership recognition and referral rewards. Ask the team about the applicable terms.</p>
            </div>
            <img src={img("recognition-trophy.webp")} alt="" width={360} height={540} loading="lazy" />
          </article>
        </div>
      </div>

      <div className="campus-block">
        <div className="section-head" data-reveal>
          <span className="eyebrow">Your role</span>
          <h3>Simple actions. A stronger learning community.</h3>
        </div>
        <ol className="step-cards">
          {responsibilities.map(({ Icon, tone, title, text }, index) => (
            <li key={title} className={`tone-${tone} tilt`} data-reveal style={order(index)} onMouseMove={tilt} onMouseLeave={untilt}>
              <span className="step-cards__node"><Icon size={21} /><b>{index + 1}</b></span>
              <h4>{title}</h4>
              <p>{text}</p>
              <span className="spotlight" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>

      <div className="campus-block amb-fit">
        <div className="amb-fit__visual" data-reveal>
          <img src={img("learner-desk.webp")} alt="Student planning ideas at a desk" width={900} height={865} loading="lazy" />
          <div className="float-card float-card--static"><span className="icon-badge tone-butter"><Trophy size={17} /></span><span><strong>Lead on campus</strong>Real outreach experience</span></div>
        </div>
        <div data-reveal style={order(1)}>
          <span className="eyebrow">Is this for you?</span>
          <h3>Enjoy connecting people? Start here.</h3>
          <p>This role may suit you if you’re a college student who enjoys:</p>
          <ul className="amb-traits">
            {fitTraits.map((item, index) => <li key={item} style={order(index)}><span><Check size={15} /></span>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="campus-apply" data-reveal>
        <div>
          <span className="eyebrow eyebrow--light">Let’s talk</span>
          <h3>Tell us about your campus.</h3>
          <p>Share your interest through the callback form, then decide with the team.</p>
          <button className="btn btn--light" type="button" onClick={onApply}>Become an ambassador <ArrowRight size={17} /></button>
        </div>
        <ol>
          {joinSteps.map(({ title, text }, index) => (
            <li key={title} style={order(index)}><span>{index + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>
          ))}
        </ol>
      </div>

      <CampusFaq title="A few questions, answered." faqs={ambassadorFaqs} name="ambassador-faq" />
    </>
  );
}

function Partners({ onApply, onAmbassador }: { onApply: () => void; onAmbassador: () => void }) {
  return (
    <>
      <div className="partner-hero">
        <div className="partner-hero__copy">
          <span className="chip"><span className="pulse" aria-hidden="true" /><Handshake size={15} /> Joviq Campus Partnerships</span>
          <h3><span>Great opportunities start with</span> <em className="text-gradient">working together.</em></h3>
          <p>Bring institutions, student communities, and industry closer. Partner with Joviq to create practical learning experiences and meaningful connections for emerging talent.</p>
          <div className="campus__actions">
            <button className="btn btn--primary" type="button" onClick={onApply}>Let’s collaborate <ArrowRight size={17} /></button>
            <button className="btn btn--ghost" type="button" onClick={onAmbassador}>For students <ArrowRight size={16} /></button>
          </div>
        </div>
        <div className="partner-scene" role="img" aria-label="Joviq connects institutions and colleges, student communities, and organisations and teams">
          <span className="partner-scene__ring partner-scene__ring--1" aria-hidden="true" />
          <span className="partner-scene__ring partner-scene__ring--2" aria-hidden="true" />
          <span className="partner-scene__core"><img src="/assets/joviq-logo.svg" alt="" width="80" height="76" /></span>
          {audiences.map(({ Icon, label, tone }, index) => (
            <div key={label} className={`partner-scene__label partner-scene__label--${index + 1} tone-${tone}`} style={order(index)}>
              <span className="icon-badge"><Icon size={17} /></span>{label}
            </div>
          ))}
        </div>
      </div>

      <div className="campus-block">
        <div className="section-head" data-reveal>
          <span className="eyebrow">Ways to collaborate</span>
          <h3>One partnership. Different ways to make an impact.</h3>
          <p>Start with the needs of your students and build a conversation around the right opportunities.</p>
        </div>
        <div className="partner-options">
          {opportunities.map(({ Icon, art, tone, tag, title, text, points }, index) => (
            <article key={tag} className={`partner-option tilt tone-${tone}`} data-reveal style={order(index)} onMouseMove={tilt} onMouseLeave={untilt}>
              <img className="partner-option__art" src={`/assets/${art}.webp`} alt="" width={360} height={340} loading="lazy" />
              <span className="icon-badge"><Icon size={21} /></span>
              <span className="partner-option__tag">{tag}</span>
              <h4>{title}</h4>
              <p>{text}</p>
              <ul className="checklist checklist--sm">{points.map((point) => <li key={point}><Check size={15} />{point}</li>)}</ul>
              <span className="spotlight" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>

      <div className="partner-band" data-reveal>
        <div>
          <span className="eyebrow eyebrow--light">Built around students</span>
          <h3>More than a campus connection.</h3>
          <p>A strong collaboration gives everyone a clear purpose: relevant learning, thoughtful engagement, and opportunities to put skills into practice.</p>
          <button className="btn btn--outline-light" type="button" onClick={() => scrollToSection("programs")}>Explore our learning programs <ArrowRight size={16} /></button>
        </div>
        <div className="partner-band__list">
          {principles.map(({ Icon, tone, title, text }, index) => (
            <article key={title} className={`tone-${tone}`} style={order(index)}>
              <span className="icon-badge"><Icon size={19} /></span>
              <div><h4>{title}</h4><p>{text}</p></div>
            </article>
          ))}
        </div>
      </div>

      <div className="campus-block">
        <div className="section-head section-head--center" data-reveal>
          <span className="eyebrow">Getting started</span>
          <h3>A conversation is a good first step.</h3>
        </div>
        <ol className="step-cards step-cards--3">
          {partnerProcess.map(({ Icon, tone, title, text }, index) => (
            <li key={title} className={`tone-${tone} tilt`} data-reveal style={order(index)} onMouseMove={tilt} onMouseLeave={untilt}>
              <span className="step-cards__node"><Icon size={21} /><b>{index + 1}</b></span>
              <h4>{title}</h4>
              <p>{text}</p>
              <span className="spotlight" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>

      <div className="campus-apply campus-apply--partner" data-reveal>
        <div>
          <span className="eyebrow eyebrow--light">Let’s build something meaningful</span>
          <h3>What could we create for your campus?</h3>
          <p>Share your goals through our callback form. Mention your institution and the partnership you have in mind.</p>
          <button className="btn btn--light" type="button" onClick={onApply}>Start a partnership <ArrowRight size={17} /></button>
        </div>
        <img className="campus-apply__art" src="/assets/3d-helmet.webp" alt="" width={360} height={345} loading="lazy" />
      </div>

      <CampusFaq title="Before we get started." faqs={partnerFaqs} name="partner-faq" />
    </>
  );
}

function CampusFaq({ title, faqs, name }: { title: string; faqs: { question: string; answer: string }[]; name: string }) {
  return (
    <div className="campus-block campus-faq">
      <div className="section-head" data-reveal>
        <span className="eyebrow">Good to know</span>
        <h3>{title}</h3>
        <p>Still curious? Our team is happy to walk you through it.</p>
      </div>
      <div className="faq-list" data-reveal>
        {faqs.map((faq, index) => (
          <details key={faq.question} name={name} open={index === 0}>
            <summary>{faq.question}<ChevronDown size={18} aria-hidden="true" /></summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
