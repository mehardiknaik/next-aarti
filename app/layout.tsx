import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "आरती संग्रह | Aarti Sangrah",
  description: "मराठी व हिन्दी आरत्या, स्तोत्र व इंग्रजी उच्चार संग्रह",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mr" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700;800&family=Yatra+One&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const t = localStorage.getItem('app_theme') || 'system'; const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.classList.toggle('dark', dark); document.documentElement.dataset.fontSize = localStorage.getItem('app_font_size') || 'large'; } catch {} })()`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F2F2F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F2F2F7] antialiased">
        <div className="ios-mesh-bg" aria-hidden="true">
          <div className="ios-mesh-glow-1" />
          <div className="ios-mesh-glow-2" />
        </div>
        <div className="relative z-10 min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
