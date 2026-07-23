import './globals.css';
import type { Metadata } from 'next';
import { StoreProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Strategic Performance — Tanoto Foundation',
  description: 'Balanced Scorecard performance management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
