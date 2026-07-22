import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PostHogProvider } from '@/components/PostHogProvider';
import { ClientBoot } from '@/components/ClientBoot';
import { DevFcmButton } from '@/components/DevFcmButton';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // cho phép phóng to (accessibility) — không khoá zoom
  viewportFit: 'cover', // bật env(safe-area-inset-*) trên iOS notch + Android cutout
  userScalable: true,
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
    // ?v= bust cache immutable 1 năm trên /icons/*
    startupImage: '/icons/icon-512.webp?v=parrot1',
  },
  icons: {
    // Ưu tiên public/favicon.ico + PNG (không phụ thuộc hash Next cũ)
    icon: [
      { url: '/favicon.ico?v=parrot1', sizes: 'any' },
      { url: '/icon-512.png?v=parrot1', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico?v=parrot1',
    apple: [
      { url: '/apple-touch-icon.png?v=parrot1', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-512.webp?v=parrot1', sizes: '512x512', type: 'image/webp' },
    ],
  },
  openGraph: {
    title: 'LingoPro',
    description: 'Nền tảng học tiếng Anh thông minh với AI, SRS, và quản lý lớp học cho gia sư & học sinh.',
    type: 'website',
    images: ['/opengraph-image'],
  },
};

const supabaseOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Không auto-register sw-custom ở scope / — xung đột FCM SW, gây getToken fail */}
        {/* Capture beforeinstallprompt sớm — event chỉ bắn 1 lần, trước khi InstallPrompt (dynamic) mount */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{window.__lingoproBip=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__lingoproBip=e;});}catch(_){}})();`,
          }}
        />
        {/* Preconnect Supabase — giảm RTT auth + REST (next/font tự host, không cần fonts.gstatic) */}
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
        <link rel="dns-prefetch" href="https://fcm.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.gstatic.com" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <PostHogProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ClientBoot />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          {/* Nút Test Firebase — CHỈ hiện ở môi trường dev trên /test-fcm hoặc ?debugFcm=1 */}
          {process.env.NODE_ENV !== 'production' && <DevFcmButton />}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
