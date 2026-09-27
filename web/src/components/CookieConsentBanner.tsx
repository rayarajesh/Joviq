import { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { useCookieConsent } from '../hooks/useCookieConsent';
import '../styles/cookie-banner.css';

export function CookieConsentBanner() {
  const { hasConsent, acceptAll, rejectAll, saveCustom, isLoaded } = useCookieConsent();
  const [showBanner, setShowBanner] = useState(!hasConsent());
  const [showDetails, setShowDetails] = useState(false);
  const [customPreferences, setCustomPreferences] = useState({
    necessary: true,
    analytics: true,
    marketing: false,
    preferences: true,
  });

  if (!isLoaded || !showBanner) return null;

  const handleAcceptAll = () => {
    acceptAll();
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setShowBanner(false);
  };

  const handleSaveCustom = () => {
    saveCustom(customPreferences);
    setShowBanner(false);
    setShowDetails(false);
  };

  const togglePreference = (key: keyof typeof customPreferences) => {
    if (key === 'necessary') return; // Can't toggle necessary cookies
    setCustomPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      {/* Main Banner */}
      {!showDetails && (
        <div className="cookie-banner" role="dialog" aria-label="Cookie consent" aria-modal="true">
          <div className="cookie-banner__container">
            <div className="cookie-banner__content">
              <div className="cookie-banner__header">
                <h2>🍪 Cookie Policy</h2>
                <button
                  className="cookie-banner__close"
                  onClick={() => setShowBanner(false)}
                  aria-label="Close cookie banner"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="cookie-banner__description">
                We use cookies to enhance your experience, analyze traffic, and for marketing purposes. 
                By clicking "Accept All", you consent to our use of cookies. You can customize your preferences or reject non-essential cookies.
              </p>
              <div className="cookie-banner__links">
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                <span className="separator">•</span>
                <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>
              </div>
            </div>

            <div className="cookie-banner__actions">
              <button
                className="cookie-banner__btn cookie-banner__btn--secondary"
                onClick={handleRejectAll}
              >
                Reject All
              </button>
              <button
                className="cookie-banner__btn cookie-banner__btn--tertiary"
                onClick={() => setShowDetails(true)}
                aria-label="Customize cookie preferences"
              >
                <Settings size={18} />
                Manage Preferences
              </button>
              <button
                className="cookie-banner__btn cookie-banner__btn--primary"
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div className="cookie-modal__overlay" onClick={() => setShowDetails(false)}>
          <div className="cookie-modal" onClick={e => e.stopPropagation()}>
            <div className="cookie-modal__header">
              <h2>Cookie Preferences</h2>
              <button
                className="cookie-modal__close"
                onClick={() => setShowDetails(false)}
                aria-label="Close preferences"
              >
                <X size={24} />
              </button>
            </div>

            <div className="cookie-modal__content">
              {/* Necessary Cookies */}
              <div className="cookie-preference">
                <div className="cookie-preference__header">
                  <div className="cookie-preference__info">
                    <h3>🔒 Necessary Cookies</h3>
                    <p className="cookie-preference__description">
                      Essential for basic site functionality. These cookies cannot be disabled as they're required for the website to work properly.
                    </p>
                  </div>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={customPreferences.necessary}
                      disabled
                      aria-label="Necessary cookies (always enabled)"
                    />
                    <span className="cookie-toggle__slider"></span>
                  </label>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="cookie-preference">
                <div className="cookie-preference__header">
                  <div className="cookie-preference__info">
                    <h3>📊 Analytics Cookies</h3>
                    <p className="cookie-preference__description">
                      Help us understand how you use our website. This information helps us improve your experience.
                    </p>
                  </div>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={customPreferences.analytics}
                      onChange={() => togglePreference('analytics')}
                      aria-label="Toggle analytics cookies"
                    />
                    <span className="cookie-toggle__slider"></span>
                  </label>
                </div>
              </div>

              {/* Preferences Cookies */}
              <div className="cookie-preference">
                <div className="cookie-preference__header">
                  <div className="cookie-preference__info">
                    <h3>⚙️ Preference Cookies</h3>
                    <p className="cookie-preference__description">
                      Remember your choices and preferences to personalize your experience on our site.
                    </p>
                  </div>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={customPreferences.preferences}
                      onChange={() => togglePreference('preferences')}
                      aria-label="Toggle preference cookies"
                    />
                    <span className="cookie-toggle__slider"></span>
                  </label>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="cookie-preference">
                <div className="cookie-preference__header">
                  <div className="cookie-preference__info">
                    <h3>📢 Marketing Cookies</h3>
                    <p className="cookie-preference__description">
                      Used to track your activity across websites and deliver personalized advertisements.
                    </p>
                  </div>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={customPreferences.marketing}
                      onChange={() => togglePreference('marketing')}
                      aria-label="Toggle marketing cookies"
                    />
                    <span className="cookie-toggle__slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="cookie-modal__footer">
              <button
                className="cookie-modal__btn cookie-modal__btn--secondary"
                onClick={() => setShowDetails(false)}
              >
                Cancel
              </button>
              <button
                className="cookie-modal__btn cookie-modal__btn--primary"
                onClick={handleSaveCustom}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
