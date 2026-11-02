export const SITE_NAME = "VetTrials";
// Release-facing metadata must not inherit the private review/API origin.
export const PUBLIC_SITE_URL = "https://vettrials.org";
export const SITE_URL = "http://127.0.0.1:3348";
export function publicAbsoluteUrl(path = "/"): string { return new URL(path, PUBLIC_SITE_URL).toString(); }
export function absoluteUrl(path = "/"): string { return new URL(path, SITE_URL).toString(); }
export function serverApiUrl(path: string): string { return absoluteUrl(path); }
