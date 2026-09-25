import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/privacy-policy.css";

const refundSections = [
  {
    title: "1. No Refund Policy",
    paragraphs: [
      "All fees paid towards enrollment in any course, training program, internship program, certification, or other paid Service offered by Joviq Technologies are final and non-refundable, once the enrollment is confirmed and payment is processed. This applies regardless of whether the student has commenced, partially attended, or not attended the program, except as expressly set out in Section 2 below."
    ]
  },
  {
    title: "2. Exceptions",
    paragraphs: [
      "Refunds may be considered, at the sole discretion of Joviq Technologies, only in the following limited circumstances:",
      "Duplicate payment made in error for the same enrollment (the duplicate amount will be refunded after verification).",
      "Cancellation of a course or program by Joviq Technologies before it commences, in which case fees paid for that specific program will be refunded in full.",
      "Any other circumstance that Joviq Technologies, in its sole discretion, determines warrants a refund on a case-by-case basis."
    ]
  },
  {
    title: "3. Non-Refundable Items",
    paragraphs: [
      "Registration or application fees, where charged separately, are non-refundable under all circumstances.",
      "Fees paid for access to course materials, recorded content, or digital resources that have already been accessed or downloaded.",
      "Any processing, payment gateway, or transaction charges incurred at the time of payment."
    ]
  },
  {
    title: "4. Rescheduling and Transfers",
    paragraphs: [
      "In lieu of a refund, and at our sole discretion, we may permit a student to transfer their enrollment to a different batch or cohort of the same program, subject to seat availability and any applicable conditions communicated at the time."
    ]
  },
  {
    title: "5. How to Raise a Request",
    paragraphs: [
      "Any request relating to a duplicate payment, program cancellation by us, or an exceptional circumstance under Section 2 must be raised in writing to info@joviqtechnologies.com within 7 days of the payment or the relevant event, along with proof of payment and details of the issue. Requests raised after this period may not be considered."
    ]
  },
  {
    title: "6. Processing of Approved Refunds",
    paragraphs: [
      "Where a refund is approved under this Policy, it will be processed to the original mode of payment within 10–15 business days from the date of approval, subject to the processing timelines of the relevant bank or payment gateway, which are beyond our control."
    ]
  },
  {
    title: "7. Changes to This Policy",
    paragraphs: [
      "Joviq Technologies reserves the right to modify this Refund Policy at any time. Any changes will be posted on our website with a revised effective date and will apply to enrollments made after such changes take effect."
    ]
  },
  {
    title: "8. Contact Us",
    paragraphs: [
      "For any refund-related queries, please contact:",
      "Joviq Technologies Private Limited",
      "6th Floor, Melkiors Pride, Hitex Road, Vinayaka Nagar, Izzathnagar, HITEC City, Khanammet, Hyderabad, Telangana – 500084",
      "Email: support@joviqtechnologies.com",
      "Website: joviqtechnologies.com"
    ]
  }
];

export function RefundPolicyPage() {
  return (
    <div className="site-page privacy-policy-page">
      <PublicNavbar />

      <main className="privacy-policy-shell">
        <section className="privacy-policy" aria-labelledby="refund-policy-title">
          <header className="privacy-policy__header">
            <p className="privacy-policy__eyebrow">LEGAL</p>
            <h1 id="refund-policy-title">Refund Policy</h1>
            <p className="privacy-policy__company">Joviq Technologies Private Limited</p>
            
          </header>

          <div className="privacy-policy__content">
            <p>
              This Refund Policy applies to all courses, training programs, certifications, and other
              paid Services offered by Joviq Technologies Private Limited (&quot;Joviq Technologies&quot;,
              "Company", "we", "us", or "our") through our website (joviqtechnologies.com) or otherwise.
              By enrolling in and paying for any Service, you acknowledge and agree to this Refund Policy.
            </p>

            {refundSections.map((section) => (
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
