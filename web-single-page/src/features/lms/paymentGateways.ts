// Script loaders for the payment gateways, identical to /web's checkout page.

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = { error?: { description?: string; reason?: string } };

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void;
};

export type CashfreeResult = { error?: { message?: string }; redirect?: boolean; paymentDetails?: unknown } | undefined;

type CashfreeCheckout = {
  checkout: (options: { paymentSessionId: string; redirectTarget?: "_modal" | "_self" | "_blank" }) => Promise<unknown>;
};

type CashfreeFactory = (options: { mode: "sandbox" | "production" }) => CashfreeCheckout;

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
    Cashfree?: CashfreeFactory;
  }
}

export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay checkout could not load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not load."));
    document.body.appendChild(script);
  });
}

let cashfreeScriptPromise: Promise<void> | null = null;

export function loadCashfreeScript() {
  if (window.Cashfree) return Promise.resolve();
  if (cashfreeScriptPromise) return cashfreeScriptPromise;

  cashfreeScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => fail(), 15000);
    const cleanup = () => {
      window.clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
    };
    const fail = () => {
      cleanup();
      script.remove();
      reject(new Error("Cashfree checkout could not load. Please try again."));
    };
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (!window.Cashfree) return fail();
      cleanup();
      resolve();
    };
    script.onerror = fail;
    document.body.appendChild(script);
  }).catch((error) => {
    cashfreeScriptPromise = null;
    throw error;
  });
  return cashfreeScriptPromise;
}
