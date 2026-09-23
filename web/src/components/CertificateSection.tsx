import { useEffect, useState } from "react";

const certificates = [
  {
    title: "Training Certificate",
    description: "Skills built through structured learning and project-based practice.",
    image: "/assets/training-certificate.png",
    alt: "Joviq training certificate"
  },
  {
    title: "Internship Certificate",
    description: "Applied learning and hands-on project experience with real outcomes.",
    image: "/assets/internship-certificate.jpg",
    alt: "Joviq internship certificate"
  }
];

export function CertificateSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeCertificate = certificates[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % certificates.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      className="site-section certificate-showcase"
      id="certifications"
    >
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

      <div className="certificate-carousel" aria-label="Certificate highlights carousel">
        <div className="certificate-carousel__viewport">
          <article className={`certificate-carousel__slide certificate-carousel__slide--index-${activeIndex}`} aria-label={`${activeCertificate.title} slide`}>
            <div className="certificate-carousel__card">
              <img src={activeCertificate.image} alt={activeCertificate.alt} className="certificate-image" />
            </div>
            <div className="certificate-carousel__meta">
              <strong>{activeCertificate.title}</strong>
              <p>{activeCertificate.description}</p>
            </div>
          </article>
        </div>

        <div className="certificate-carousel__dots" aria-label="Certificate slide selection">
          {certificates.map((certificate, index) => (
            <button
              key={certificate.title}
              type="button"
              aria-label={`Show ${certificate.title}`}
              aria-current={activeIndex === index ? "true" : undefined}
              disabled
              className={activeIndex === index ? "is-active" : ""}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
