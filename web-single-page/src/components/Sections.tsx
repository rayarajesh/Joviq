import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Headphones,
  Mail,
  MapPin,
  MessageCircleQuestion,
  PhoneCall,
  QrCode,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Video
} from "lucide-react";
import { defaultProgramPlans, expertGuides, homeFaqs, pricingPlans, uniquePrograms } from "../data/siteContent";
import type { ProgramPlan } from "../data/siteContent";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";
import { env } from "../config/env";
import { PlanCard, tilt, untilt } from "./Programs";
import { scrollToSection } from "./Navbar";
import { socialLinks } from "./socialLinks";
import type { CampusInterest } from "./Campus";

const tones = ["lilac", "mint", "peach", "sky", "rose", "butter"];
const order = (index: number) => ({ "--i": index }) as CSSProperties;

/* ---------- Hiring partners marquee ---------- */

const partners = [
  "google", "amazon", "nvidia", "accenture", "deloitte", "bosch", "jio", "tcs", "tech-mahindra", "goldman-sachs",
  "oracle", "samsung", "infosys", "wipro", "sap", "capgemini", "hcltech", "cognizant", "ntt-data", "fractal",
  "publicis-sapient", "optum", "rakuten", "societe-generale", "adp"
];
const pngLogos = new Set(["cgi", "eurofins", "birlasoft"]);

