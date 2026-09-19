import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/privacy-policy.css";

const termsSections = [
  {
    title: "1. About Us",
    paragraphs: [
      "Joviq Technologies Private Limited is a company incorporated under the Companies Act, 2013, having CIN U85499TS2026PTC221782, with its registered office at 6th Floor, Melkiors Pride, Hitex Road, Vinayaka Nagar, Izzathnagar, HITEC City, Khanammet, Hyderabad, Telangana – 500084. We are an EdTech company providing industry-oriented training, hands-on learning, real-time projects, certifications, mentorship, and placement assistance."
    ]
  },
  {
    title: "2. Eligibility",
    paragraphs: [
      "Our Services are intended for individuals who are at least 18 years of age, or who are enrolling with the consent and involvement of a parent/guardian if a minor. By using our Services, you represent that you meet this eligibility criterion and that all information you provide during registration is accurate and complete."
    ]
  },
  {
    title: "3. Enrollment and Registration",
    paragraphs: [
      "Enrollment in any course, internship, or training program is confirmed only upon successful completion of the registration process and payment of applicable fees, where required.",
      "You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account.",
      "We reserve the right to refuse or cancel enrollment at our sole discretion, including in cases of incomplete information, suspected fraud, or violation of these Terms."
    ]
  },
  {
    title: "4. Fees and Payments",
    paragraphs: [
      "All applicable fees for courses, training programs, or certifications will be communicated to you prior to enrollment.",
      "Fees must be paid in full (or as per any approved installment plan) through the payment methods designated by us.",
      "All fees are exclusive of applicable taxes unless stated otherwise.",
      "Our refund policy is governed by a separate Refund Policy, which forms part of these Terms."
    ]
  },
  {
    title: "5. Nature of Training, Certifications, Mentorship, and Placement Assistance",
    paragraphs: [
      "Courses and training programs are designed to provide industry-oriented, practical learning through real-time projects and mentorship.",
      "Certificates issued upon completion acknowledge participation and/or performance in the respective program and do not constitute a degree, diploma, or statutory qualification unless explicitly stated.",
      "Placement assistance is provided on a best-effort basis. We do not guarantee employment, internship offers, job interviews, or any specific compensation, and we make no representation that placement assistance will result in an offer of employment.",
      "Mentorship sessions are provided to support learning outcomes and do not constitute professional, legal, financial, or career-guarantee advice."
    ]
  },
  {
    title: "6. Student Conduct",
    paragraphs: [
      "You agree to conduct yourself professionally during all interactions with our trainers, mentors, staff, and fellow students, and to comply with the code of conduct, attendance requirements, and project guidelines communicated for each program. We reserve the right to suspend or terminate access to Services for conduct that is abusive, fraudulent, disruptive, or in breach of these Terms, without any refund of fees paid."
    ]
  },
  {
    title: "7. Intellectual Property",
    paragraphs: [
      "All course materials, content, presentations, project templates, branding, logos, and other materials provided as part of our Services are the intellectual property of Joviq Technologies or its licensors. You may use such materials solely for your personal learning purposes and may not copy, reproduce, distribute, sell, or create derivative works from them without our prior written consent."
    ]
  },
  {
    title: "8. Third-Party Links and Services",
    paragraphs: [
      "Our website or Services may contain links to third-party websites, tools, or platforms (including for payments or communication) that are not owned or controlled by us. We are not responsible for the content, policies, or practices of any third-party services."
    ]
  },
  {
    title: "9. Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by applicable law, Joviq Technologies Private Limited shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the Services, including but not limited to loss of income, employment opportunity, or business, even if we have been advised of the possibility of such damages. Our total liability for any claim arising from the Services shall not exceed the amount of fees actually paid by you for the specific program giving rise to the claim."
    ]
  },
  {
    title: "10. Disclaimer of Warranties",
    paragraphs: [
      "Our Services are provided on an \"as is\" and \"as available\" basis. While we strive to ensure accuracy and quality of our training content and delivery, we do not warrant that the Services will be uninterrupted, error-free, or that outcomes such as skill acquisition, certification, or placement will meet your expectations."
    ]
  },
  {
    title: "11. Modifications to Services and Terms",
    paragraphs: [
      "We reserve the right to modify, suspend, or discontinue any part of our Services, and to update these Terms from time to time. Material changes will be communicated via our website or by email. Continued use of our Services after such changes constitutes acceptance of the revised Terms."
    ]
  },
  {
    title: "12. Termination",
    paragraphs: [
      "We may suspend or terminate your access to the Services at our discretion in the event of a breach of these Terms, non-payment of fees, or conduct that we determine to be harmful to the Company, its staff, or other students."
    ]
  },
  {
    title: "13. Governing Law and Jurisdiction",
    paragraphs: [
      "These Terms shall be governed by and construed in accordance with the laws of India. Subject to the arbitration provisions (if any communicated separately), the courts at Hyderabad, Telangana shall have exclusive jurisdiction over any disputes arising out of or in connection with these Terms."
    ]
  },
  {
    title: "14. Contact Us",
    paragraphs: [
      "For any questions regarding these Terms, please contact us at:",
      "Joviq Technologies Private Limited",
      "6th Floor, Melkiors Pride, Hitex Road, Vinayaka Nagar, Izzathnagar, HITEC City, Khanammet, Hyderabad, Telangana – 500084",
      "Email: info@joviqtechnologies.com",
      "Website: joviqtechnologies.com"
    ]
  }
];

export function TermsPage() {
  return (
    <div className="site-page privacy-policy-page">
      <PublicNavbar />

      <main className="privacy-policy-shell">
        <section className="privacy-policy" aria-labelledby="terms-title">
          <header className="privacy-policy__header">
            <p className="privacy-policy__eyebrow">LEGAL</p>
            <h1 id="terms-title">Terms &amp; Conditions</h1>
            <p className="privacy-policy__company">Joviq Technologies Private Limited</p>
           
          </header>

          <div className="privacy-policy__content">
            <p>
              Welcome to Joviq Technologies Private Limited (&quot;Joviq Technologies&quot;, "Company",
              "we", "us", or "our"). These Terms &amp; Conditions (&quot;Terms&quot;) govern your
              access to and use of our website (joviqtechnologies.com), our training programs,
              internship programs, certification courses, mentorship services, and placement
              assistance services (collectively, the &quot;Services&quot;). By enrolling in any
              Service, accessing our website, or otherwise engaging with us, you ("User",
              "Student", "you") agree to be bound by these Terms.
            </p>

            {termsSections.map((section) => (
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
