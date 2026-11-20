import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

type RichParagraphProps = {
  text: string;
  className?: string;
};

/** Plain text za JSON-LD / FAQ schema — skida [label](href) markere. */
export function stripRichLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
}

/**
 * Inline markdown-style interne poveznice: [label](/path)
 * Vanjski http(s) linkovi renderaju se kao <a target=_blank>.
 */
export function RichParagraph({ text, className }: RichParagraphProps) {
  const nodes: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const label = match[1]!;
    const href = match[2]!;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      nodes.push(
        <a
          key={`a-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-accent underline-offset-2 hover:underline"
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(
        <Link
          key={`l-${key++}`}
          href={href}
          className="font-semibold text-accent underline-offset-2 hover:underline"
        >
          {label}
        </Link>,
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));

  return <p className={className}>{nodes.length > 0 ? nodes : text}</p>;
}
