import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { PUBLIC_SITE_URL, SITE_URL, publicAbsoluteUrl, serverApiUrl } from '../src/lib/site.ts';

test('release metadata has a distinct public HTTPS origin; API stays loopback', () => {
  assert.equal(PUBLIC_SITE_URL, 'https://vettrials.org');
  assert.equal(publicAbsoluteUrl('/resources/dog-chemo-cost'), 'https://vettrials.org/resources/dog-chemo-cost');
  assert.equal(SITE_URL, 'http://127.0.0.1:3348');
  assert.equal(serverApiUrl('/api/trials'), 'http://127.0.0.1:3348/api/trials');
});

test('every guide social image is its actual checked-in hero, not an invented path', () => {
  const resources = JSON.parse(fs.readFileSync(new URL('../src/content/resources.json', import.meta.url)));
  const guides = resources.filter(r => r.image);
  assert.equal(guides.length, 7);
  for (const r of guides) {
    assert.equal(publicAbsoluteUrl(r.canonical), `https://vettrials.org/resources/${r.slug}`);
    assert.equal(new URL(publicAbsoluteUrl(r.image.src)).origin, PUBLIC_SITE_URL);
    assert.ok(fs.statSync(new URL('../public' + r.image.src, import.meta.url)).size > 0);
  }
});
