# Contributing to VetTrials

Thanks for being here. This project is small and the contribution surface is real — every new institution we cover means more vets find more trials for more patients.

## Quickest way to help: propose a new source

If you know of a vet school, teaching hospital, or registry that publishes clinical trials and isn't in our list, open an issue using the **"Propose a new source"** template. We'll need:

- Institution name
- URL to their clinical trials listing page
- Whether the page is static HTML or JavaScript-rendered
- Any quirks (login required, geographic restrictions, language other than English)

The bar to merge a new source is: it scrapes cleanly, the AI extraction returns sensible JSON, and `npm run scrape -- --source <ShortName>` works end-to-end.

## Development setup

Follow the [Quickstart in the README](README.md#quickstart-self-host). You'll need Node 20+, PostgreSQL 14+, and an Anthropic API key.

A full scrape of all sources costs ~$0.50–$2 in Claude API fees. While developing, scrape one source at a time:

```bash
cd backend
npm run scrape -- --source CSU
```

## Code style

- **TypeScript** everywhere. No `any` — define proper types or use `unknown`.
- **Functional components** in React.
- **Zod** for runtime validation of any data crossing a trust boundary (Claude output, user input, external APIs).
- **Prisma** for all DB access — no raw SQL unless there's a clear reason.
- **Conventional Commits** for commit messages: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.

## Adding a scraper for a new source

Most sources work with the default scraper. For ones that don't (multi-page hubs, JavaScript pagination, rate-limited sites), add an entry to `SOURCE_OVERRIDES` in `backend/src/scrapers/scrape.ts`:

```typescript
"YourSchool": {
  urls: ["https://example.edu/clinical-trials"],
  waitMs: 4000,  // longer if the page is JS-heavy
}
```

For multi-page sources, list each sub-page URL — the scraper will fetch and extract them separately to avoid Claude token limits.

## Pull request checklist

- [ ] Branch is up to date with `main`
- [ ] `npm run build` passes in both `backend/` and `frontend/`
- [ ] No real secrets, API keys, or `.env` files committed
- [ ] If you added a new source: ran a full scrape locally and verified at least one trial extracted correctly
- [ ] If you changed the extraction prompt or schema: tested against at least 3 different sources

## Reporting bugs

Use the **Bug report** issue template. Include:

- What you expected to happen
- What actually happened (screenshot if it's UI)
- Source name (if it's a scraping bug)
- Steps to reproduce

## Reporting security issues

**Please don't open public issues for security vulnerabilities.** Email **evan@nisonco.com** with details. We'll respond within 72 hours. See [SECURITY.md](SECURITY.md) when it exists.

## Code of conduct

Be kind. Assume good faith. This project exists to help animals get medical care; that's worth more than being right on the internet.

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0-or-later](LICENSE) — the same license as the rest of the project.

You also grant the maintainer (Evan Nison / NisonCo) a perpetual, irrevocable, non-exclusive right to relicense your contributions under any [OSI-approved license](https://opensource.org/licenses) (for example, a more permissive license such as MIT or Apache-2.0) in future releases. This lets the project move to a more permissive license down the road without having to track down every past contributor. It does **not** affect the AGPL-3.0 terms under which the code is, and will remain, available to everyone.
