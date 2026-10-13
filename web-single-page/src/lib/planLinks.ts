import type { PaymentChoice } from "./checkoutLinks";

export function readPlanLink(pathname: string) {
  const match = /^\/(launch|elevate)(?:\/(reserve|full))?\/?$/i.exec(pathname);
  if (!match) return null;
  return {
    planCode: match[1].toLowerCase() === "launch" ? "SELF" : "INTERMEDIATE",
    paymentChoice: match[2] ? (match[2].toLowerCase() === "full" ? "full" : "token") as PaymentChoice : undefined
  };
}

export function planLink(planCode: string, paymentChoice?: PaymentChoice) {
  const plan = planCode === "SELF" ? "launch" : "elevate";
  return `/${plan}${paymentChoice ? `/${paymentChoice === "token" ? "reserve" : "full"}` : ""}`;
}
