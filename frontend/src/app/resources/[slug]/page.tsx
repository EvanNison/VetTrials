import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import resources from '@/content/resources.json';
import { CopyBlocks, JsonLd } from '@/components/SeoContent';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return resources.map(r => ({ slug: r.slug })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = resources.find(r => r.slug === slug);
  if (!resource) notFound();
  return {
    title: { absolute: resource.title }, description: resource.description,
    alternates: { canonical: resource.canonical }, robots: { index: false, follow: false, noarchive: true },
    openGraph: { type: 'website', title: resource.title, description: resource.description, url: resource.canonical, siteName: 'VetTrials' },
    twitter: { card: 'summary', title: resource.title, description: resource.description },
  };
}
export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;
  const resource = resources.find(r => r.slug === slug);
  if (!resource) notFound();
  return <div className="resource-page max-w-3xl mx-auto px-4 py-10">
    <nav aria-label="Breadcrumb" className="resource-breadcrumb mb-6 text-sm text-secondary"><a className="underline" href="/">VetTrials</a><span aria-hidden="true"> / </span><a className="underline" href="/about">About VetTrials</a></nav>
    <h1 className="text-3xl font-bold leading-tight tracking-tight mb-6">{resource.heading}</h1>
    <article data-scope="supplied-resource-public-copy"><CopyBlocks body={resource.body} omitH1 /></article>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', '@id': resource.canonical, url: resource.canonical, name: resource.title, description: resource.description, inLanguage: 'en', isPartOf: { '@type': 'WebSite', name: 'VetTrials', url: 'https://vettrials.org/' }, citation: [...new Set([...resource.body.matchAll(/\]\((https:\/\/(?!vettrials.org)[^)]+)\)/g)].map(m => m[1]))] }} />
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'VetTrials', item: 'https://vettrials.org/' }, { '@type': 'ListItem', position: 2, name: resource.heading, item: resource.canonical }] }} />
  </div>;
}
