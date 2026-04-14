import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";



export const metadata: Metadata = {
  title: {
    template: "%s | LUMEN Archive",
    default: "LUMEN | Collective Asset Infrastructure",
  },
  description: "Synchronize your intelligence. LUMEN is an archival digital publishing network for narrative genealogy, network resonance, and the pull economy.",
  keywords: ["archival publishing", "collective assets", "narrative genealogy", "network intelligence", "pull economy", "lumen archive"],
  authors: [{ name: "LUMEN Research" }],
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
    title: "LUMEN Archive",
    description: "The archive for network intelligence and narrative resonance.",
  }
};




export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground selection:bg-black selection:text-white antialiased overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
          <QueryProvider>
            <Navbar user={user} />
            <main className="pt-20 pb-16">
              {children}
            </main>
            <Footer />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>


  );

}
