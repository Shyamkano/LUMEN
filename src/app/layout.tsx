import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { QueryProvider } from "@/providers/QueryProvider";



export const metadata: Metadata = {
  title: {
    template: "%s | LUMEN",
    default: "LUMEN | Digital Narrative Platform",
  },
  description: "A premium AI-powered space for radical thinkers to archive their luminous logs and stories.",
  keywords: ["blogging", "AI editor", "digital narrative", "archival", "creative writing"],
  authors: [{ name: "LUMEN Archive" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lumen-archive.vercel.app",
    siteName: "LUMEN",
  },
  verification: {
    google: "GSC_VERIFICATION_PLACEHOLDER_ADD_YOUR_CODE_HERE",
  },
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
      <body className="min-h-screen bg-white text-black selection:bg-black selection:text-white antialiased overflow-x-hidden" suppressHydrationWarning>
        <QueryProvider>
          <Navbar user={user} />
          <main className="pt-20 pb-16">
            {children}
          </main>
          <Footer />
        </QueryProvider>
      </body>
    </html>


  );

}
