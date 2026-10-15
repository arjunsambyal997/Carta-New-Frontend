import type { Metadata } from "next";
import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "EquiGCC",
  description: "Digital share register and cap table for the GCC",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <I18nProvider>
          <Shell>{children}</Shell>
        </I18nProvider>
      </body>
    </html>
  );
}
