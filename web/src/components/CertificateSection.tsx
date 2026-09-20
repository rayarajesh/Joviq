export function CertificateSection() {
  return (
    <section className="site-section certificate-showcase" id="certifications">
      <div className="certificate-showcase__intro">
        <span className="certificate-showcase__eyebrow">LEARN <b>•</b> BUILD <b>•</b> GROW</span>
        <h2>
          Build Real Skills.
          <span>Earn Your Certificates.</span>
        </h2>
        <p>
          Showcase your learning with a training certificate
          <br className="certificate-showcase__desktop-break" />
          and your practical experience with an internship certificate.
        </p>
      </div>

      <div className="certificate-preview-stage">
        <img
          src="/assets/both-certificates.png"
          alt="Joviq training and internship certificates"
          className="certificate-image"
        />
      </div>
    </section>
  );
}
