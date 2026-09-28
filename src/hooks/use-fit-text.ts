"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Finds the largest base font size (px) at which `content` fits inside `container`
 * without scrolling. Children size themselves in `em` relative to that base.
 */
export function useFitText<C extends HTMLElement, T extends HTMLElement>(
  deps: unknown[],
  { min = 14, max = 140, scale = 1 }: { min?: number; max?: number; scale?: number } = {},
) {
  const containerRef = useRef<C>(null);
  const contentRef = useRef<T>(null);
  const [size, setSize] = useState(min);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const fit = () => {
      const cs = getComputedStyle(container);
      const availH = container.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const availW = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (!availH || !availW) return;
      let lo = min;
      let hi = max;
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        content.style.fontSize = `${mid}px`;
        if (content.scrollHeight <= availH && content.scrollWidth <= availW) lo = mid;
        else hi = mid;
      }
      // Scale is a user preference on top of the fitted size; it may overflow (then the area scrolls).
      const final = Math.max(min, lo * scale);
      content.style.fontSize = `${final}px`;
      setSize(final);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, min, max, scale]);

  return { containerRef, contentRef, size };
}
