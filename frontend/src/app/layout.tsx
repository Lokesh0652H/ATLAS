import type { Metadata } from "next";
import "@/styles/globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { TopNav } from "@/components/navigation/TopNav";

export const metadata: Metadata = {
  title: "Atlas — AI Research & Knowledge Engine",
  description: "Evidence-grounded, verifiable AI research platform with complete source transparency.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-canvas text-ink-primary antialiased selection:bg-champagne/20">
        <AuthProvider>
          <TopNav />
          <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
