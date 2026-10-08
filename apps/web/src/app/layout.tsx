import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CovidDataViz',
  description: 'Tableau de bord mondial des données Covid-19 (JHU CSSE)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
