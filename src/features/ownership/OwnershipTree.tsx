"use client";

import { ChevronRight, Maximize2, Minus, Plus, UnfoldVertical, FoldVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { useI18n } from "@/context/I18nContext";
import type { CapTable, Organization, OwnershipLink } from "@/api/types";
import {
  NODE_H,
  NODE_W,
  buildTree,
  layoutTree,
  pathToRoot,
  type Placed,
  type TreeNode,
} from "@/features/ownership/treeLayout";

const MIN_K = 0.25;
const MAX_K = 2.5;
const PAD = 32;
const MIN_FIT = 0.6;

/**
 * Interactive ownership diagram: pan by dragging, zoom with the wheel, pinch or buttons, collapse and expand any branch,
 * and hover a node to trace its path to the company. Mirrors in right-to-left so the company sits on the reading-start side.
 */
export function OwnershipTree({
  table,
  org,
  links = [],
}: {
  table: CapTable;
  org: Organization;
  links?: OwnershipLink[];
}) {
  const { t, dir, num, name } = useI18n();
  const rtl = dir === "rtl";
  const tree = useMemo(() => buildTree(org, table, links, name, t("treeCompany")), [org, table, links, name, t]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number; moved: boolean } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; k: number } | null>(null);

  const { placed, width, height } = useMemo(() => layoutTree(tree, collapsed), [tree, collapsed]);
  const gx = (x: number) => (rtl ? width - x - NODE_W : x);
  const byId = useMemo(() => new Map(placed.map((p) => [p.node.id, p])), [placed]);
  const lit = useMemo(() => pathToRoot(hover ? byId.get(hover) : undefined), [hover, byId]);
  const expandable = useMemo(() => {
    const ids: string[] = [];
    const walk = (n: TreeNode) => {
      if (n.children.length) ids.push(n.id);
      n.children.forEach(walk);
    };
    walk(tree);
    return ids;
  }, [tree]);

  const fit = useCallback(() => {
    const el = box.current;
    if (!el) return;
    // Fit the whole tree when that keeps text readable; a very tall tree is shown at a readable size from the top and panned.
    const k = Math.max(MIN_FIT, Math.min(1, (el.clientWidth - PAD * 2) / width, (el.clientHeight - PAD * 2) / height));
    setView({
      k,
      x: Math.max(PAD, (el.clientWidth - width * k) / 2),
      y: Math.max(PAD, (el.clientHeight - height * k) / 2),
    });
  }, [width, height]);
  // Re-fit whenever the visible tree changes shape or the language flips the direction.
  useEffect(fit, [fit, rtl]);

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setView((v) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
      const f = k / v.k;
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f };
    });
  }, []);
  const zoomCentre = (factor: number) => {
    const el = box.current;
    if (el) zoomAt(factor, el.clientWidth / 2, el.clientHeight / 2);
  };

  // The wheel listener must be non-passive to stop the page scrolling while the diagram zooms.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onDown = (e: RPointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k };
      drag.current = null;
    } else {
      drag.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y, moved: false };
    }
  };
  const onMove = (e: RPointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const r = box.current!.getBoundingClientRect();
      const target = (pinch.current.k * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.d;
      zoomAt(target / view.k, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (d.moved) setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };
  const onUp = (e: RPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
  };

  const toggle = (id: string) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const edge = (c: Placed) => {
    const p = c.parent!;
    const x1 = rtl ? gx(p.x) : gx(p.x) + NODE_W;
    const x2 = rtl ? gx(c.x) + NODE_W : gx(c.x);
    const y1 = p.y + NODE_H / 2;
    const y2 = c.y + NODE_H / 2;
    const m = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${m} ${y1}, ${m} ${y2}, ${x2} ${y2}`;
  };

  const tone = (k: TreeNode["kind"]) =>
    k === "company"
      ? "border-emerald-700 bg-emerald-700 text-white"
      : k === "holder"
        ? "border-emerald-600/40 bg-surface text-slate-900"
        : "border-slate-200 bg-slate-50 text-slate-800";

  const btn =
    "grid size-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";

  return (
    <div className="card !p-0">
      <div className="relative">
        <div
          ref={box}
          className="h-[min(70vh,640px)] min-h-[380px] cursor-grab touch-none select-none overflow-hidden rounded-t-2xl bg-[radial-gradient(rgb(var(--slate-300)/0.6)_1px,transparent_1px)] [background-size:20px_20px] active:cursor-grabbing"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          role="group"
          aria-label={t("navOwnership")}
        >
          <svg className="size-full" role="img" aria-label={t("navOwnership")}>
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              {placed
                .filter((p) => p.parent)
                .map((c) => {
                  const on = lit.has(c.node.id);
                  return (
                    <g key={`e-${c.node.id}`}>
                      <path
                        d={edge(c)}
                        fill="none"
                        className={`transition-[stroke,stroke-width,opacity] duration-150 ${on ? "stroke-emerald-600" : "stroke-slate-300"}`}
                        strokeWidth={on ? 3 : 1.75}
                        opacity={hover && !on ? 0.45 : 1}
                      />
                    </g>
                  );
                })}
              {placed.map((p) => {
                const n = p.node;
                const open = n.children.length > 0 && !collapsed.has(n.id);
                const on = lit.has(n.id);
                return (
                  <foreignObject
                    key={n.id}
                    x={gx(p.x)}
                    y={p.y}
                    width={NODE_W}
                    height={NODE_H}
                    className="overflow-visible"
                  >
                    <div
                      onPointerEnter={() => setHover(n.id)}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(n.id)}
                      onBlur={() => setHover(null)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`flex h-full items-center gap-2 rounded-xl border px-3 shadow-card transition-all duration-150 ${tone(n.kind)} ${
                        on && n.kind !== "company" ? "!border-emerald-600 ring-2 ring-emerald-600/25" : ""
                      } ${hover && !on ? "opacity-70" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" title={n.label}>
                          {n.label}
                        </p>
                        <p className={`truncate text-xs ${n.kind === "company" ? "text-white/75" : "text-slate-500"}`}>
                          {n.sub ?? (n.kind === "holder" ? t("fdPct") : t("treeOwns"))}
                        </p>
                      </div>
                      {n.pct !== null && (
                        <span className="shrink-0 rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-800">
                          {num(n.pct, { maximumFractionDigits: 2 })}%
                        </span>
                      )}
                      {n.children.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggle(n.id)}
                          aria-expanded={open}
                          aria-label={`${open ? t("treeCollapse") : t("treeExpand")}: ${n.label}`}
                          className={`grid size-6 shrink-0 place-items-center rounded-md transition-colors ${
                            n.kind === "company"
                              ? "text-white hover:bg-white/15"
                              : "text-slate-500 hover:bg-slate-200/70"
                          }`}
                        >
                          <ChevronRight
                            size={16}
                            aria-hidden
                            className={`transition-transform ${open ? (rtl ? "-rotate-180" : "rotate-0") : rtl ? "rotate-0" : "rotate-180"}`}
                          />
                        </button>
                      )}
                    </div>
                  </foreignObject>
                );
              })}
            </g>
          </svg>
        </div>
        <div className="absolute end-3 top-3 flex flex-col gap-1 rounded-xl border border-slate-200 bg-surface/90 p-1 shadow-card backdrop-blur">
          <button
            type="button"
            className={btn}
            onClick={() => zoomCentre(1.25)}
            aria-label={t("treeZoomIn")}
            title={t("treeZoomIn")}
          >
            <Plus size={16} aria-hidden />
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => zoomCentre(0.8)}
            aria-label={t("treeZoomOut")}
            title={t("treeZoomOut")}
          >
            <Minus size={16} aria-hidden />
          </button>
          <button type="button" className={btn} onClick={fit} aria-label={t("treeFit")} title={t("treeFit")}>
            <Maximize2 size={16} aria-hidden />
          </button>
          <div className="mx-1 h-px bg-slate-200" />
          <button
            type="button"
            className={btn}
            onClick={() => setCollapsed(new Set())}
            aria-label={t("treeExpandAll")}
            title={t("treeExpandAll")}
          >
            <UnfoldVertical size={16} aria-hidden />
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => setCollapsed(new Set(expandable.filter((id) => id !== "root")))}
            aria-label={t("treeCollapseAll")}
            title={t("treeCollapseAll")}
          >
            <FoldVertical size={16} aria-hidden />
          </button>
        </div>
      </div>
      <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">{t("treeDragHint")}</p>
    </div>
  );
}
