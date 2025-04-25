import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Nav from './ui/nav';
import NavBorder from './ui/nav-border';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Textrix / Home',
  description: 'A powerful, customizable Medium-style publishing editor.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <Nav />
        <NavBorder />
        {children}
      </body>
    </html>
  );
}
