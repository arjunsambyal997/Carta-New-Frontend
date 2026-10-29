import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import type { ReactNode } from "react";
import { I18nProvider } from "@/context/I18nContext";
import { FeedbackProvider } from "@/components/common/Feedback";
import { Shell } from "@/components/layout/Shell";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "@/designSystem/globals.css";

export const metadata: Metadata = {
  title: { default: "Sijill", template: "%s · Sijill" },
  description: "Sijill is the digital share register and cap table for GCC companies.",
  applicationName: "Sijill",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1016" },
  ],
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
          <MotionProvider>
            <FeedbackProvider>
              <Shell>{children}</Shell>
            </FeedbackProvider>
          </MotionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
