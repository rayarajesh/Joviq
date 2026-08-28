type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className = "" }: BrandLogoProps) {
  const source = compact ? "/assets/joviq-mark.svg" : "/assets/joviq-logo.svg";
  const classes = ["brand-logo", compact ? "brand-logo--compact" : "", className].filter(Boolean).join(" ");

  return <img className={classes} src={source} alt="Joviq Technologies" decoding="async" />;
}
