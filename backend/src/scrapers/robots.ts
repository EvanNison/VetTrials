// Minimal robots.txt compliance check.
//
// We fetch /robots.txt for each origin once and cache the result. For each URL
// we want to scrape, we check whether our user-agent is disallowed from that
// path. Wildcards (*) and end-of-string ($) are honored. Crawl-delay is
// surfaced for callers that want to respect it.
//
// References:
//   https://www.rfc-editor.org/rfc/rfc9309 (Robots Exclusion Protocol)

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface RobotsRules {
  // Most-specific user-agent group's disallow patterns (lowercased).
  disallow: string[];
  // Most-specific user-agent group's allow patterns (lowercased).
  allow: string[];
  crawlDelaySec: number | null;
  fetchedAt: number;
}

const cache = new Map<string, RobotsRules | "unavailable">();

/**
 * Returns true if the given URL is allowed for our user-agent token.
 * Fails open: if robots.txt cannot be fetched, we assume allowed.
 */
export async function isAllowedByRobots(
  url: string,
  userAgentToken: string
): Promise<boolean> {
  const rules = await getRules(url);
  if (rules === "unavailable") return true;

  const path = new URL(url).pathname + new URL(url).search;
  return checkPath(path, rules, userAgentToken);
}

/**
 * Returns the crawl-delay (seconds) declared for our user-agent in robots.txt,
 * or null if none. Callers can use this to space out requests.
 */
export async function getCrawlDelay(url: string): Promise<number | null> {
  const rules = await getRules(url);
  if (rules === "unavailable") return null;
  return rules.crawlDelaySec;
}

async function getRules(url: string): Promise<RobotsRules | "unavailable"> {
  const origin = new URL(url).origin;
  const cached = cache.get(origin);
  if (cached !== undefined) {
    if (cached === "unavailable") return "unavailable";
    if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;
  }

  try {
    const res = await fetch(origin + "/robots.txt", {
      headers: {
        "User-Agent": getBotUserAgent(),
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      cache.set(origin, "unavailable");
      return "unavailable";
    }
    const text = await res.text();
    const parsed = parseRobotsTxt(text);
    parsed.fetchedAt = Date.now();
    cache.set(origin, parsed);
    return parsed;
  } catch {
    cache.set(origin, "unavailable");
    return "unavailable";
  }
}

/**
 * Parse a robots.txt body. We pick the rule group that most specifically
 * matches "vettrials" (case-insensitive substring), falling back to the
 * "*" group.
 */
function parseRobotsTxt(body: string): RobotsRules {
  const lines = body.split(/\r?\n/);
  // Group lines under their preceding User-agent declarations.
  type Group = { agents: string[]; disallow: string[]; allow: string[]; crawlDelay: number | null };
  const groups: Group[] = [];
  let current: Group | null = null;
  let expectingAgent = true;

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (field === "user-agent") {
      if (expectingAgent || !current) {
        current = { agents: [value.toLowerCase()], disallow: [], allow: [], crawlDelay: null };
        groups.push(current);
        expectingAgent = false;
      } else {
        current.agents.push(value.toLowerCase());
      }
    } else if (current) {
      expectingAgent = true;
      if (field === "disallow") current.disallow.push(value);
      else if (field === "allow") current.allow.push(value);
      else if (field === "crawl-delay") {
        const n = Number(value);
        if (!Number.isNaN(n)) current.crawlDelay = n;
      }
    }
  }

  // Pick most specific group: agent containing "vettrials", else "*".
  const specific = groups.find((g) =>
    g.agents.some((a) => a.includes("vettrials"))
  );
  const wildcard = groups.find((g) => g.agents.includes("*"));
  const chosen = specific ?? wildcard;
  return {
    disallow: chosen?.disallow ?? [],
    allow: chosen?.allow ?? [],
    crawlDelaySec: chosen?.crawlDelay ?? null,
    fetchedAt: 0,
  };
}

/**
 * Match a path against allow/disallow rules, longest-match wins
 * (per Google's interpretation of the standard).
 */
function checkPath(
  path: string,
  rules: RobotsRules,
  _userAgentToken: string
): boolean {
  const allowMatch = longestMatch(path, rules.allow);
  const disallowMatch = longestMatch(path, rules.disallow);

  if (disallowMatch == null) return true;
  if (allowMatch == null) return disallowMatch.length === 0; // empty Disallow = allow all
  return allowMatch.length >= disallowMatch.length;
}

function longestMatch(path: string, patterns: string[]): string | null {
  let best: string | null = null;
  for (const raw of patterns) {
    if (matches(path, raw) && (best == null || raw.length > best.length)) {
      best = raw;
    }
  }
  return best;
}

function matches(path: string, pattern: string): boolean {
  if (pattern === "") return true; // empty Disallow means allow all (no match)
  // Convert robots.txt pattern (* wildcard, $ end-anchor) to regex.
  const endAnchor = pattern.endsWith("$");
  const body = endAnchor ? pattern.slice(0, -1) : pattern;
  const escaped = body
    .split("*")
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  const re = new RegExp("^" + escaped + (endAnchor ? "$" : ""));
  return re.test(path);
}
import { getBotUserAgent } from "./user-agent.js";
