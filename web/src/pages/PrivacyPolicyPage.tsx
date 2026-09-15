import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/privacy-policy.css";

const policySections = [
  {
    title: "1. Information We Collect",
    paragraphs: [
      "Personal identification information: name, email address, phone number, date of birth, address, educational qualifications, and photographs (e.g., for ID cards or certificates).",
      "Enrollment and academic information: course selections, attendance, assignment/project submissions, grades, and certification records.",
      "Payment information: billing details and transaction records processed through our payment partners (we do not store full card or bank account details on our own servers).",
      "Placement-related information: resume/CV, work experience, skills, and information shared for the purpose of placement assistance with hiring partners.",
      "Technical information: IP address, browser type, device information, and usage data collected through cookies and similar technologies when you visit our website.",
      "Communications: information you provide when you contact us via email, forms, or other channels."
    ]
  },
  {
    title: "2. How We Use Your Information",
    paragraphs: [
      "To process enrollments, deliver training programs, and issue certificates.",
      "To communicate with you regarding your enrollment, schedules, assignments, and program updates.",
      "To provide mentorship and placement assistance, including sharing relevant profile information with prospective hiring partners with your consent.",
      "To process payments and maintain financial records.",
      "To improve our website, courses, and Services based on usage patterns and feedback.",
      "To send you promotional communications about new courses or offers, where you have opted in (you may opt out at any time).",
      "To comply with applicable legal, regulatory, and statutory requirements."
    ]
  },
  {
    title: "3. Sharing of Information",
    paragraphs: [
      "We do not sell your personal information. We may share your information with:",
      "Trainers, mentors, and internal staff involved in delivering your program.",
      "Hiring partners and organizations, solely for the purpose of placement assistance, and generally with your knowledge/consent.",
      "Payment gateway providers and IT service providers who process data on our behalf under confidentiality obligations.",
      "Government or regulatory authorities, where required by applicable law."
    ]
  },
  {
    title: "4. Cookies and Tracking Technologies",
    paragraphs: [
      "Our website may use cookies and similar technologies to enhance user experience, analyze site traffic, and understand usage patterns. You can control cookie preferences through your browser settings; disabling cookies may affect certain website functionality."
    ]
  },
  {
    title: "5. Data Storage and Security",
    paragraphs: [
      "We implement reasonable administrative, technical, and physical safeguards designed to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission or storage over the internet is completely secure, and we cannot guarantee absolute security."
    ]
  },
  {
    title: "6. Data Retention",
    paragraphs: [
      "We retain personal information for as long as necessary to fulfil the purposes described in this Policy, including maintaining academic and certification records, complying with legal obligations, resolving disputes, and enforcing our agreements."
    ]
  },
  {
    title: "7. Your Rights",
    paragraphs: [
      "Access, correct, or update your personal information held by us.",
      "Withdraw consent for optional uses such as promotional communications or sharing your profile with hiring partners.",
      "Request deletion of your personal information, subject to our legal and legitimate business retention requirements.",
      "To exercise these rights, please contact us at info@joviqtechnologies.com."
    ]
  },
  {
    title: "8. Children's Privacy",
    paragraphs: [
      "Our Services are not directed at children under the age of 13. Where a student is a minor (under 18), we require parental/guardian consent as part of enrollment."
    ]
  },
  {
    title: "9. Third-Party Links",
    paragraphs: [
      "Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of such external sites and encourage you to review their privacy policies."
    ]
  },
  {
    title: "10. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. The updated version will be posted on our website with a revised effective date."
    ]
  },
  {
    title: "11. Contact Us",
    paragraphs: [
      "If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:",
      "Joviq Technologies Private Limited",
      "6th Floor, Melkiors Pride, Hitex Road, Vinayaka Nagar, Izzathnagar, HITEC City, Khanammet, Hyderabad, Telangana – 500084",
      "Email: info@joviqtechnologies.com",
      "Website: joviqtechnologies.com"
    ]
  }
];

export function PrivacyPolicyPage() {
  return (
    <div className="site-page privacy-policy-page">
      <PublicNavbar />

      <main className="privacy-policy-shell">
        <section className="privacy-policy" aria-labelledby="privacy-policy-title">
          <header className="privacy-policy__header">
            <p className="privacy-policy__eyebrow">LEGAL</p>
            <h1 id="privacy-policy-title">Privacy Policy</h1>
            <p className="privacy-policy__company">Joviq Technologies Private Limited</p>
            <p className="privacy-policy__effective">Effective Date: [Effective Date]</p>
          </header>

          <div className="privacy-policy__content">
            <p>
              Joviq Technologies Private Limited (&quot;Joviq Technologies&quot;, "Company", "we", "us",
              or "our") respects your privacy and is committed to protecting the personal information
              you share with us through our website (joviqtechnologies.com) and in connection with our
              training, internship, certification, mentorship, and placement assistance services (the
              &quot;Services&quot;). This Privacy Policy explains what information we collect, how we use it,
              and the choices you have.
            </p>

            {policySections.map((section) => (
              <section key={section.title} className="privacy-policy__section">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.title}-${index}`}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
