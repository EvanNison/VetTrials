# Security Policy

## Reporting a vulnerability

If you've found a security issue in VetTrials, please **do not open a public
GitHub issue**. Email us privately at:

> **evan@nisonco.com**

Include:

- A description of the issue and the impact you think it has
- Steps to reproduce, or a proof of concept
- Your name / handle if you'd like credit (optional)

We'll acknowledge receipt within **72 hours** and aim to send a substantive
update within **7 days**. If the issue is confirmed, we'll work on a fix and
coordinate disclosure with you. Please give us reasonable time to ship a fix
before any public discussion.

## Scope

In scope:

- The hosted application at vet-trials.replit.app (and any future official
  domain like vettrials.org)
- The code in this repository (backend, frontend, scraper, extraction
  pipeline)
- The public API exposed by the backend

Out of scope:

- Vulnerabilities in third-party services we depend on (Anthropic API, Resend,
  Replit, GitHub, etc.) — please report those to the vendor
- Issues affecting third-party forks or self-hosted instances we don't operate
- Social engineering, physical attacks, denial-of-service that requires
  unrealistic resource usage

## Things we'd especially like to hear about

- Anything that could expose subscriber email addresses or notification
  preferences
- API endpoints that leak internal fields (raw HTML, scrape error stacks,
  internal IDs we didn't intend to expose)
- Authentication/authorization bypass on any future authenticated endpoints
- Injection vulnerabilities (SQL via Prisma raw queries, command injection in
  the scraper)
- Anything that could be used to abuse our Anthropic API budget at scale

## Safe-harbor

We will not pursue legal action against researchers who:

- Make a good-faith effort to follow this policy
- Avoid privacy violations, data destruction, and service degradation
- Give us a reasonable window to fix issues before public disclosure

Thank you for helping keep VetTrials and its users safe.
