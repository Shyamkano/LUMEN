import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { QueryProvider } from "@/providers/QueryProvider";



export const metadata: Metadata = {
  title: "LUMEN | Digital Narrative Platform",
  description: "A premium AI-powered space for radical thinkers to archive their luminous logs and stories.",
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
