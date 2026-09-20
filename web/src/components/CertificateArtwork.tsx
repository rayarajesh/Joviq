type CertificateArtworkProps = {
  type: string;
  studentName?: string;
  programTitle?: string;
  fromDate?: string;
  toDate?: string;
  certificateId?: string;
  qrCodeUrl?: string;
  authorizedSignatory?: string;
  signatureText?: string;
};

/** Uses the certificate asset and overlay classes shipped with the certificate screens. */
export function CertificateArtwork({
  type, studentName, programTitle, fromDate, toDate, certificateId,
  qrCodeUrl, authorizedSignatory, signatureText,
}: CertificateArtworkProps) {
  const internship = type === "Internship";
  return (
    <div
      className={`certificate-artwork${internship ? " is-internship" : ""}`}
      role="img"
      aria-label={`${type} certificate. ${studentName || "Student name"}. ${programTitle || "Program"}. ${fromDate || "Start date"} to ${toDate || "End date"}. Certificate ID: ${certificateId || "Preview"}. ${authorizedSignatory || ""}`}
    >
      <img src="/assets/training-certificate.png" alt="" aria-hidden="true" />
      {internship && <span className="certificate-artwork__title">INTERNSHIP<br />CERTIFICATE</span>}
      <span className="certificate-artwork__student">{studentName}</span>
      <span className="certificate-artwork__program">{programTitle}</span>
      <span className="certificate-artwork__from-date">{fromDate}</span>
      <span className="certificate-artwork__to-date">{toDate}</span>
      <span className="certificate-artwork__static-id-cover" aria-hidden="true" />
      <span className="certificate-artwork__static-sign-cover" aria-hidden="true" />
      <span className="certificate-artwork__id">{certificateId || "Certificate ID"}</span>
      <span className="certificate-artwork__qr">
        {qrCodeUrl ? <img src={qrCodeUrl} alt="" /> : <span>Verification QR</span>}
      </span>
      <span className="certificate-artwork__sign">
        {signatureText && <span>{signatureText}</span>}
        <strong>{authorizedSignatory}</strong>
      </span>
    </div>
  );
}
