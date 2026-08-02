import { useEffect, useRef, useState, RefObject } from 'react';

/**
 * True once the referenced element has scrolled up out of view.
 *
 * Used to hand navigation over from the full brand rail to the condensed
 * sticky bar: while the rail is on screen the bar would be a duplicate, so it
 * only appears after the rail leaves.
 *
 * `rootMargin` accounts for whatever is docked at the top of the viewport
 * (the app bar, and the sticky search field on phones) so the handover
 * happens when the rail passes *behind* that furniture, not when it passes
 * the viewport edge underneath it.
 */
export function useScrolledPast(
  ref: RefObject<HTMLElement | null>,
  topInset = 0
): boolean {
  const [past, setPast] = useState(false);
  // The inset is measured after first paint, so the observer does have to be
  // rebuilt when it lands — but only in 8px steps, so a resize drag doesn't
  // tear it down and rebuild it on every frame.
  const insetStep = Math.round(topInset / 8);
  const insetRef = useRef(topInset);
  insetRef.current = topInset;

  useEffect(() => {
    const target = ref.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Scrolled *past* means gone off the top specifically — an element
        // still below the fold is not intersecting either.
        setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0, rootMargin: `-${Math.round(insetRef.current)}px 0px 0px 0px` }
    );

    observer.observe(target);
    return () => observer.disconnect();
    // insetStep stands in for topInset — see above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, insetStep]);

  return past;
}

/** Live height of an element, tracked through resizes and font loads. */
export function useElementHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(el);
    setHeight(el.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