export function PartnersMarquee() {
  const rows = [partners.slice(0, 13), partners.slice(13)];
  return (
    <section className="partners" aria-labelledby="partners-title">
      <div className="container">
        <p id="partners-title" className="partners__title" data-reveal>Our alumni work at <strong>leading companies</strong> across India and beyond</p>
      </div>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className={`marquee${rowIndex ? " marquee--reverse" : ""}`}>
          <div className="marquee__track">
            {[...row, ...row].map((logo, index) => (
              <span key={`${logo}-${index}`} className="marquee__item" aria-hidden={index >= row.length ? true : undefined}>
                <img src={`/assets/company-logos/${logo}.${pngLogos.has(logo) ? "png" : "svg"}`} alt={index >= row.length ? "" : logo.replace(/-/g, " ")} loading="lazy" />
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ---------- Why Joviq ---------- */

const features = [
  { Icon: CalendarClock, title: "Guided + Lesson Replays", text: "Follow guided sessions and watch recordings anytime.", bullets: ["Guided interactive sessions", "Lesson replays", "Industry-relevant curriculum"] },
  { Icon: Video, title: "6 Months LMS Access", text: "Access videos, files, quizzes & resources anytime.", bullets: ["Complete materials", "Self-paced learning", "Downloadable files"] },
  { Icon: UsersRound, title: "Hands-on Projects", text: "Work on real industry-level problems.", bullets: ["Hands-on experience", "Real-time projects", "Personal expert support"] },
  { Icon: Award, title: "Certification", text: "Receive a QR-verified certificate after completion.", bullets: ["Industry-recognised", "QR-verified", "Capstone evaluations"] },
  { Icon: Headphones, title: "Doubt Solving", text: "Ask doubts anytime via LMS or chat.", bullets: ["Expert-led doubt solving", "Fast response time", "Detailed explanations"] },
  { Icon: BriefcaseBusiness, title: "Placement Support", text: "Resume, interview prep & job assistance.", bullets: ["Interview assistance", "Placement support", "Job readiness plan"] }
];

export function WhyJoviq() {
  return (
    <section className="section why" id="why" aria-labelledby="why-title">
      <div className="container">
        <div className="why__layout">
          <div className="section-head" data-reveal>
            <span className="eyebrow"><ShieldCheck size={14} /> Why Joviq</span>
            <h2 id="why-title">Everything you need to go from <span className="text-gradient">learning to hired.</span></h2>
            <p>Every program pairs structured lessons with real project work, expert review loops and career preparation — so your skills are visible, not just listed.</p>
            <div className="why__image" data-reveal>
              <img src="/assets/learning-studio.jpg" alt="Learners in a Joviq learning studio" loading="lazy" width="1400" height="933" />
              <div className="float-card float-card--static"><span className="icon-badge tone-mint"><BadgeCheck size={18} /></span><span><strong>Expert-reviewed</strong>Every capstone</span></div>
            </div>
          </div>
          <div className="feature-grid">
            {features.map(({ Icon, title, text, bullets }, index) => (
              <article key={title} className={`feature-card tilt tone-${tones[index]}`} data-reveal style={order(index)} onMouseMove={tilt} onMouseLeave={untilt}>
                <span className="icon-badge"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
                <ul className="checklist checklist--sm">{bullets.map((bullet) => <li key={bullet}><CheckCircle2 size={14} />{bullet}</li>)}</ul>
                <span className="spotlight" aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>

        <div className="experts" data-reveal>
          {expertGuides.map((guide, index) => (
            <div key={guide.name} className={`expert tone-${tones[index]}`} style={order(index)}>
              <span className="icon-badge"><GraduationCap size={18} /></span>
              <div><strong>{guide.name}</strong><p>{guide.role}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Certificate ---------- */

const certificates = [
  { title: "Training Certificate", image: "/assets/training-certificate.png", alt: "Joviq Technologies training certificate" },
  { title: "Internship Certificate", image: "/assets/internship-certificate.jpg", alt: "Joviq Technologies internship certificate" }
];

export function CertificateSection() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((index) => (index + 1) % certificates.length), 3500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="section certificate" id="certificate" aria-labelledby="certificate-title">
      <div className="container certificate__layout">
        <div className="section-head" data-reveal>
          <span className="eyebrow eyebrow--light"><Award size={14} /> Certification</span>
          <h2 id="certificate-title">Credentials employers can <span className="text-gradient text-gradient--light">verify in seconds.</span></h2>
          <p>Complete your projects and reviews to earn both a training certificate and an internship certificate — each with a unique QR code that links to a public verification page.</p>
          <ul className="certificate__points">
            <li><span className="icon-badge tone-mint"><QrCode size={18} /></span><span><strong>QR verified</strong>Scan to confirm authenticity instantly</span></li>
            <li><span className="icon-badge tone-peach"><BadgeCheck size={18} /></span><span><strong>Project backed</strong>Issued after expert-reviewed capstones</span></li>
            <li><span className="icon-badge tone-sky"><Sparkles size={18} /></span><span><strong>Share anywhere</strong>LinkedIn, resume and portfolio ready</span></li>
          </ul>
        </div>
        <div className="certificate__stage" data-reveal>
          <div className="certificate__glow" aria-hidden="true" />
          {certificates.map((certificate, index) => (
            <img
              key={certificate.title}
              className={index === active ? "is-active" : ""}
              src={certificate.image}
              alt={certificate.alt}
              loading="lazy"
              width="1600"
              height="1131"
              draggable={false}
            />
          ))}
          <div className="certificate__switch" role="tablist" aria-label="Certificates">
            {certificates.map((certificate, index) => (
              <button key={certificate.title} role="tab" aria-selected={index === active} type="button" onClick={() => setActive(index)}>{certificate.title}</button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */

export function Pricing({ onSelectPlan }: { onSelectPlan: (plan: ProgramPlan) => void }) {
  return (
    <section className="section pricing" id="pricing" aria-labelledby="pricing-title">
      <div className="pricing__bg" aria-hidden="true" />
      <div className="container">
        <div className="section-head section-head--center" data-reveal>
          <span className="eyebrow"><ShieldCheck size={14} /> Pricing</span>
          <h2 id="pricing-title">Simple plans for <span className="text-gradient">serious project work.</span></h2>
          <p>Choose the support level that fits your goal. Reserve your seat with a small token or pay in full — select a plan to register securely.</p>
        </div>
        <div className="plan-grid">
          {defaultProgramPlans.map((plan, index) => (
            <PlanCard key={plan.code} index={index} plan={plan} description={pricingPlans[index]?.description} onSelect={() => onSelectPlan(plan)} />
          ))}
        </div>
        <p className="plans-note"><ShieldCheck size={15} /> UPI, UPI QR, cards and net banking via secure gateway. Final pricing is confirmed for your program at checkout.</p>
      </div>
    </section>
  );
}

/* ---------- Reviews ---------- */

const stories = [
  { name: "Ananya Rao", program: "CSE · 3rd Year", quote: "Portfolio and resume cleanup changed the way I explained my work.", result: "Internship shortlist in 14 days", position: "0% 0%" },
  { name: "Ishita Sharma", program: "IT · 4th Year", quote: "Rubric-based feedback taught me to explain projects with confidence.", result: "Cracked 3 technical rounds", position: "50% 0%" },
  { name: "Karthik Iyer", program: "ECE · Final Year", quote: "The interview became a walkthrough of the projects I had already built.", result: "Offer after project deep-dive", position: "100% 0%" },
  { name: "Nikhil Shetty", program: "Mechanical · 4th Year", quote: "I learned to present work with clarity and evidence.", result: "Confidence in interview narration", position: "0% 100%" },
  { name: "Tanvi Joshi", program: "CSE · Final Year", quote: "Expert feedback exposed weak spots before the real interview.", result: "Converted final HR discussion", position: "50% 100%" },
  { name: "Sanjana Reddy", program: "CSE · 3rd Year", quote: "Timed practice fixed my speed and project storytelling.", result: "Shortlisted for internship tests", position: "100% 100%" }
];

export function Reviews() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  function scroll(direction: number) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".review");
    track.scrollBy({ left: direction * ((card?.offsetWidth ?? 320) + 20), behavior: "smooth" });
  }

  // Gentle auto-advance that pauses on hover/focus and loops back at the end.
  useEffect(() => {
    if (isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 8) track.scrollTo({ left: 0, behavior: "smooth" });
      else scroll(1);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section className="section reviews" id="reviews" aria-labelledby="reviews-title">
      <div className="container">
        <div className="reviews__head" data-reveal>
          <div className="section-head">
            <span className="eyebrow"><Star size={14} /> Learner stories</span>
            <h2 id="reviews-title">Reviews from <span className="text-gradient">our learners.</span></h2>
          </div>
          <div className="reviews__arrows">
            <button className="icon-button" type="button" aria-label="Previous reviews" onClick={() => scroll(-1)}><ArrowLeft size={19} /></button>
            <button className="icon-button" type="button" aria-label="Next reviews" onClick={() => scroll(1)}><ArrowRight size={19} /></button>
          </div>
        </div>
        <div
          className="reviews__track"
          ref={trackRef}
          tabIndex={0}
          aria-label="Learner reviews"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
        >
          {stories.map((story, index) => (
            <article key={story.name} className="review" data-reveal style={order(index)}>
              <div className="review__stars" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map((star) => <Star key={star} size={15} fill="currentColor" />)}</div>
              <blockquote>“{story.quote}”</blockquote>
              <span className="review__result"><Rocket size={14} /> {story.result}</span>
              <footer>
                <span className="review__avatar" style={{ backgroundPosition: story.position }} aria-hidden="true" />
                <div><strong>{story.name}</strong><small>{story.program}</small></div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

export function Faq() {
  return (
    <section className="section faq" id="faq" aria-labelledby="faq-title">
      <div className="container faq__layout">
        <aside className="faq__aside" data-reveal>
          <span className="eyebrow"><MessageCircleQuestion size={14} /> Got questions?</span>
          <h2 id="faq-title">Questions &amp; <span className="text-gradient">answers.</span></h2>
          <p>Clear answers on programs, projects, certificates, and learner guidance.</p>
          <div className="faq__tags"><span>Expert-led cohorts</span><span>Portfolio-grade projects</span><span>6 months LMS access</span></div>
          <button className="btn btn--soft" type="button" onClick={() => scrollToSection("contact")}>Ask an advisor <ArrowRight size={16} /></button>
        </aside>
        <div className="faq-list" data-reveal>
          {homeFaqs.map((faq, index) => (
            <details key={faq.question} name="home-faq" open={index === 0}>
              <summary>{faq.question}<ChevronDown size={18} aria-hidden="true" /></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Contact / callback ---------- */

type Notice = { tone: "success" | "error"; text: string } | null;

const interestLabels: Record<CampusInterest | "program", string> = {
  program: "Program enrollment",
  ambassador: "Campus ambassador",
  partner: "Campus partnership"
};

/** `interest` is preselected when a campus CTA sends the visitor here. */
export function Contact({ interest }: { interest: CampusInterest | "program" }) {
  const [notice, setNotice] = useState<Notice>(null);

  // Same behaviour as /web's callback form, which captures the request client-side.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!toIndiaMobileNumber(form.get("phoneNumber"))) {
      setNotice({ tone: "error", text: "Phone must be a valid India +91 mobile number with exactly 10 digits." });
      return;
    }
    formElement.reset();
    setNotice({ tone: "success", text: "Thanks! Your callback request is captured — an advisor will reach out shortly." });
  }

  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="container contact__layout">
        <div className="contact__copy" data-reveal>
          <span className="eyebrow eyebrow--light"><PhoneCall size={14} /> Talk to a career expert</span>
          <h2 id="contact-title">Get your best-fit <span className="text-gradient text-gradient--light">program roadmap.</span></h2>
          <p>Share a few details and we’ll suggest the most relevant track for your goals, background and timeline.</p>
          <ul className="contact__list">
            <li><a href="tel:+919281977188"><span className="icon-badge"><PhoneCall size={17} /></span>+91 92819 77188</a></li>
            <li><a href="mailto:info@joviqtechnologies.com"><span className="icon-badge"><Mail size={17} /></span>info@joviqtechnologies.com</a></li>
            <li><span><span className="icon-badge"><MapPin size={17} /></span>Hitech City, Hyderabad, Telangana 500084</span></li>
          </ul>
        </div>
        <form className="contact__form" onSubmit={submit} data-reveal>
          <div className="enroll-fields">
            <label className="field"><span>Full name <b>*</b></span><input name="fullName" placeholder="Your name" required autoComplete="name" /></label>
            <label className="field">
              <span>Phone <b>*</b></span>
              <div className="phone-field"><i>+91</i><input name="phoneNumber" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="9876543210" required onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 10); }} /></div>
            </label>
            <label className="field"><span>College / university</span><input name="college" placeholder="College name" /></label>
            <label className="field"><span>State</span><input name="state" placeholder="State" /></label>
          </div>
          <label className="field">
            <span>I’m interested in</span>
            <select name="interest" key={interest} defaultValue={interest}>
              {Object.entries(interestLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Program interest</span>
            <select name="program" defaultValue="">
              <option value="" disabled>Select a track</option>
              {uniquePrograms.map((program) => <option key={program.slug} value={program.title}>{program.title}</option>)}
            </select>
          </label>
          {notice ? <p className={notice.tone === "error" ? "enroll-error" : "enroll-success"} role="status">{notice.text}</p> : null}
          <button className="btn btn--primary btn--block" type="submit"><Send size={17} /> Request a callback</button>
        </form>
      </div>
    </section>
  );
}

/* ---------- Final CTA + footer ---------- */

export function FinalCta() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="container">
        <div className="final-cta__card" data-reveal>
          <span className="final-cta__sparkle" aria-hidden="true" />
          <span className="chip chip--glass"><Sparkles size={13} /> Learn. Build. Grow with Joviq.</span>
          <h2 id="final-cta-title">Ready to build your next career chapter?</h2>
          <p>Turn learning into real skills with guided projects, expert feedback, and career-focused programs.</p>
          <div className="final-cta__actions">
            <button className="btn btn--light" type="button" onClick={() => scrollToSection("programs")}>Explore programs <ArrowRight size={16} /></button>
            <button className="btn btn--outline-light" type="button" onClick={() => scrollToSection("contact")}>Talk to an advisor</button>
          </div>
        </div>
      </div>
    </section>
  );
}

const legalLinks = [
  ["Privacy policy", "/privacy-policy"],
  ["Terms", "/terms"],
  ["Return policy", "/return-policy"],
  ["Cookie policy", "/cookie-policy"]
] as const;

export function Footer({ onSelectProgram }: { onSelectProgram: (slug: string) => void }) {
  const sections = [["programs", "Programs"], ["why", "Why Joviq"], ["pricing", "Pricing"], ["reviews", "Reviews"], ["faq", "FAQ"], ["contact", "Contact"]] as const;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <span className="nav__brand nav__brand--light"><img src="/assets/joviq-logo.svg" alt="" width="44" height="42" /><span>Joviq<small>Technologies</small></span></span>
            <p>Turn curiosity into capability with practical, project-backed learning for the careers ahead.</p>
            <div className="footer__social">
              {socialLinks.map(({ href, label, Icon }) => (
                <a key={label} href={href} aria-label={label} title={label} target="_blank" rel="noreferrer"><Icon size={18} /></a>
              ))}
            </div>
          </div>
          <nav aria-label="Footer sections">
            <h3>Explore</h3>
            <ul>{sections.map(([id, label]) => <li key={id}><a href={`#${id}`} onClick={(event) => { event.preventDefault(); scrollToSection(id); }}>{label}</a></li>)}</ul>
          </nav>
          <nav aria-label="Popular programs">
            <h3>Popular programs</h3>
            <ul>{uniquePrograms.slice(0, 6).map((program) => <li key={program.slug}><a href="#course" onClick={(event) => { event.preventDefault(); onSelectProgram(program.slug); }}>{program.title}</a></li>)}</ul>
          </nav>
          <address>
            <h3>Contact</h3>
            <a href="tel:+919281977188"><PhoneCall size={14} />+91 92819 77188</a>
            <a href="mailto:info@joviqtechnologies.com"><Mail size={14} />info@joviqtechnologies.com</a>
            <span><MapPin size={14} />CS Coworking Space, 6th Floor, Melkiors Pride, Hitex Road, Hitech City, Hyderabad, Telangana 500084</span>
          </address>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} JOVIQ TECHNOLOGIES PRIVATE LIMITED. All rights reserved.</span>
          {env.lmsAppUrl ? (
            <div className="footer__legal">{legalLinks.map(([label, path]) => <a key={path} href={`${env.lmsAppUrl}${path}`}>{label}</a>)}</div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
