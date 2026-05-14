import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import FirebaseInitializer from '@/components/FirebaseInitializer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'LingoPro — AI English Vocabulary & Grammar',
  description: 'Nền tảng học tiếng Anh thông minh với AI, SRS, và quản lý lớp học cho gia sư & học sinh.',
  keywords: ['học tiếng anh', 'vocabulary', 'spaced repetition', 'grammar', 'edtech', 'AI'],
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
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
    description: 'Học từ vựng & ngữ pháp tiếng Anh với AI',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseInitializer />
          {children}
          {/* Nút Test Firebase nổi trên màn hình cho Admin (là bạn) */}
          <div className="fixed bottom-20 right-4 z-[9999] md:bottom-10">
            <a 
              href="/test-fcm" 
              className="bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs transition-all animate-bounce"
            >
              🔔 Test Firebase
            </a>
          </div>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
