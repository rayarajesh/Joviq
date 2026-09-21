import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import { companyInformation } from "../data/companyInformation";
import "../styles/privacy-policy.css";
import "../styles/company-information.css";

export function CompanyInformationPage() {
  return (
    <div className="site-page privacy-policy-page company-information-page">
      <title>Company Information | JoviQ Technologies</title>
      <PublicNavbar />
      <main className="privacy-policy-shell">
        <section className="privacy-policy" aria-labelledby="company-information-title">
          <header className="privacy-policy__header">
            <p className="privacy-policy__eyebrow">LEGAL</p>
            <h1 id="company-information-title">Company Information</h1>
            <p className="privacy-policy__company">{companyInformation.legalName}</p>
          </header>
          <div className="privacy-policy__content">
            <section className="privacy-policy__section">
              <h2>Registered / Mailing Address</h2>
              <p>{companyInformation.mailingAddress}</p>
            </section>
            <section className="privacy-policy__section">
              <h2>Corporate Identity Number (CIN)</h2>
              <p>{companyInformation.cin}</p>
            </section>
            <section className="privacy-policy__section">
              <h2>Date of Incorporation</h2>
              <p><time dateTime="2026-08-25">{companyInformation.incorporationDate}</time></p>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
