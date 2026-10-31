import type { Metadata, Viewport } from 'next';
import { Creepster, Nunito } from 'next/font/google';
import './globals.css';

const display = Creepster({
  variable: '--font-display',
  weight: '400',
  subsets: ['latin'],
});

const body = Nunito({
  variable: '--font-body',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Halloween Kostýmy | Hlasovanie',
  description: 'Hlasuj za najlepší halloweenský kostým na párty — solo aj dvojice.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ff7a1a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
