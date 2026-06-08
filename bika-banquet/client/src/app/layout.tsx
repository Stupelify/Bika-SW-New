import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import './mobile.css';
import { Toaster } from 'sonner';
import IonicProvider from '@/components/IonicProvider';
import CapacitorNativeShell from '@/components/CapacitorNativeShell';
import AuthBootstrap from '@/components/AuthBootstrap';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#0d9488',
};

export const metadata: Metadata = {
  title: 'Bika Banquet - Management System',
  description: 'Complete banquet operations platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bika Banquet',
  },
  icons: {
    icon: 'https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/1-2-removebg-scaled-e1752152009924-7iV2qZXAcVUCou9o.png',
    shortcut:
      'https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/1-2-removebg-scaled-e1752152009924-7iV2qZXAcVUCou9o.png',
    apple:
      'https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/1-2-removebg-scaled-e1752152009924-7iV2qZXAcVUCou9o.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${interTight.variable} ${jetBrainsMono.variable}`}>
        <CapacitorNativeShell />
        <AuthBootstrap />
        <IonicProvider>{children}</IonicProvider>
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
