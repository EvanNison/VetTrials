const DEFAULT_PUBLIC_SITE_URL = "https://vettrials.org";
const CONTACT_EMAIL = "evan@nisonco.com";

export function getPublicSiteUrl(): string {
  return (
    process.env.PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    DEFAULT_PUBLIC_SITE_URL
  ).replace(/\/$/, "");
}

export function getBotUserAgent(): string {
  return `VetTrials/1.0 (+${getPublicSiteUrl()}; ${CONTACT_EMAIL})`;
}
