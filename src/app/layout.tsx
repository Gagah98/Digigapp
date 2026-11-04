import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { count, isNull } from "drizzle-orm";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/capture/command-palette";
import { OptionsProvider } from "@/components/options-provider";
import { getOptions } from "@/db/queries";
import { db } from "@/db";
import { inboxItems } from "@/db/schema";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DiGiga App",
  description: "Mon second cerveau : projets, tâches, notes, CRM et objectifs (méthode PARA).",
};

export const viewport: Viewport = { themeColor: "#0a0a0a" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [options, [inbox]] = await Promise.all([
    getOptions(),
    db.select({ n: count() }).from(inboxItems).where(isNull(inboxItems.processedAt)),
  ]);

  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <OptionsProvider value={options}>
          <div className="flex min-h-dvh flex-col md:flex-row">
            <Sidebar inboxCount={inbox.n} />
            <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-10 md:py-10">{children}</main>
          </div>
          <CommandPalette />
        </OptionsProvider>
      </body>
    </html>
  );
}
