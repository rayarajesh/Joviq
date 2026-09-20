import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  Download,
  FileText,
  FolderKanban,
  Headphones,
  Laptop,
  Lightbulb,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CertificateArtwork } from "./CertificateArtwork";
import type {
  CertificateResponse,
  EnrollmentResponse,
  PaymentTransactionResponse,
} from "../features/lms/api/lmsTypes";
import "../styles/student-modules.css";

export function StudentModuleHeader({
  module,
  onDashboard,
}: {
  module: string;
  onDashboard: () => void;
}) {
  const certificates = module === "Certificates";
  const payments = module === "Payments";
  const Icon = certificates ? FileText : payments ? CreditCard : Laptop;
  return (
    <header className="student-module-header">
      <div>
        <nav aria-label="Breadcrumb">
          <button onClick={onDashboard}>Dashboard</button>
          <ChevronRight size={14} />
          <span>{module}</span>
        </nav>
        {certificates && (
          <span className="student-module-eyebrow">CERTIFICATES</span>
        )}
        <h1>{certificates ? "Your Achievements" : module}</h1>
        <p>
          {certificates
            ? "Certificates will appear here after you successfully complete projects or programs. Keep learning and earn your credentials!"
            : payments
              ? "Manage your payments and view your access status."
              : "Here you can find and work on your assigned projects."}
        </p>
      </div>
      <div className="student-module-art" aria-hidden="true">
        <i>
          {certificates ? (
            <>
              Learn
              <br />
              Apply
              <br />
              Get Certified
            </>
          ) : payments ? (
            <>
              Secure
              <br />
              Learning
              <br />
              Ahead
            </>
          ) : (
            <>
              Apply
              <br />
              What You Learn
            </>
          )}
        </i>
        <div
          className={`student-module-illustration is-${module.toLowerCase()}`}
        >
          <Icon />
          <span>
            {payments ? <Check /> : certificates ? <Award /> : <BookOpen />}
          </span>
        </div>
        <small>
          {certificates ? (
            <>
              SKILLS
              <br />
              CERTIFICATIONS
              <br />
              BETTER
              <br />
              OPPORTUNITIES
            </>
          ) : payments ? (
            <>
              SIMPLE
              <br />
              SECURE
              <br />
              SEAMLESS
              <br />
              LEARNING
            </>
          ) : (
            <>
              Build
              <br />
              Practice
              <br />
              Showcase
              <br />
              Grow
            </>
          )}
        </small>
      </div>
    </header>
  );
}

