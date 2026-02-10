import type { ReactNode } from 'react';
import 'leaflet/dist/leaflet.css';
import 'uplot/dist/uPlot.min.css';
import './globals.css';
import { ensureDatabaseConnection } from '@/db/schema/init';
import { AuthProvider } from '@/components/ui/AuthProvider';
import { HeaderAuthControl } from '@/components/ui/HeaderAuthControl';
import Link from 'next/link';

ensureDatabaseConnection();

export const metadata = {
  title: 'FIT AI Analyzer',
  description: 'Analyze running FIT files with deterministic and AI-backed insights.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <header
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 24px',
                borderBottom: '1px solid #e5e5e5',
                position: 'sticky',
                top: 0,
                background: '#fff',
                zIndex: 20
              }}
            >
                <Link href="/" style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
                FIT AI Analyzer
                </Link>
              <HeaderAuthControl />
            </header>
            <main
              style={{
                flex: 1,
                padding: '24px'
              }}
            >
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
