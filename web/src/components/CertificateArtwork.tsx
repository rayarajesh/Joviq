import "../styles/certificate.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";

type CertificateArtworkProps = {
  type: string;
  studentName?: string;
  programTitle?: string;
  /** ISO date (yyyy-mm-dd or full timestamp) or already formatted text. */
  fromDate?: string;
  toDate?: string;
  certificateId?: string;
  qrCodeUrl?: string;
  authorizedSignatory?: string;
  signatureText?: string;
};

/**
 * Everything is placed in the template's own pixel grid (1600 × 1131) inside one SVG,
 * so the certificate keeps the exact original layout at any on-screen or printed size.
 * `y` values are text baselines measured from the printed sentences they continue.
 */
type Template = {
  src: string;
  /** Centred in the space between the subtitle and the first sentence. */
  name: { cx: number; y: number; maxWidth: number };
  /** Start right after "…Program in". */
  program: { x: number; y: number; maxWidth: number };
  /** "<start> to <end>" starts right after "from", on that word's baseline. */
  dates: { x: number; y: number };
  certificateId: { x: number; y: number; maxWidth: number };
  qr: { x: number; y: number; size: number };
  signatory: { cx: number; titleY: number; nameY: number; cover: [number, number, number, number] };
};

const WIDTH = 1600;
const HEIGHT = 1131;
const DEFAULT_SIGNATORY = "M VIJAYARAMARAJU";
const DEFAULT_SIGNATURE_LABEL = "Executive Director";

const TEMPLATES: Record<"Training" | "Internship", Template> = {
  Training: {
    src: "/assets/certificates/training-template.jpg",
    name: { cx: 800, y: 560, maxWidth: 1100 },
    program: { x: 990, y: 629, maxWidth: 490 },
    dates: { x: 828, y: 671 },
    certificateId: { x: 182, y: 1012, maxWidth: 352 },
    qr: { x: 553, y: 940, size: 134 },
    signatory: { cx: 1107, titleY: 1009, nameY: 1041, cover: [966, 982, 1250, 1052] },
  },
  Internship: {
    src: "/assets/certificates/internship-template.jpg",
    name: { cx: 800, y: 492, maxWidth: 1100 },
    program: { x: 1084, y: 574, maxWidth: 415 },
    dates: { x: 799, y: 616 },
    certificateId: { x: 169, y: 841, maxWidth: 352 },
    qr: { x: 540, y: 770, size: 134 },
    signatory: { cx: 878, titleY: 867, nameY: 898, cover: [722, 840, 1014, 906] },
  },
};

/** The student's name is the certificate's focal point: a large script face. */
const NAME_SIZE = 84;
const NAME_FONT = `400 ${NAME_SIZE}px "Joviq Certificate Script", cursive`;
/** Program and both dates share one font and size, sized to the certificate's own sentences. */
const FIELD_SIZE = 24;
const FIELD_FONT = `600 ${FIELD_SIZE}px Poppins, sans-serif`;
/** Matches the printed sentence text ("…from", "to") in the original artwork. */
const CONNECTOR_SIZE = 26;
const ID_SIZE = 29;
const ID_FONT = `400 ${ID_SIZE}px 'Times New Roman', Times, serif`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let measureContext: CanvasRenderingContext2D | null = null;

function measure(text: string, font: string) {
  measureContext ??= document.createElement("canvas").getContext("2d");
  if (!measureContext || !text) return 0;
  measureContext.font = font;
  return measureContext.measureText(text).width;
}

/** Font size (up to `base`) at which `text` fits `maxWidth`; only unusually long values shrink. */
function fitSize(text: string, font: string, base: number, maxWidth: number) {
  const width = measure(text, font);
  return width > maxWidth ? Math.max(base * (maxWidth / width), base * 0.6) : base;
}

function formatCertificateDate(value?: string) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  return MONTHS[Number(month) - 1] ? `${day} ${MONTHS[Number(month) - 1]} ${year}` : value;
}

const CERTIFICATE_FONTS = [NAME_FONT, FIELD_FONT, `500 ${CONNECTOR_SIZE}px "Joviq Certificate Body"`];

/** Loads the certificate fonts, then re-measures so fitted sizes use the real glyphs. */
function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!document.fonts) {
      setReady(true);
      return;
    }
    let active = true;
    void Promise.all(CERTIFICATE_FONTS.map((font) => document.fonts.load(font)))
      .catch(() => undefined)
      .then(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  return ready;
}

