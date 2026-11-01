import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CopyBlocks, JsonLd } from '@/components/SeoContent';
import { packets } from '@/content/conditions';
import { SpeciesList } from '@/components/SpeciesIcon';
import { institutionSourceUrl } from '@/lib/source-link';
import { serverApiUrl, absoluteUrl } from '@/lib/site';
import type { Trial } from '@/types';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return packets.filter(p => p.isHub).map(p => ({ slug: p.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const packet = packets.find(p => p.isHub && p.slug === slug);
  if (!packet) return {};
  return { title: packet.title.replace(/\s*\|\s*VetTrials$/, ''), description: packet.description,
    alternates: { canonical: packet.route }, robots: { index: false, follow: false },
    openGraph: { type: 'website', title: packet.title, description: packet.description, url: absoluteUrl(packet.route), siteName: 'VetTrials' },
    twitter: { card: 'summary', title: packet.title, description: packet.description },
  };
}

export default async function ConditionPage({ params }: Props) {
  const { slug } = await params;
  const packet = packets.find(p => p.isHub && p.slug === slug);
  if (!packet) notFound();
  const trials = (await Promise.all(packet.recordIds.map(async id => {
    const r = await fetch(serverApiUrl(`/api/trials/${id}`), { cache: 'no-store' });
    if (!r.ok) return null;
    return ((await r.json()) as { data: Trial }).data;
  }))).filter((t): t is Trial => !!t && t.isActive && t.species.includes(slug.startsWith('feline') ? 'cat' : 'dog') && !['completed', 'removed'].includes(t.enrollmentStatus));
  return <article className="max-w-3xl mx-auto px-4 py-8">
    <aside data-preview-decision className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <strong>{packet.decision === 'BANKED' ? 'BANKED / HOLD: review only' : 'Staged for review, not approved for release'}</strong>
      <p className="mt-1">{packet.rationale}</p>
    </aside>
    <div className="mb-5"><SpeciesList species={[slug.startsWith('feline') ? 'cat' : 'dog']} /></div>
    <CopyBlocks body={packet.body} />
    <section className="mt-10 border-t border-primary/15 pt-6" data-scope="curated-source-records">
      <h2 className="text-xl font-semibold text-primary mb-3">Source records and dated status</h2>
      <p className="text-sm text-muted mb-4">These records were selected by study purpose and institution source. A stored label does not confirm a place is available. The institution controls enrollment.</p>
      <div className="space-y-4">{trials.map(trial => <section key={trial.id} className="rounded-lg bg-surface border border-gray-200 p-5">
        <h3 className="font-semibold leading-snug"><a href={`/trial/${trial.id}`} className="text-secondary underline">{trial.title}</a></h3>
        <p className="text-sm mt-2">{trial.source.name}</p>
        <p className="text-sm mt-2">Recorded status: {trial.enrollmentStatus === 'unknown' ? 'unknown / availability not stated' : trial.enrollmentStatus}. Last seen in records: {trial.lastSeen.slice(0, 10)}.</p>
        {(slug === 'feline-kidney-disease' || trial.id === 303 || trial.id === 304 || trial.id === 157) && <p className="text-sm mt-2 font-medium">Current availability is not confirmed by the source. Ask the study team.</p>}
        <a href={institutionSourceUrl(trial)} className="mt-3 inline-block text-secondary underline text-sm">Read the institution source</a>
      </section>)}</div>
    </section>
    <nav aria-label="Study participation questions" className="flex flex-wrap gap-4 mt-8 text-sm">
      <a className="text-secondary underline" href="/about#trial-costs">Questions about costs</a>
      <a className="text-secondary underline" href="/about#trial-referral">Preparing a referral</a>
      <a className="text-secondary underline" href="/about#trial-status">What trial status means</a>
    </nav>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: packet.body.split('\n')[0].replace(/^# /, ''), description: packet.description, url: absoluteUrl(packet.route), mainEntity: { '@type': 'ItemList', itemListElement: trials.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.title, url: absoluteUrl(`/trial/${t.id}`) })) } }} />
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'VetTrials', item: absoluteUrl('/') }, { '@type': 'ListItem', position: 2, name: packet.title, item: absoluteUrl(packet.route) }] }} />
  </article>;
}
