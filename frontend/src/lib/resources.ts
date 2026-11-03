import resourceData from '@/content/resources.json';
import releaseState from '@/content/resource-releases.json';
import siblingLinks from '@/content/resource-sibling-links.json';

export const resourcePreview = process.env.VETTRIALS_RESOURCE_PREVIEW === '1';
const publishedSlugs: readonly string[] = releaseState.publishedSlugs;
const verifiedLiveSiblingSlugs: readonly string[] = releaseState.verifiedLiveSiblingSlugs;

// A release adds only the guide that is due. A sibling enters the second list
// only after the intended public page has been checked following deployment.
export const publishedResources = resourceData.filter(resource =>
  publishedSlugs.includes(resource.slug),
);
export const visibleResources = resourcePreview ? resourceData : publishedResources;

export function withLiveSiblingLinks(slug: string, body: string): string {
  return siblingLinks.filter(link => link.sourceSlug === slug).reduce((copy, link) => {
    const targetSlug = link.target.split('/').pop()!;
    if (!verifiedLiveSiblingSlugs.includes(targetSlug) ||
        !publishedSlugs.includes(targetSlug)) return copy;
    // Restore only the exact approved words, without touching existing links.
    return copy.split(/(\[[^\]]+\]\([^\s)]+\))/g)
      .map(part => part.startsWith('[') ? part : part.replace(link.text, link.originalMarkdown))
      .join('');
  }, body);
}
