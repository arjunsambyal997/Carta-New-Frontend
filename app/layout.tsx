import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { FeedbackProvider } from "@/components/Feedback";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "EquiGCC",
  description: "Digital share register and cap table for the GCC",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", display: "swap" });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${arabic.variable}`} suppressHydrationWarning>
      <head>
        <script
          // Applies the saved (or OS) theme before first paint so there is no flash.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("equigcc.theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body>
        <I18nProvider>
          <FeedbackProvider>
            <Shell>{children}</Shell>
          </FeedbackProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
