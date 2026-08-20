import type { FormEvent, InputHTMLAttributes } from "react";

type IndiaMobileInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "autoComplete" | "inputMode" | "maxLength" | "minLength" | "onInput" | "pattern" | "type"
> & {
  label: string;
  name: string;
};

export function IndiaMobileInput({ label, ...inputProps }: IndiaMobileInputProps) {
  function handleInput(event: FormEvent<HTMLInputElement>) {
    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 10);
  }

  return (
    <label>
      {label}
      <div className="phone-field">
        <span>+91</span>
        <input
          {...inputProps}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          pattern="[6-9][0-9]{9}"
          minLength={10}
          maxLength={10}
          placeholder={inputProps.placeholder ?? "9876543210"}
          title="Enter a valid 10-digit Indian mobile number."
          onInput={handleInput}
        />
      </div>
    </label>
  );
}
