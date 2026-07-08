import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import FirebaseInitializer from '@/components/FirebaseInitializer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import InstallPrompt from '@/components/InstallPrompt';
import { PostHogProvider } from '@/components/PostHogProvider';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // cho phép phóng to (accessibility) — không khoá zoom
};

export const metadata: Metadata = {
  // metadataBase: cần thiết để Next resolve URL tuyệt đối cho OG image & canonical
  metadataBase: new URL('https://lingopro.online'),
  title: 'LingoPro — AI English Vocabulary & Grammar',
  description: 'Nền tảng học tiếng Anh thông minh với AI, SRS, và quản lý lớp học cho gia sư & học sinh.',
  keywords: ['học tiếng anh', 'vocabulary', 'spaced repetition', 'grammar', 'edtech', 'AI'],
  alternates: { canonical: '/' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LingoPro',
    startupImage: '/icons/icon-512.webp',
  },
  icons: {
    apple: '/icons/icon-512.webp',
  },
  openGraph: {
    title: 'LingoPro',
    description: 'Nền tảng học tiếng Anh thông minh với AI, SRS, và quản lý lớp học cho gia sư & học sinh.',
    type: 'website',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Không auto-register sw-custom ở scope / — xung đột FCM SW, gây getToken fail */}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <PostHogProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseInitializer />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          {/* Nút Test Firebase — CHỈ hiện ở môi trường dev, không lộ cho user production */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="fixed bottom-20 right-4 z-[9999] md:bottom-10">
              <a
                href="/test-fcm"
                className="bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs transition-all"
              >
                🔔 Test Firebase
              </a>
            </div>
          )}
          <InstallPrompt />
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
