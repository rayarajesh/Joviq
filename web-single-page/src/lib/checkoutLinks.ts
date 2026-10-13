import type { ProgramPlan } from "../data/siteContent";

export type PaymentChoice = "token" | "full";

const planNames: Record<string, string> = { SELF: "launch", INTERMEDIATE: "elevate" };

export function checkoutLink(planCode: string, paymentChoice: PaymentChoice, programSlug?: string, pathname = window.location.pathname) {
  const params = new URLSearchParams({
    plan: planNames[planCode] ?? planCode.toLowerCase(),
    payment: paymentChoice === "token" ? "reserve" : "full"
  });
  if (programSlug) params.set("program", programSlug);
  return `${pathname}?${params}`;
}

export function readCheckoutLink(search: string, plans: ProgramPlan[]) {
  const params = new URLSearchParams(search);
  if (params.get("cashfree") === "return") return null;
  const name = params.get("plan")?.toLowerCase();
  const plan = plans.find((item) => item.isActive && (planNames[item.code] ?? item.code.toLowerCase()) === name);
  const payment = params.get("payment");
  if (!plan || (payment !== "reserve" && payment !== "full")) return null;
  return {
    plan,
    programSlug: params.get("program") || undefined,
    paymentChoice: (payment === "reserve" ? "token" : "full") as PaymentChoice
  };
}
