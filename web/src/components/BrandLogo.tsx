type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className = "" }: BrandLogoProps) {
  const source = compact ? "/assets/joviq-mark.svg" : "/assets/joviq-logo.svg";
  const classes = ["brand-logo", compact ? "brand-logo--compact" : "", className].filter(Boolean).join(" ");

  return (
    <span className="brand-logo-shell" aria-label="Joviq Technologies" role="img">
      <img className={classes} src={source} alt="Joviq Technologies" decoding="async" />
    </span>
  );
}
