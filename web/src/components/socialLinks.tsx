export const socialLinks = [
  { label: "Instagram", shortLabel: "IG", href: "https://www.instagram.com/joviqtechnologies?stkn=MXY1djRvd3VjNmNoMg==", Icon: InstagramIcon, tone: "instagram" },
  { label: "LinkedIn", shortLabel: "in", href: "https://www.linkedin.com/company/joviq-technologies-private-limited/", Icon: LinkedInIcon, tone: "linkedin" },
  { label: "Facebook", shortLabel: "f", href: "https://www.facebook.com/joviqtechnologies?rdid=SVZR8OQtIHtWHw5s&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1Bx12pxKtp%2F#", Icon: FacebookIcon, tone: "facebook" },
  { label: "WhatsApp", shortLabel: "WA", href: "https://wa.me/919281977188", Icon: WhatsAppIcon, tone: "whatsapp" }
];

type SocialIconProps = {
  size?: number;
  strokeWidth?: number;
};

function InstagramIcon({ size = 24 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.1" cy="6.9" r="1.2" fill="currentColor" />
    </svg>
  );
}
function LinkedInIcon({ size = 24 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 8.8A1.8 1.8 0 1 1 6.5 5.2a1.8 1.8 0 0 1 0 3.6Zm-1.4 1.7h2.8v8.5H5.1v-8.5Zm4.3 0h2.7v1.2h.1c.4-.8 1.5-1.6 3.1-1.6 3.3 0 3.9 2.2 3.9 5.1v4.8h-2.8v-4.4c0-1-.1-2.3-1.4-2.3s-1.6 1.1-1.6 2.3v4.4h-2.8v-8.5Z" fill="currentColor"/>
    </svg>
  );
}

function FacebookIcon({ size = 24 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.4 21v-8h2.6l.5-3h-3.1V7.2c0-.9.3-1.5 1.7-1.5H17V2.9c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.7-4.5 4.7V10H7v3h2.8v8h3.6Z" fill="currentColor"/>
    </svg>
  );
}

function WhatsAppIcon({ size = 24 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.2 19.2 6.3 16A8.2 8.2 0 1 1 9.5 19l-4.3.2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.2 8.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.2 0 .4-.1.6l-.5.6c.6 1.1 1.5 2 2.6 2.6l.6-.5c.2-.2.4-.2.6-.1l1.4.6c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-1 .3-1.6.1-2.6-.8-4.8-3-5.8-5.6-.2-.6-.1-1.2.1-1.6Z" fill="currentColor" />
    </svg>
  );
}

