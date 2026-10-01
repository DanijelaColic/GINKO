'use client';

import type { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import {
  AVAILABILITY_SECTION_HREF,
  AVAILABILITY_SECTION_ID,
} from '@/modules/booking/booking.config';
import { scrollToSectionId } from '@/lib/scroll-to-section';

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * CTA na sekciju raspoloživosti: na početnoj smooth scroll, s drugih stranica → /#raspolozivost.
 */
export default function AvailabilityCtaLink({ children, className }: Props) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  if (isHome) {
    return (
      <button
        type="button"
        onClick={() => scrollToSectionId(AVAILABILITY_SECTION_ID)}
        className={className}
      >
        {children}
      </button>
    );
  }

  return (
    <Link href={AVAILABILITY_SECTION_HREF} className={className}>
      {children}
    </Link>
  );
}
