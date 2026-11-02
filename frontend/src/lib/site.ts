export const SITE_NAME = "VetTrials";
export const SITE_URL = "https://vettrials.org";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export function serverApiUrl(path: string): string {
  const baseUrl = (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    SITE_URL
  ).replace(/\/$/, "");

  return `${baseUrl}${path}`;
}
