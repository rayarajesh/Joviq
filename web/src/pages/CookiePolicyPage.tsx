import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CookiePolicyPage() {
  return (
    <div className="policy-page">
      <div className="policy-page__container">
        <header className="policy-page__header">
          <h1>Cookie Policy</h1>
          <p className="policy-page__updated">Last updated: September 26, 2024</p>
        </header>

        <div className="policy-page__content">
          {/* Introduction */}
          <section className="policy-section">
            <h2>1. Introduction</h2>
            <p>
              Joviq Technologies ("we", "us", "our", or "Company") uses cookies and similar tracking technologies on our website to enhance your experience, analyze how our site is used, and deliver targeted advertising. This Cookie Policy explains what cookies are, the types of cookies we use, and how you can manage your preferences.
            </p>
          </section>

          {/* What are Cookies */}
          <section className="policy-section">
            <h2>2. What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
            </p>
            <p>
              Cookies can be either "persistent" (remaining on your device until deleted) or "session-based" (deleted when you close your browser).
            </p>
          </section>

          {/* Types of Cookies We Use */}
          <section className="policy-section">
            <h2>3. Types of Cookies We Use</h2>

            <div className="cookie-type">
              <h3>🔒 Necessary Cookies</h3>
              <p>
                These cookies are essential for the website to function properly. They enable core functionality such as:
              </p>
              <ul>
                <li>Authentication and security</li>
                <li>Session management</li>
                <li>Remembering your preferences</li>
                <li>Processing transactions</li>
                <li>Preventing fraud</li>
              </ul>
              <p className="cookie-notice">
                <strong>Note:</strong> These cookies cannot be disabled as they're required for basic site functionality.
              </p>
            </div>

            <div className="cookie-type">
              <h3>📊 Analytics Cookies</h3>
              <p>
                We use analytics cookies to understand how visitors use our site, including:
              </p>
              <ul>
                <li>Google Analytics - tracking page views, user behavior, and traffic sources</li>
                <li>Monitoring site performance and user engagement</li>
                <li>Identifying popular content and features</li>
                <li>Improving user experience</li>
              </ul>
              <p className="cookie-notice">
                <strong>Data:</strong> Anonymous and aggregated data is collected. Individual user data is anonymized.
              </p>
            </div>

            <div className="cookie-type">
              <h3>⚙️ Preference Cookies</h3>
              <p>
                These cookies remember your choices and preferences, such as:
              </p>
              <ul>
                <li>Language preferences</li>
                <li>Display preferences (light/dark mode)</li>
                <li>Cookie consent choices</li>
                <li>Saved content and favorites</li>
              </ul>
            </div>

            <div className="cookie-type">
              <h3>📢 Marketing & Advertising Cookies</h3>
              <p>
                We may use cookies to deliver targeted advertising and track campaign effectiveness:
              </p>
              <ul>
                <li>Google Ads / Meta Pixel - tracking conversions and targeting ads</li>
                <li>Retargeting cookies - showing relevant ads on other websites</li>
                <li>Creating user segments for targeted campaigns</li>
                <li>Measuring marketing campaign performance</li>
              </ul>
              <p className="cookie-notice">
                <strong>Note:</strong> These cookies may be shared with advertising partners.
              </p>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="policy-section">
            <h2>4. Third-Party Cookies</h2>
            <p>
              Our website may contain cookies from third-party services, including:
            </p>
            <ul>
              <li><strong>Google Analytics</strong> - for traffic analysis</li>
              <li><strong>Payment Processors</strong> - for secure transactions</li>
              <li><strong>Social Media Platforms</strong> - for social sharing features</li>
              <li><strong>Advertising Networks</strong> - for targeted advertising</li>
            </ul>
            <p>
              We do not control these third-party cookies. Please refer to their privacy policies for more information.
            </p>
          </section>

          {/* How Long Cookies Persist */}
          <section className="policy-section">
            <h2>5. How Long Do We Store Cookies?</h2>
            <ul>
              <li><strong>Session Cookies:</strong> Automatically deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Can remain on your device for up to 2 years</li>
              <li><strong>Analytics Cookies:</strong> Typically stored for 2 years</li>
              <li><strong>Marketing Cookies:</strong> May be stored for up to 1-2 years</li>
            </ul>
          </section>

          {/* Managing Your Cookie Preferences */}
          <section className="policy-section">
            <h2>6. Managing Your Cookie Preferences</h2>
            <p>
              You have full control over your cookie preferences. When you first visit our site, you'll see a cookie consent banner where you can:
            </p>
            <ul>
              <li><strong>Accept All</strong> - Accept all cookies</li>
              <li><strong>Reject All</strong> - Reject non-essential cookies (only necessary cookies will be used)</li>
              <li><strong>Manage Preferences</strong> - Choose specific cookie categories</li>
            </ul>
            <p>
              You can change your preferences anytime by clicking the cookie banner link or visiting your account settings.
            </p>
          </section>

          {/* Browser Controls */}
          <section className="policy-section">
            <h2>7. Browser Controls & Third-Party Tools</h2>
            <p>
              Most web browsers allow you to control cookies through their settings. You can typically:
            </p>
            <ul>
              <li>View cookies stored on your device</li>
              <li>Delete cookies</li>
              <li>Block all cookies or only third-party cookies</li>
              <li>Receive alerts when a cookie is placed</li>
            </ul>
            <p>
              For instructions on managing cookies in your specific browser, please visit:
            </p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/en-us/HT201265" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/windows/windows-10-delete-cookies" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>
          </section>

          {/* Do Not Track */}
          <section className="policy-section">
            <h2>8. Do Not Track (DNT)</h2>
            <p>
              Some browsers include a "Do Not Track" (DNT) feature. Currently, there is no industry-wide standard for recognizing DNT signals, and we do not currently respond to DNT browser signals. However, you can use other tools to control cookie usage through our preferences or your browser settings.
            </p>
          </section>

          {/* Disabling Cookies */}
          <section className="policy-section">
            <h2>9. Impact of Disabling Cookies</h2>
            <p>
              While you can disable cookies, please note that:
            </p>
            <ul>
              <li>You may not be able to use all features of our website</li>
              <li>Authentication and security features may not work properly</li>
              <li>Your browsing experience may be degraded</li>
              <li>Some personalization features will not be available</li>
            </ul>
            <p>
              Necessary cookies cannot be disabled without significantly impairing website functionality.
            </p>
          </section>

          {/* Data Security */}
          <section className="policy-section">
            <h2>10. Data Security & Privacy</h2>
            <p>
              We take data security seriously. All cookie data is handled in compliance with applicable privacy laws, including:
            </p>
            <ul>
              <li>GDPR (General Data Protection Regulation) - for users in the EU</li>
              <li>CCPA (California Consumer Privacy Act) - for users in California</li>
              <li>PIPEDA (Personal Information Protection and Electronic Documents Act) - for users in Canada</li>
              <li>Other applicable local privacy laws</li>
            </ul>
            <p>
              For more details, please review our <Link to="/privacy-policy">Privacy Policy</Link>.
            </p>
          </section>

          {/* Updates to Policy */}
          <section className="policy-section">
            <h2>11. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. Any material changes will be notified to you through:
            </p>
            <ul>
              <li>A prominent notice on our website</li>
              <li>Email notification (if required by law)</li>
              <li>Updated "Last Updated" date on this page</li>
            </ul>
            <p>
              Your continued use of our website following the posting of revised Cookie Policy means that you accept and agree to the changes.
            </p>
          </section>

          {/* Contact Information */}
          <section className="policy-section">
            <h2>12. Contact Us</h2>
            <p>
              If you have questions or concerns about our use of cookies, please contact us:
            </p>
            <div className="contact-info">
              <p>
                <strong>Email:</strong> <a href="mailto:privacy@joviq.com">privacy@joviq.com</a>
              </p>
              <p>
                <strong>Address:</strong> Joviq Technologies, [Your Company Address]
              </p>
              <p>
                <strong>Website:</strong> <a href="https://joviq.com" target="_blank" rel="noopener noreferrer">https://joviq.com</a>
              </p>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="policy-page__cta">
          <h3>Ready to manage your cookies?</h3>
          <p>Visit your preferences or scroll to the bottom of the page to adjust your cookie settings.</p>
          <Link to="/" className="policy-page__link">
            Back to Home <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <style>{`
        .policy-page {
          background: linear-gradient(135deg, #fafaff, #f5f7ff);
          padding: 80px 28px;
          min-height: 100vh;
        }

        .policy-page__container {
          max-width: 900px;
          margin: 0 auto;
        }

        .policy-page__header {
          margin-bottom: 60px;
          text-align: center;
        }

        .policy-page__header h1 {
          font-size: clamp(32px, 4vw, 48px);
          margin: 0 0 12px;
          color: #1c2548;
          font-weight: 800;
        }

        .policy-page__updated {
          color: #65718b;
          font-size: 14px;
          margin: 0;
        }

        .policy-page__content {
          background: #fff;
          border-radius: 20px;
          padding: 48px;
          box-shadow: 0 8px 24px rgba(40, 53, 97, 0.08);
          margin-bottom: 40px;
        }

        .policy-section {
          margin-bottom: 40px;
        }

        .policy-section:last-child {
          margin-bottom: 0;
        }

        .policy-section h2 {
          font-size: 24px;
          margin: 0 0 16px;
          color: #1c2548;
          font-weight: 700;
        }

        .policy-section p {
          margin: 0 0 16px;
          color: #65718b;
          line-height: 1.8;
          font-size: 15px;
        }

        .policy-section ul {
          margin: 0 0 16px;
          padding-left: 24px;
          color: #65718b;
          line-height: 1.8;
        }

        .policy-section li {
          margin-bottom: 8px;
          font-size: 15px;
        }

        .cookie-type {
          margin-bottom: 32px;
          padding: 20px;
          background: #f9f9fb;
          border-radius: 12px;
          border-left: 4px solid #6550df;
        }

        .cookie-type h3 {
          margin: 0 0 12px;
          font-size: 18px;
          color: #1c2548;
          font-weight: 700;
        }

        .cookie-notice {
          background: #eef2ff;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin: 12px 0 0;
        }

        .contact-info p {
          margin-bottom: 12px;
        }

        .contact-info a {
          color: #6550df;
          text-decoration: none;
          font-weight: 600;
        }

        .contact-info a:hover {
          text-decoration: underline;
        }

        .policy-page__cta {
          background: linear-gradient(135deg, #6550df, #504b91);
          color: #fff;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
        }

        .policy-page__cta h3 {
          margin: 0 0 12px;
          font-size: 24px;
          font-weight: 700;
        }

        .policy-page__cta p {
          margin: 0 0 24px;
          font-size: 16px;
          opacity: 0.9;
        }

        .policy-page__link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .policy-page__link:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateX(4px);
        }

        @media (max-width: 768px) {
          .policy-page {
            padding: 60px 20px;
          }

          .policy-page__content {
            padding: 32px 24px;
          }

          .policy-section h2 {
            font-size: 20px;
          }

          .policy-page__cta {
            padding: 32px 24px;
          }

          .policy-page__cta h3 {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
