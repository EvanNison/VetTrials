import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import resourceData from '@/content/resources.json';
import { CopyBlocks, JsonLd } from '@/components/SeoContent';
import { publicAbsoluteUrl } from '@/lib/site';

type ResourceImage = { src: string; alt: string; width: number; height: number; credit: string; creditUrl: string; position?: string };
type ResourceCta = { heading: string; text: string; primaryLabel: string; primaryHref: string; secondaryLabel?: string; secondaryHref?: string };
type Resource = {
  slug: string; title: string; heading: string; description: string; canonical: string; body: string;
  updated?: string; byline?: string; image?: ResourceImage; cta?: ResourceCta;
};
const resources = resourceData as Resource[];

function localHref(href: string) {
  return href.startsWith('https://vettrials.org') ? href.replace('https://vettrials.org', '') || '/' : href;
}
function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return resources.map(r => ({ slug: r.slug })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = resources.find(r => r.slug === slug);
  if (!resource) notFound();
  const canonical = publicAbsoluteUrl(resource.canonical);
  const socialImage = resource.image ? { url: publicAbsoluteUrl(resource.image.src), width: resource.image.width, height: resource.image.height, alt: resource.image.alt } : undefined;
  return {
    title: { absolute: resource.title }, description: resource.description,
    alternates: { canonical }, robots: { index: false, follow: false, noarchive: true },
    openGraph: { type: 'article', title: resource.title, description: resource.description, url: canonical, siteName: 'VetTrials', ...(socialImage ? { images: [socialImage] } : {}) },
    twitter: { card: socialImage ? 'summary_large_image' : 'summary', title: resource.title, description: resource.description, ...(socialImage ? { images: [socialImage] } : {}) },
  };
}
export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;
  const resource = resources.find(r => r.slug === slug);
  if (!resource) notFound();
  const { image, cta } = resource;
  const canonical = publicAbsoluteUrl(resource.canonical);
  return <div className="resource-page max-w-3xl mx-auto px-4 py-10">
    <nav aria-label="Breadcrumb" className="resource-breadcrumb mb-6 text-sm text-secondary"><a className="underline" href="/">VetTrials</a><span aria-hidden="true"> / </span><span className="text-muted">Guides</span></nav>
    <h1 className="text-3xl font-bold leading-tight tracking-tight mb-3">{resource.heading}</h1>
    {(resource.byline || resource.updated) && <p className="resource-meta text-sm text-muted mb-6">
      {resource.byline}{resource.byline && resource.updated && <span aria-hidden="true"> · </span>}{resource.updated && <>Updated <time dateTime={resource.updated}>{formatDate(resource.updated)}</time></>}
    </p>}
    {image && <figure className="resource-image mb-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.alt} width={image.width} height={image.height} className="w-full h-auto max-h-[420px] object-cover rounded-lg border border-gray-200" style={image.position ? { objectPosition: image.position } : undefined} />
      <figcaption className="mt-2 text-xs text-muted"><a className="underline" href={image.creditUrl} rel="noopener">{image.credit}</a></figcaption>
    </figure>}
    <article data-scope="supplied-resource-public-copy"><CopyBlocks body={resource.body} omitH1 /></article>
    {cta && <aside aria-labelledby="resource-cta-heading" className="resource-cta mt-10 rounded-lg border border-primary/20 bg-primary/5 p-6">
      <h2 id="resource-cta-heading" className="text-xl font-semibold text-primary leading-snug">{cta.heading}</h2>
      <p className="mt-2 text-base leading-relaxed">{cta.text}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={localHref(cta.primaryHref)} className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-light transition-colors">{cta.primaryLabel}</a>
        {cta.secondaryHref && cta.secondaryLabel && <a href={localHref(cta.secondaryHref)} className="inline-flex items-center px-4 py-2 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/10 transition-colors">{cta.secondaryLabel}</a>}
      </div>
    </aside>}
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', '@id': canonical, url: canonical, name: resource.title, description: resource.description, inLanguage: 'en', ...(resource.updated ? { dateModified: resource.updated } : {}), ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: publicAbsoluteUrl(image.src), caption: image.alt } } : {}), isPartOf: { '@type': 'WebSite', name: 'VetTrials', url: publicAbsoluteUrl('/') }, citation: [...new Set([...resource.body.matchAll(/\]\((https:\/\/(?!vettrials.org)[^)]+)\)/g)].map(m => m[1]))] }} />
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'VetTrials', item: publicAbsoluteUrl('/') }, { '@type': 'ListItem', position: 2, name: resource.heading, item: canonical }] }} />
  </div>;
}
