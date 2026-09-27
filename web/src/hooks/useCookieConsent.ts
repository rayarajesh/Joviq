import { useState, useEffect } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface CookieConsentData {
  status: 'accepted' | 'rejected' | 'custom';
  preferences: CookiePreferences;
  timestamp: string;
}

const STORAGE_KEY = 'cookie_consent';

export function useCookieConsent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [consentData, setConsentData] = useState<CookieConsentData | null>(null);

  // Load consent data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConsentData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading cookie consent:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Check if user has given consent
  const hasConsent = (): boolean => {
    return consentData !== null;
  };

  // Accept all cookies
  const acceptAll = (): void => {
    const data: CookieConsentData = {
      status: 'accepted',
      preferences: {
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true,
      },
      timestamp: new Date().toISOString(),
    };
    saveConsent(data);
  };

  // Reject all non-essential cookies
  const rejectAll = (): void => {
    const data: CookieConsentData = {
      status: 'rejected',
      preferences: {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      },
      timestamp: new Date().toISOString(),
    };
    saveConsent(data);
  };

  // Save custom preferences
  const saveCustom = (preferences: CookiePreferences): void => {
    const data: CookieConsentData = {
      status: 'custom',
      preferences,
      timestamp: new Date().toISOString(),
    };
    saveConsent(data);
  };

  // Save consent data to localStorage and update state
  const saveConsent = (data: CookieConsentData): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setConsentData(data);
    initializeCookies(data.preferences);
  };

  // Initialize cookies based on preferences
  const initializeCookies = (preferences: CookiePreferences): void => {
    // Google Analytics consent
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        'ad_storage': preferences.marketing ? 'granted' : 'denied',
        'personalization_storage': preferences.preferences ? 'granted' : 'denied',
      });
    }

    // Set cookie flags in sessionStorage for your own use
    sessionStorage.setItem('analytics_enabled', String(preferences.analytics));
    sessionStorage.setItem('marketing_enabled', String(preferences.marketing));
    sessionStorage.setItem('preferences_enabled', String(preferences.preferences));

    // Dispatch custom event for other scripts to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: preferences }));
  };

  // Check if a specific cookie type is allowed
  const isCookieAllowed = (type: keyof CookiePreferences): boolean => {
    if (!consentData) return false;
    return consentData.preferences[type] ?? false;
  };

  // Reset consent (for testing or user request)
  const resetConsent = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    setConsentData(null);
  };

  return {
    hasConsent,
    acceptAll,
    rejectAll,
    saveCustom,
    isCookieAllowed,
    resetConsent,
    isLoaded,
    consentData,
  };
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
