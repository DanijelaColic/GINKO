type BedType = 'double' | 'single' | 'sofa';

type ParsedBed = {
  type: BedType;
  count: number;
  roomLabel?: string;
  bedLabel: string;
};

// Booking.com stil — crne siluete, bočni pogled (krevet) / frontalni (kauč)

function DoubleBedIcon({ size = 22 }: { size?: number }) {
  const h = Math.round(size * 0.73);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 22 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0" y="2" width="2" height="10" />
      <rect x="2" y="6" width="20" height="5" />
      <rect x="3.5" y="7" width="7" height="3" />
      <rect x="11.5" y="7" width="7" height="3" />
      <rect x="3.5" y="11" width="1.2" height="3" />
      <rect x="18.5" y="11" width="1.2" height="3" />
    </svg>
  );
}

function SingleBedIcon({ size = 16 }: { size?: number }) {
  const h = Math.round(size * 0.88);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 16 14"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0" y="2" width="2" height="9" />
      <rect x="2" y="5" width="14" height="4.5" />
      <rect x="3.5" y="6" width="5.5" height="2.5" />
      <rect x="3.5" y="9.5" width="1.2" height="3" />
      <rect x="12.5" y="9.5" width="1.2" height="3" />
    </svg>
  );
}

function SofaBedIcon({ size = 24 }: { size?: number }) {
  const h = Math.round(size * 0.5);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 24 12"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1.5" y="0" width="21" height="3.5" rx="0.5" />
      <rect x="1.5" y="3.5" width="21" height="4.5" />
      <rect x="0" y="2" width="2.5" height="6" rx="0.5" />
      <rect x="21.5" y="2" width="2.5" height="6" rx="0.5" />
      <rect x="3" y="8" width="1.2" height="3" />
      <rect x="11" y="8" width="1.2" height="3" />
      <rect x="19" y="8" width="1.2" height="3" />
    </svg>
  );
}

function BedIcon({ type, size }: { type: BedType; size: number }) {
  if (type === 'single') return <SingleBedIcon size={size} />;
  if (type === 'sofa') return <SofaBedIcon size={size} />;
  return <DoubleBedIcon size={size} />;
}

function detectBedType(text: string): BedType {
  const lower = text.toLowerCase();

  if (
    lower.includes('jednokrevetni') ||
    lower.includes('single') ||
    lower.includes('einzelbett') ||
    lower.includes('twin')
  ) {
    return 'single';
  }

  if (
    lower.includes('rasklapanje') ||
    lower.includes('kauč') ||
    lower.includes('sofa') ||
    lower.includes('schlafsofa') ||
    lower.includes('futon') ||
    lower.includes('pull-out') ||
    lower.includes('pull out')
  ) {
    return 'sofa';
  }

  return 'double';
}

function parseBeds(beds: string): ParsedBed[] {
  const segments = beds
    .split(/\n|[|;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return segments.map((segment) => {
    const colonIdx = segment.indexOf(':');
    let roomLabel: string | undefined;
    let bedPart: string;

    if (colonIdx > -1) {
      roomLabel = segment.slice(0, colonIdx).trim();
      bedPart = segment.slice(colonIdx + 1).trim();
    } else {
      bedPart = segment;
    }

    const countMatch = bedPart.match(/\d+/);
    const count = countMatch ? parseInt(countMatch[0], 10) : 1;

    return {
      type: detectBedType(bedPart),
      count,
      roomLabel,
      bedLabel: bedPart,
    };
  });
}

type Props = {
  beds: string;
  iconSize?: number;
};

export default function BedTypeIcons({ beds, iconSize = 22 }: Props) {
  const parsed = parseBeds(beds);

  return (
    <div className="flex flex-col gap-1.5">
      {parsed.map(({ type, count, roomLabel, bedLabel }, i) => {
        const icons = Array.from({ length: Math.min(count, 3) });

        return (
          <div key={i} className="flex items-center gap-2 text-sm text-text leading-snug">
            <span className="min-w-0">
              {roomLabel && (
                <span className="font-semibold text-text">{roomLabel}: </span>
              )}
              <span className="text-muted">{bedLabel}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-0.5 text-text">
              {icons.map((_, j) => (
                <BedIcon key={j} type={type} size={iconSize} />
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