export function CertificateArtwork({
  type, studentName, programTitle, fromDate, toDate, certificateId,
  qrCodeUrl, authorizedSignatory, signatureText,
}: CertificateArtworkProps) {
  const internship = type === "Internship";
  const template = TEMPLATES[internship ? "Internship" : "Training"];
  const fontsReady = useFontsReady();
  const name = studentName?.trim() ?? "";
  const program = programTitle?.trim() ?? "";
  const from = formatCertificateDate(fromDate);
  const to = formatCertificateDate(toDate);
  const idText = `Certificate ID: ${certificateId || "—"}`;
  const signatory = authorizedSignatory?.trim() || DEFAULT_SIGNATORY;
  const signatureLabel = signatureText?.trim() || DEFAULT_SIGNATURE_LABEL;
  // The original artwork already prints the default signatory; only redraw it when it differs.
  const customSignatory =
    signatory.toUpperCase() !== DEFAULT_SIGNATORY || signatureLabel.toLowerCase() !== DEFAULT_SIGNATURE_LABEL.toLowerCase();

  const sizes = useMemo(() => ({
    name: fitSize(name, NAME_FONT, NAME_SIZE, template.name.maxWidth),
    program: fitSize(program, FIELD_FONT, FIELD_SIZE, template.program.maxWidth),
    id: fitSize(idText, ID_FONT, ID_SIZE, template.certificateId.maxWidth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [name, program, idText, template, fontsReady]);

  const [coverX1, coverY1, coverX2, coverY2] = template.signatory.cover;

  return (
    <div
      className="certificate-artwork"
      role="img"
      aria-label={`${internship ? "Internship" : "Training"} certificate for ${name || "student"}, ${program || "program"}, ${from || "start date"} to ${to || "end date"}. ${idText}.`}
      onContextMenu={(event) => event.preventDefault()}
    >
      <svg className="certificate-artwork__sheet" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
        <image href={template.src} width={WIDTH} height={HEIGHT} preserveAspectRatio="none" />
        <text className="certificate-artwork__name" x={template.name.cx} y={template.name.y} fontSize={sizes.name} textAnchor="middle">{name}</text>
        <text className="certificate-artwork__field" x={template.program.x} y={template.program.y} fontSize={sizes.program}>{program}</text>
        <text className="certificate-artwork__field" x={template.dates.x} y={template.dates.y} fontSize={FIELD_SIZE}>
          {from}
          <tspan className="certificate-artwork__connector" fontSize={CONNECTOR_SIZE}>{"\u00a0 to \u00a0"}</tspan>
          {to}
        </text>
        <text className="certificate-artwork__id" x={template.certificateId.x} y={template.certificateId.y} fontSize={sizes.id}>{idText}</text>
        <rect x={template.qr.x} y={template.qr.y} width={template.qr.size} height={template.qr.size} fill="#fff" />
        {qrCodeUrl ? (
          <image href={qrCodeUrl} x={template.qr.x} y={template.qr.y} width={template.qr.size} height={template.qr.size} />
        ) : null}
        {customSignatory ? (
          <>
            <rect x={coverX1} y={coverY1} width={coverX2 - coverX1} height={coverY2 - coverY1} fill="#fff" />
            <text className="certificate-artwork__signatory-title" x={template.signatory.cx} y={template.signatory.titleY} fontSize={25} textAnchor="middle">{signatureLabel}</text>
            <text className="certificate-artwork__signatory-name" x={template.signatory.cx} y={template.signatory.nameY} fontSize={25} textAnchor="middle">{signatory.toUpperCase()}</text>
          </>
        ) : null}
      </svg>
    </div>
  );
}

/** Waits for every image inside `root` so the printout never misses the template or QR code. */
async function imagesReady(root: HTMLElement) {
  await Promise.all(
    Array.from(root.querySelectorAll("image")).map((image) => {
      const href = image.getAttribute("href");
      if (!href) return Promise.resolve();
      const preload = new Image();
      preload.src = href;
      return preload.decode().catch(() => undefined);
    }),
  );
}

function printElement(source: HTMLElement | null) {
  if (!source) return;
  const printRoot = document.createElement("div");
  printRoot.className = "certificate-print-root";
  printRoot.appendChild(source.cloneNode(true));
  document.body.appendChild(printRoot);
  document.body.classList.add("is-printing-certificate");

  const cleanup = () => {
    document.body.classList.remove("is-printing-certificate");
    printRoot.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  void imagesReady(printRoot).then(() => window.print());
}

/** Full-screen, read-only certificate view with a single Print action. */
export function CertificateViewer({ certificate, onClose }: { certificate: CertificateArtworkProps; onClose: () => void }) {
  const artworkRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="certificate-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`${certificate.type} certificate`}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="certificate-viewer__toolbar">
        <strong>{certificate.type} Certificate</strong>
        <div>
          <button type="button" className="certificate-viewer__print" onClick={() => printElement(artworkRef.current)}>
            <Printer size={17} /> Print
          </button>
          <button ref={closeRef} type="button" className="certificate-viewer__close" aria-label="Close certificate" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="certificate-viewer__stage" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <div className="certificate-viewer__paper" ref={artworkRef}>
          <CertificateArtwork {...certificate} />
        </div>
        <p className="certificate-viewer__hint">Rotate your phone or pinch to zoom for a closer look.</p>
      </div>
    </div>,
    document.body,
  );
}

/** Print a certificate without opening the viewer first. */
export function useCertificatePrinter() {
  const [pending, setPending] = useState<CertificateArtworkProps | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pending) return;
    printElement(hostRef.current);
    setPending(null);
  }, [pending]);

  const host = pending
    ? createPortal(
        <div className="certificate-print-staging" ref={hostRef} aria-hidden="true">
          <CertificateArtwork {...pending} />
        </div>,
        document.body,
      )
    : null;

  return { print: setPending, host };
}

export type { CertificateArtworkProps };
