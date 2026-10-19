import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nProvider } from "@/context/I18nContext";

export function renderWithI18n(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}
