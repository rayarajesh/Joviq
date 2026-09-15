export function CertificateSection() {
  return (
    <section className="site-section certificate-showcase" id="certifications">
      <div className="certificate-showcase__intro">
        <span className="certificate-showcase__eyebrow">LEARN <b>•</b> BUILD <b>•</b> GROW</span>
        <h2>
          Turn Learning
          <span>Into Real Skills.</span>
        </h2>
        <p>
          Gain hands-on training, work on real-world projects,
          <br className="certificate-showcase__desktop-break" />
          and earn a certificate that reflects your abilities.
        </p>
      </div>

      <div className="certificate-preview-stage">
        <img
          src="/assets/training-certificate.png"
          alt="Joviq training certificate"
          className="certificate-image"
        />
      </div>
    </section>
  );
}
