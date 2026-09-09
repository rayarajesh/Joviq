import { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export type ToastMessageState = { tone: "success" | "error"; text: string };

type ToastMessageProps = {
  message: ToastMessageState | null;
  onDismiss: () => void;
};

export function ToastMessage({ message, onDismiss }: ToastMessageProps) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timeoutId);
  }, [message, onDismiss]);

  if (!message) {
    return null;
  }

  const isError = message.tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      <div className={`toast-message toast-message--${message.tone}`} role={isError ? "alert" : "status"}>
        <span className="toast-message__icon"><Icon size={19} strokeWidth={2.4} /></span>
        <span className="toast-message__text">{message.text}</span>
        <button className="toast-message__close" type="button" aria-label="Dismiss notification" onClick={onDismiss}>
          <X size={17} />
        </button>
        <span className="toast-message__progress" aria-hidden="true" />
      </div>
    </div>
  );
}
