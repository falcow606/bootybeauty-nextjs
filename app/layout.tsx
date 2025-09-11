// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css'; // garde cette ligne si tu as un globals.css

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bootybeauty-nextjs.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BootyBeauty – Bons plans beauté',
    template: '%s – BootyBeauty',
  },
  description:
    'Sélection de bons plans beauté : meilleurs prix, liens affiliés vérifiés et disponibilités à jour.',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'BootyBeauty',
    title: 'BootyBeauty – Bons plans beauté',
    description:
      'Sélection de bons plans beauté : meilleurs prix, liens affiliés vérifiés et disponibilités à jour.',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BootyBeauty – Bons plans beauté',
    description:
      'Sélection de bons plans beauté : meilleurs prix, liens affiliés vérifiés et disponibilités à jour.',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
