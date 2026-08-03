import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { getValidLocale } from '@/i18n/messages';
import { getRootMetadata, getStructuredData } from '@/i18n/metadata';
import { CookieBanner } from '@/components/hotel/CookieBanner';
import AnalyticsScripts from '@/components/hotel/AnalyticsScripts';
import ChatLauncher from '@/components/hotel/ChatLauncher';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getRootMetadata(locale);
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getValidLocale(await getLocale());
  const messages = await getMessages();
  const structuredData = await getStructuredData(locale);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieBanner />
          <AnalyticsScripts />
          <ChatLauncher />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
