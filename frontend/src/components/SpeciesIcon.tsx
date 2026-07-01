const SPECIES_ICONS: Record<string, string> = {
  dog: "\uD83D\uDC15",
  cat: "\uD83D\uDC08",
  horse: "\uD83D\uDC0E",
  avian: "\uD83E\uDD9C",
  exotic: "\uD83E\uDD8E",
  cattle: "\uD83D\uDC02",
  swine: "\uD83D\uDC16",
  goat: "\uD83D\uDC10",
  sheep: "\uD83D\uDC11",
  rabbit: "\uD83D\uDC07",
  other: "\uD83D\uDC3E",
};

export function SpeciesIcon({ species }: { species: string }) {
  return <span title={species}>{SPECIES_ICONS[species] || SPECIES_ICONS.other}</span>;
}

export function SpeciesList({ species }: { species: string[] }) {
  if (!species.length) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {species.map((s) => (
        <span key={s} className="inline-flex items-center gap-0.5 text-sm">
          <SpeciesIcon species={s} />
          <span className="capitalize">{s}</span>
        </span>
      ))}
    </span>
  );
}
