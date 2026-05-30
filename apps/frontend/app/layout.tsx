import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASN Expo AI CRM',
  description: 'AI Sales Agent & CRM System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}