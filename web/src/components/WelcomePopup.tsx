import { useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/welcome-popup.css";

const welcomeSeenKey = "joviq:welcome-seen";
const welcomeDelayMs = 5000;

function hasSeenWelcome() {
  try {
    return localStorage.getItem(welcomeSeenKey) === "true";
  } catch {
    // Avoid repeated interruptions when browser storage is unavailable.
    return true;
  }
}

export function WelcomePopup() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreScrollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || hasSeenWelcome()) return;
    let timer: ReturnType<typeof setTimeout>;
    function showWelcome() {
      if (!dialog || hasSeenWelcome()) return;
      // Let visitors finish any existing dialog before showing the welcome.
      if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) {
        timer = setTimeout(showWelcome, 1000);
        return;
      }
      try {
        localStorage.setItem(welcomeSeenKey, "true");
      } catch {
        return;
      }
      const previousOverflow = document.body.style.overflow;
      restoreScrollRef.current = () => { document.body.style.overflow = previousOverflow; };
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }
    timer = setTimeout(showWelcome, welcomeDelayMs);
    return () => {
      clearTimeout(timer);
      if (dialog.open) dialog.close();
      restoreScrollRef.current?.();
      restoreScrollRef.current = null;
    };
  }, []);

  function close() {
    dialogRef.current?.close();
    restoreScrollRef.current?.();
  }

  return (
    <dialog
      ref={dialogRef}
      className="welcome-popup"
      aria-labelledby="welcome-popup-title"
      aria-describedby="welcome-popup-description"
      onClose={() => restoreScrollRef.current?.()}
    >
      <div className="welcome-popup__card">
        <button className="welcome-popup__close" type="button" aria-label="Close welcome popup" onClick={close} autoFocus>
          <X size={23} />
        </button>
        <p className="welcome-popup__brand">JOVIQ TECHNOLOGIES</p>
        <p className="welcome-popup__badge">UPSKILL YOUR FUTURE</p>
        <h2 id="welcome-popup-title">Join us to explore <span>our courses</span></h2>
        <p id="welcome-popup-description" className="welcome-popup__description">
          Gain industry-ready skills with expert-led training and real-world projects.
        </p>
        <div className="welcome-popup__benefits">
          <div><strong>Industry-Relevant</strong><span>Curriculum</span></div>
          <div><strong>Hands-on</strong><span>Projects</span></div>
          <div><strong>Expert-Led</strong><span>Training</span></div>
        </div>
        <Link className="welcome-popup__join" to="/request-callback" onClick={close}>Join Us <ArrowRight size={23} /></Link>
      </div>
    </dialog>
  );
}
