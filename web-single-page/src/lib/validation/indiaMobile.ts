const indiaMobileDigitsPattern = /^[6-9][0-9]{9}$/;

export function toIndiaMobileNumber(value: FormDataEntryValue | null) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 10);
  return indiaMobileDigitsPattern.test(digits) ? `+91${digits}` : "";
}
