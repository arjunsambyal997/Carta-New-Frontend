"use client";

import "@/designSystem/globals.css";

/**
 * Shown when the root layout itself crashes (translations, toasts or the sidebar), which app/error.tsx cannot catch.
 * It replaces the whole document and the I18n provider may be the thing that failed, so the text is in both languages.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <main
          role="alert"
          className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <h1>Sijill could not start</h1>
          <p className="text-sm text-slate-600">
            Something went wrong while loading the app. Your data is safe. Try again, or reload the page.
          </p>
          <div dir="rtl" lang="ar" className="space-y-1">
            <p className="font-semibold">تعذّر تشغيل سجل</p>
            <p className="text-sm text-slate-600">
              حدث خطأ أثناء تحميل التطبيق. بياناتك بأمان. حاول مرة أخرى أو أعد تحميل الصفحة.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={reset}>
              Try again · حاول مرة أخرى
            </button>
            <button type="button" className="btn-ghost" onClick={() => window.location.reload()}>
              Reload · إعادة التحميل
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
