export const SITE_NAME = "VetTrials";
export const SITE_URL = "http://127.0.0.1:3348";
export function absoluteUrl(path = "/"): string { return new URL(path, SITE_URL).toString(); }
export function serverApiUrl(path: string): string { return absoluteUrl(path); }
