"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Per-layer size multipliers set by the reader (see Player). */
const SCALE_VARS = ["--fs-ar", "--fs-tl", "--fs-tr"];

/** Height the children need, ignoring any stretching of the (flex) content box itself. */
function naturalHeight(el: HTMLElement) {
  const kids = Array.from(el.children) as HTMLElement[];
  if (!kids.length) return 0;
  const gap = parseFloat(getComputedStyle(el).rowGap) || 0;
  return kids.reduce((sum, k) => sum + k.getBoundingClientRect().height, 0) + gap * (kids.length - 1);
}

/**
 * Finds the largest base font size (px) at which `content` fits inside `container`
 * without scrolling. Children size themselves in `em` relative to that base.
 */
export function useFitText<C extends HTMLElement, T extends HTMLElement>(
  deps: unknown[],
  { min = 14, max = 140 }: { min?: number; max?: number } = {},
) {
  const containerRef = useRef<C>(null);
  const contentRef = useRef<T>(null);
  const [size, setSize] = useState(min);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    let last = { w: 0, h: 0 };

    const fit = () => {
      // Hide the scrollbar while measuring so it can't change the width mid-search.
      const prevOverflow = container.style.overflowY;
      container.style.overflowY = "hidden";
      const cs = getComputedStyle(container);
      const availH = container.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      // Fit at 100% for every layer; the user's per-layer sizes (CSS vars) apply on top,
      // so changing one layer never silently shrinks another.
      for (const v of SCALE_VARS) content.style.setProperty(v, "1");
      if (availH > 0) {
        let lo = min;
        let hi = max;
        while (hi - lo > 0.5) {
          const mid = (lo + hi) / 2;
          content.style.fontSize = `${mid}px`;
          if (naturalHeight(content) <= availH) lo = mid;
          else hi = mid;
        }
        content.style.fontSize = `${lo}px`;
        setSize(lo);
      }
      for (const v of SCALE_VARS) content.style.removeProperty(v);
      container.style.overflowY = prevOverflow;
      last = { w: container.clientWidth, h: container.clientHeight };
    };

    fit();
    // Refit when the available box really changes (rotation, controls shown/hidden),
    // but not when only our own scrollbar appears or disappears.
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (h !== last.h || Math.abs(w - last.w) > 24) fit();
    });
    ro.observe(container);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, min, max]);

  return { containerRef, contentRef, size };
}
