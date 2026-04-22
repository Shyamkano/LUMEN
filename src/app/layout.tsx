import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";



export const metadata: Metadata = {
  title: {
    template: "%s | LUMEN",
    default: "LUMEN | Collective Asset Infrastructure",
  },
  description: "Synchronize your intelligence. LUMEN is an archival digital publishing network for stories, posts, and community growth.",
  applicationName: 'LUMEN',
  appleWebApp: {
    title: 'LUMEN',
    statusBarStyle: 'default',
  },
  keywords: ["LUMEN", "lumen stories", "collective assets", "narrative genealogy", "network intelligence", "lumen archive"],
  authors: [{ name: "LUMEN" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lumen-archive.vercel.app",
    siteName: "LUMEN",
    title: "LUMEN | Collective Asset Infrastructure",
    description: "Build perpetual digital assets within a community of high-fidelity thinkers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LUMEN",
    description: "The community network for intelligence and stories.",
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  }
};




import { OnbordaProvider } from '@/components/OnbordaProvider';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "LUMEN",
              "url": "https://lumen-archive.vercel.app/",
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground selection:bg-black selection:text-white antialiased overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} enableColorScheme={false} storageKey="lumen-theme-v2">
          <QueryProvider>
            <OnbordaProvider>
              <Navbar user={user} />
              <main className="pt-20 pb-16">
                {children}
              </main>
              <Footer />
            </OnbordaProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>


  );

}
