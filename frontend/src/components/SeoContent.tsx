import { Fragment } from 'react';

function localHref(href: string) {
  if (href.startsWith('https://vettrials.org')) {
    const url = new URL(href);
    return url.pathname + url.search + url.hash;
  }
  return href;
}

export function InlineCopy({ text }: { text: string }) {
  const pattern = /(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  return text.split(pattern).filter(Boolean).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) return <a key={i} href={localHref(link[2])} className="text-secondary underline decoration-secondary/40 underline-offset-2 hover:decoration-secondary [overflow-wrap:anywhere]">{localHref(link[2]) === '/alerts' ? 'check alert availability' : link[1]}</a>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function CopyBlocks({ body, omitH1 = false }: { body: string; omitH1?: boolean }) {
  return <div className="seo-copy space-y-5 text-base leading-relaxed [overflow-wrap:anywhere]">{body.split(/\n\s*\n/).map((block, i) => {
    if (block === '## Get alerts for new trials') return <h2 key={i} className="text-2xl font-semibold leading-snug pt-4 text-primary">Check alert availability</h2>;
    if (block.startsWith('New studies open and close throughout the year.')) return <p key={i}>Email alerts are currently paused. <a href="/alerts" className="text-secondary underline">Check the alerts page</a> for availability, or <a href="/" className="text-secondary underline">search all trials</a> by condition, species or location.</p>;
    const heading = block.match(/^(#{1,3}) (.+)$/);
    if (heading) {
      if (heading[1].length === 1) return omitH1 ? null : <h1 key={i} className="text-3xl font-bold tracking-tight leading-tight text-text"><InlineCopy text={heading[2]} /></h1>;
      if (heading[1].length === 2) return <h2 key={i} className="text-2xl font-semibold leading-snug pt-4 text-primary"><InlineCopy text={heading[2]} /></h2>;
      return <h3 key={i} className="text-xl font-semibold leading-snug pt-2"><InlineCopy text={heading[2]} /></h3>;
    }
    if (block.split('\n').every(line => line.startsWith('- '))) return <ul key={i} className="list-disc pl-6 space-y-2">{block.split('\n').map((line, n) => <li key={n}><InlineCopy text={line.slice(2)} /></li>)}</ul>;
    return <p key={i}><InlineCopy text={block.replace(/\n/g, ' ')} /></p>;
  })}</div>;
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
