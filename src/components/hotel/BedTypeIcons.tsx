type BedType = 'double' | 'single' | 'sofa';

type ParsedBed = {
  type: BedType;
  count: number;
  roomLabel?: string;
  bedLabel: string;
};

/**
 * Booking.com bed icons — front view (foot → headboard).
 * Mattress solid; pillows/headboard outlined (no fill).
 */

function DoubleBedIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.78)}
      viewBox="0 0 28 22"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* headboard — outline */}
      <rect
        x="1.5"
        y="1.5"
        width="25"
        height="3.2"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* pillows — outline, no fill */}
      <rect
        x="3"
        y="3.8"
        width="10"
        height="4.6"
        rx="1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="15"
        y="3.8"
        width="10"
        height="4.6"
        rx="1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* mattress — solid */}
      <rect x="1.5" y="8.2" width="25" height="10" rx="1.6" fill="currentColor" />
      {/* legs */}
      <rect x="3.5" y="18.2" width="2" height="3.2" rx="0.4" fill="currentColor" />
      <rect x="22.5" y="18.2" width="2" height="3.2" rx="0.4" fill="currentColor" />
    </svg>
  );
}

function SingleBedIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.35)}
      viewBox="0 0 15 22"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="1.2"
        y="1.5"
        width="12.6"
        height="3.2"
        rx="0.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="2.6"
        y="3.8"
        width="9.8"
        height="4.6"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="1.2" y="8.2" width="12.6" height="10" rx="1.4" fill="currentColor" />
      <rect x="2.6" y="18.2" width="1.8" height="3.2" rx="0.35" fill="currentColor" />
      <rect x="10.6" y="18.2" width="1.8" height="3.2" rx="0.35" fill="currentColor" />
    </svg>
  );
}

function SofaBedIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.55)}
      viewBox="0 0 30 16.5"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="5" y="1" width="20" height="4" rx="1.1" />
      <rect x="5.3" y="4.8" width="9" height="5.2" rx="1.1" />
      <rect x="15.7" y="4.8" width="9" height="5.2" rx="1.1" />
      <rect x="1.2" y="3" width="4" height="7.4" rx="1.1" />
      <rect x="24.8" y="3" width="4" height="7.4" rx="1.1" />
      <rect x="1.2" y="10" width="27.6" height="2.5" rx="0.7" />
      <rect x="3.2" y="12.5" width="1.5" height="2.8" rx="0.3" />
      <rect x="14.25" y="12.5" width="1.5" height="2.8" rx="0.3" />
      <rect x="25.3" y="12.5" width="1.5" height="2.8" rx="0.3" />
    </svg>
  );
}

function BedIcon({ type, size }: { type: BedType; size: number }) {
  if (type === 'single') return <SingleBedIcon size={Math.round(size * 0.55)} />;
  if (type === 'sofa') return <SofaBedIcon size={size} />;
  return <DoubleBedIcon size={size} />;
}

function detectBedType(text: string): BedType {
  const lower = text.toLowerCase();

  if (
    lower.includes('jednokrevetni') ||
    lower.includes('single') ||
    lower.includes('einzelbett') ||
    lower.includes('twin') ||
    lower.includes('pomoćni') ||
    lower.includes('pomocni') ||
    lower.includes('extra bed') ||
    lower.includes('zustellbett') ||
    lower.includes('za 1 osobu') ||
    lower.includes('za jednu osobu') ||
    lower.includes('1 osobu')
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

export default function BedTypeIcons({ beds, iconSize = 26 }: Props) {
  const parsed = parseBeds(beds);

  return (
    <div className="flex flex-col gap-1.5 text-text">
      {parsed.map(({ type, count, roomLabel, bedLabel }, i) => {
        const icons = Array.from({ length: Math.min(count, 3) });

        return (
          <div
            key={i}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-snug"
          >
            {roomLabel && (
              <span className="font-semibold text-text">{roomLabel}:</span>
            )}
            <span className="text-text">{bedLabel}</span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[#262626]">
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
