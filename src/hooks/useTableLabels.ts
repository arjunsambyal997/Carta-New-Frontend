import { useEffect } from "react";

/** Copies each column header onto its cells as data-label, so the stacked-card layout on phones can show "Column: value". */
function label(root: ParentNode) {
  root.querySelectorAll<HTMLTableElement>('table[class*="min-w-"]').forEach((table) => {
    const heads = Array.from(table.querySelectorAll("thead tr:last-child th"), (th) => th.textContent?.trim() ?? "");
    table.querySelectorAll("tbody tr").forEach((tr) => {
      Array.from(tr.children).forEach((td, i) => {
        if (td.hasAttribute("colspan") || !heads[i]) return;
        if (td.getAttribute("data-label") !== heads[i]) td.setAttribute("data-label", heads[i]);
      });
    });
  });
}

export function useTableLabels() {
  useEffect(() => {
    label(document);
    const obs = new MutationObserver(() => label(document));
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
}
