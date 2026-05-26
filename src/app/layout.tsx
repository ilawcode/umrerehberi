import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from './theme-provider';
import Navigation from './navigation';

export const metadata: Metadata = {
  title: 'Umre Rehberi - Mobil İbadet ve Dua Yardımcınız',
  description: 'Umre ibadetinizi adım adım takip edebileceğiniz, ihram yasaklarını, tavaf ve sa\'y sayaçlarını, gerekli duaları ve meallerini barındıran mobil uyumlu kişisel rehberiniz.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        {/* Anti-flash script for localstorage theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('theme');
                if (savedTheme) {
                  document.documentElement.setAttribute('data-theme', savedTheme);
                } else {
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                }
              } catch (e) {}
            `,
          }}
        />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <Navigation>{children}</Navigation>
        </ThemeProvider>
      </body>
    </html>
  );
}
