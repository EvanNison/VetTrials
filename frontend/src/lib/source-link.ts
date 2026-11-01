const canonicalSources: Record<number, string> = {
  145: 'https://research.vetmed.ufl.edu/research-programs/clinical-trials/small-animal/vaccine-study-for-dogs-with-osteosarcoma/',
  146: 'https://research.vetmed.ufl.edu/research-programs/clinical-trials/small-animal/mrna-vaccine-study-for-dogs-with-appendicular-osteosarcoma-currently-enrolling/',
  147: 'https://research.vetmed.ufl.edu/research-programs/clinical-trials/small-animal/oncology/vaccine-study-for-dogs-with-hemangiosarcoma/',
};

// Display-only source resolution in this private snapshot. No database edits.
export function institutionSourceUrl(trial: { id: number; sourceUrl: string | null; source: { url?: string } }): string | undefined {
  if (canonicalSources[trial.id]) return canonicalSources[trial.id];
  const source = trial.sourceUrl?.trim();
  if (source && /^https?:\/\//.test(source)) return source;
  if (source?.startsWith('/') && trial.source.url) return new URL(source, trial.source.url).href;
  return trial.source.url;
}