export function StudentModuleEmpty({
  kind,
  onProgram,
}: {
  kind: "Projects" | "Certificates";
  onProgram: () => void;
}) {
  const certificate = kind === "Certificates";
  const Icon = certificate ? FileText : FolderKanban;
  return (
    <section className="student-module-surface">
      <div className="student-module-empty">
        <div
          className={`student-empty-art ${certificate ? "is-certificate" : "is-folder"}`}
        >
          <Icon />
          {certificate && <Award className="student-empty-seal" />}
          <span />
        </div>
        <h2>
          {certificate ? "No certificates yet." : "No projects assigned yet."}
        </h2>
        <p>
          {certificate ? (
            <>
              Complete your projects and programs to earn certificates
              <br />
              that showcase your skills.
            </>
          ) : (
            <>
              Your assigned project work will appear here when
              <br />
              the instructor or admin publishes it to you.
            </>
          )}
        </p>
        <button className="student-module-primary" onClick={onProgram}>
          <BookOpen size={17} />
          Explore My Program
        </button>
        {certificate && (
          <>
            <div className="student-empty-or">
              <span />
              OR
              <span />
            </div>
            <button className="student-module-text" onClick={onProgram}>
              View Learning Resources <ChevronRight size={15} />
            </button>
          </>
        )}
      </div>
      {certificate && (
        <div className="student-certificate-tips">
          <strong>
            <Lightbulb size={20} />
            Tips to earn certificates
          </strong>
          {[
            "Complete all lessons",
            "Work on and submit projects",
            "Get reviewed and approved",
          ].map((tip, index) => (
            <span key={tip}>
              <b>{index + 1}</b>
              {tip}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function certificateDate(value?: string) {
  return value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
}

export function StudentCertificates({
  certificates,
  onProgram,
}: {
  certificates: CertificateResponse[];
  onProgram: () => void;
}) {
  if (!certificates.length)
    return <StudentModuleEmpty kind="Certificates" onProgram={onProgram} />;
  function printCertificate() {
    window.print();
  }

  return (
    <div className="student-certificate-grid">
      {certificates.map((certificate) => (
        <article className="student-certificate-card" key={certificate.id}>
          <CertificateArtwork
            type={certificate.type}
            studentName={certificate.studentName}
            programTitle={certificate.programTitle}
            fromDate={certificateDate(certificate.fromDate)}
            toDate={certificateDate(certificate.toDate)}
            certificateId={certificate.certificateId}
            qrCodeUrl={certificate.qrCodeUrl}
            authorizedSignatory={certificate.authorizedSignatory}
            signatureText={certificate.signatureText}
          />
          <div className="student-certificate-actions">
            <button type="button" onClick={printCertificate}>
              <Download size={15} /> Download / Print
            </button>
          </div>
          {certificate.verificationUrl &&
          /^https?:\/\//i.test(certificate.verificationUrl) ? (
            <a
              className="student-module-text"
              href={certificate.verificationUrl}
              target="_blank"
              rel="noreferrer"
            >
              Verify certificate <ArrowRight size={16} />
            </a>
          ) : null}
        </article>
      ))}
    </div>
  );
}

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
export function StudentPayments({
  enrollment,
  payments,
  onReceipt,
  onPay,
  actionId,
}: {
  enrollment?: EnrollmentResponse;
  payments: PaymentTransactionResponse[];
  onReceipt: (id: string) => void;
  onPay: () => void;
  actionId: string | null;
}) {
  const receipt = payments.find((payment) => payment.status === "Verified");
  const unlocked = !!enrollment?.hasFullAccess && !enrollment.isAccessExpired;
  return (
    <div className="student-payments-layout">
      <div className="student-payments-top">
        <section className="student-module-surface">
          <div className="student-access-details">
            <span className="student-access-crown">
              <Crown />
            </span>
            <div className="student-access-copy">
              <small>ACCESS STATUS</small>
              <h2>
                {enrollment?.isAccessExpired
                  ? "Expired"
                  : (enrollment?.status ?? "Not enrolled")}
              </h2>
              <p>
                {unlocked
                  ? "You have full access to your program. Keep learning!"
                  : (enrollment?.lockedReason ??
                    "View your program and payment details below.")}
              </p>
            </div>
            <span className="student-unlocked">
              <Check size={16} />
              {unlocked ? "Full access unlocked" : "Access pending"}
            </span>
            <div className="student-payment-facts">
              <div>
                <CalendarDays />
                <p>
                  <small>Valid till</small>
                  {enrollment?.accessExpiresAt
                    ? new Date(enrollment.accessExpiresAt).toLocaleString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )
                    : "Not scheduled"}
                </p>
              </div>
              <div>
                <BookOpen />
                <p>
                  <small>Program</small>
                  {enrollment?.programTitle ?? "No program enrolled"}
                </p>
              </div>
              <div>
                <CreditCard />
                <p>
                  <small>Amount Paid</small>
                  {money(enrollment?.paidAmount ?? 0)} of{" "}
                  {money(enrollment?.totalAmount ?? 0)}
                </p>
              </div>
            </div>
            {enrollment &&
              (enrollment.balanceAmount > 0 || enrollment.isAccessExpired) && (
                <button
                  className="student-module-primary"
                  disabled={actionId?.startsWith("payment-")}
                  onClick={onPay}
                >
                  Make payment <ArrowRight size={16} />
                </button>
              )}
          </div>
        </section>
        <aside className="student-module-surface student-payment-support">
          <Headphones />
          <div>
            <h3>Need help with payments?</h3>
            <p>
              Facing an issue or have a question?
              <br />
              We're here to help.
            </p>
            <Link to="/request-callback" className="student-module-outline">
              Contact Support <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </div>
      <section className="student-module-surface student-payment-history">
        <header>
          <span>
            <FileText />
          </span>
          <div>
            <h3>Payment history</h3>
            <p>View your past payments and download receipts.</p>
          </div>
          <button
            className="student-module-outline"
            disabled={!receipt || actionId === `receipt-${receipt.id}`}
            onClick={() => receipt && onReceipt(receipt.id)}
          >
            <Download size={16} />
            Download receipt
          </button>
        </header>
        {payments.length ? (
          <div className="student-payment-table-wrap" role="region" aria-label="Payment history table" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      {new Date(payment.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td>{payment.invoiceNumber ?? payment.mode}</td>
                    <td>{money(payment.amount)}</td>
                    <td>{payment.status}</td>
                    <td>
                      {payment.status === "Verified" ? (
                        <button
                          className="student-module-text"
                          disabled={actionId === `receipt-${payment.id}`}
                          onClick={() => onReceipt(payment.id)}
                        >
                          Download <Download size={14} />
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="student-payment-empty">
            <span>
              <FileText size={28} />
            </span>
            <h3>No payment history yet.</h3>
            <p>
              Your payment details will appear here after you make a payment.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
