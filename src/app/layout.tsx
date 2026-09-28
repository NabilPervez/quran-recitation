import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Ayah Echo',
  description: 'Memorise the Quran ayah by ayah through repetition',
  appleWebApp: { capable: true, title: 'Ayah Echo', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#fafaf8',
};

// Applies the saved theme before first paint to avoid a flash.
const themeScript = `try{var t=JSON.parse(localStorage.getItem('ae:prefs')||'{}').theme;if(t&&t!=='light')document.documentElement.classList.add(t)}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://api.alquran.cloud" />
        <link rel="preconnect" href="https://cdn.islamic.network" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
