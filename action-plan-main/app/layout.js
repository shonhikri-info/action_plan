import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "תכנית פעולה 90 יום - יזם 2.0",
  description: "תכנית פעולה מובנית ל-90 יום להצלחה יזמית - בנה את העסק שלך צעד אחר צעד",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "תכנית פעולה 90 יום - יזם 2.0",
    description: "תכנית פעולה מובנית ל-90 יום להצלחה יזמית - בנה את העסק שלך צעד אחר צעד",
    url: "https://action-plan.shonhikri.co.il",
    siteName: "יזם 2.0",
    locale: "he_IL",
    type: "website",
    images: [
      {
        url: 'https://action-plan.shonhikri.co.il/og-image.png',
        width: 1200,
        height: 630,
        alt: 'תכנית פעולה 90 יום - יזם 2.0',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "תכנית פעולה 90 יום - יזם 2.0",
    description: "תכנית פעולה מובנית ל-90 יום להצלחה יזמית",
    images: ['https://action-plan.shonhikri.co.il/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}