import { useEffect, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import '../styles/cookie-consent.css';

type ConsentStatus = 'accepted' | 'rejected' | 'custom' | null;

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const savedConsent = localStorage.getItem('cookie_consent');
    if (!savedConsent) {
      setIsVisible(true);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(savedConsent);
        setPreferences(saved.preferences);
      } catch (e) {
        console.error('Error loading cookie preferences:', e);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveCookieConsent(allAccepted, 'accepted');
  };

  const handleRejectAll = () => {
    const minimal: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    saveCookieConsent(minimal, 'rejected');
  };

  const handleSavePreferences = () => {
    saveCookieConsent(preferences, 'custom');
  };

  const saveCookieConsent = (prefs: CookiePreferences, status: ConsentStatus) => {
    const consentData = {
      status,
      preferences: prefs,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie_consent', JSON.stringify(consentData));
    
    // Initialize cookies based on preferences
    initializeCookies(prefs);
    
    setIsVisible(false);
    setShowDetails(false);
  };

  const initializeCookies = (prefs: CookiePreferences) => {
    // This is where you'd initialize your tracking services
    if (prefs.analytics) {
      initializeAnalytics();
    }
    if (prefs.marketing) {
      initializeMarketing();
    }
    if (prefs.preferences) {
      initializePreferenceCookies();
    }
  };

  const initializeAnalytics = () => {
    // Initialize Google Analytics or similar
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  };

  const initializeMarketing = () => {
    // Initialize marketing pixels
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
      });
    }
  };

  const initializePreferenceCookies = () => {
    // Initialize preference-related cookies
    console.log('Preference cookies initialized');
  };

  const handlePreferenceChange = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Necessary cookies can't be unchecked
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent">
      <div className="cookie-consent__overlay" />
      <div className="cookie-consent__container">
        {/* Main Content */}
        {!showDetails ? (
          <div className="cookie-consent__content">
            <div className="cookie-consent__header">
              <h2>We value your privacy</h2>
              <button
                className="cookie-consent__close"
                onClick={() => setIsVisible(false)}
                aria-label="Close cookie banner"
              >
                <X size={20} />
              </button>
            </div>

            <p className="cookie-consent__description">
              We use cookies and similar technologies to enhance your browsing experience, 
              analyze site traffic, and personalize content. By clicking "Accept All", you 
              consent to our use of cookies as described in our{' '}
              <a href="/privacy-policy" className="cookie-consent__link">Privacy Policy</a> and{' '}
              <a href="/terms-and-conditions" className="cookie-consent__link">Terms and Conditions</a>.
            </p>

            <div className="cookie-consent__actions">
              <button
                className="cookie-consent__btn cookie-consent__btn--reject"
                onClick={handleRejectAll}
              >
                Reject All
              </button>

              <button
                className="cookie-consent__btn cookie-consent__btn--details"
                onClick={() => setShowDetails(true)}
              >
                <span>Manage Preferences</span>
                <ChevronDown size={18} />
              </button>

              <button
                className="cookie-consent__btn cookie-consent__btn--accept"
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          /* Detailed Preferences */
          <div className="cookie-consent__details">
            <div className="cookie-consent__header">
              <h2>Cookie Preferences</h2>
              <button
                className="cookie-consent__close"
                onClick={() => setShowDetails(false)}
                aria-label="Close preferences"
              >
                <X size={20} />
              </button>
            </div>

            <div className="cookie-consent__preferences">
              {/* Necessary Cookies */}
              <div className="cookie-consent__preference-item">
                <div className="cookie-consent__preference-header">
                  <label className="cookie-consent__checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.necessary}
                      disabled
                      readOnly
                      aria-label="Necessary cookies"
                    />
                    <span className="cookie-consent__checkbox-custom" />
                    <div>
                      <strong>Necessary Cookies</strong>
                      <span className="cookie-consent__badge">Always On</span>
                    </div>
                  </label>
                </div>
                <p className="cookie-consent__preference-description">
                  These cookies are essential for the website to function properly. They enable 
                  basic features like page navigation and access to secure areas of the website.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="cookie-consent__preference-item">
                <label className="cookie-consent__checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => handlePreferenceChange('analytics')}
                    aria-label="Analytics cookies"
                  />
                  <span className="cookie-consent__checkbox-custom" />
                  <div>
                    <strong>Analytics Cookies</strong>
                  </div>
                </label>
                <p className="cookie-consent__preference-description">
                  These cookies help us understand how visitors interact with our website by 
                  collecting and reporting information anonymously. This helps us improve our 
                  website and user experience.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="cookie-consent__preference-item">
                <label className="cookie-consent__checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => handlePreferenceChange('marketing')}
                    aria-label="Marketing cookies"
                  />
                  <span className="cookie-consent__checkbox-custom" />
                  <div>
                    <strong>Marketing Cookies</strong>
                  </div>
                </label>
                <p className="cookie-consent__preference-description">
                  These cookies are used to track visitors across websites and display personalized 
                  advertisements. They may be set by our advertising partners to build a profile 
                  of your interests.
                </p>
              </div>

              {/* Preference Cookies */}
              <div className="cookie-consent__preference-item">
                <label className="cookie-consent__checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.preferences}
                    onChange={() => handlePreferenceChange('preferences')}
                    aria-label="Preference cookies"
                  />
                  <span className="cookie-consent__checkbox-custom" />
                  <div>
                    <strong>Preference Cookies</strong>
                  </div>
                </label>
                <p className="cookie-consent__preference-description">
                  These cookies remember your preferences and choices, such as language, theme, 
                  and font size, to provide a more personalized experience on future visits.
                </p>
              </div>
            </div>

            <div className="cookie-consent__policy-links">
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
              <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                Terms and Conditions
              </a>
              <a href="/cookie-policy" target="_blank" rel="noopener noreferrer">
                Cookie Policy
              </a>
            </div>

            <div className="cookie-consent__details-actions">
              <button
                className="cookie-consent__btn cookie-consent__btn--reject"
                onClick={handleRejectAll}
              >
                Reject All
              </button>

              <button
                className="cookie-consent__btn cookie-consent__btn--save"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </button>

              <button
                className="cookie-consent__btn cookie-consent__btn--accept"
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
