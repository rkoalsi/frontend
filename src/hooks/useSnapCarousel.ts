import { useCallback, useEffect, useRef, useState } from "react";

interface UseSnapCarouselOptions {
  /** Index the carousel should be parked on. */
  activeIndex: number;
  /** Number of slides. */
  count: number;
  /** Fired once a user swipe settles on a different slide. */
  onIndexChange: (index: number) => void;
  /** How long to wait for a swipe to settle before reading the index. */
  settleMs?: number;
}

/**
 * Drives a scroll-snapped horizontal strip whose selected slide is owned by the
 * caller — the rail, the dropdown and the strip are all views of one selection,
 * so moving any of them moves the rest.
 *
 * Native scroll-snap does the gesture work; this only keeps the strip parked on
 * the active slide and reports swipes back, without reading its own programmatic
 * scrolling back as a user gesture.
 */
export function useSnapCarousel({
  activeIndex,
  count,
  onIndexChange,
  settleMs = 150,
}: UseSnapCarouselOptions) {
  // A callback ref, not a plain one: inside a dialog the strip mounts long
  // after the props last changed, and an effect keyed only on those would never
  // re-run to park it — the dialog would always open on the first slide.
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  // Set while we are the ones scrolling.
  const programmaticRef = useRef(false);
  const settleTimer = useRef<number | undefined>(undefined);
  const scrollEndTimer = useRef<number | undefined>(undefined);
  // The first park of a given strip jumps; every later one glides.
  const hasPaintedRef = useRef(false);

  const ref = useCallback((el: HTMLDivElement | null) => {
    nodeRef.current = el;
    // Unmounting (a dialog closing) means the next mount is a fresh strip that
    // should jump straight to its slide rather than animate from slide one.
    if (!el) hasPaintedRef.current = false;
    setNode(el);
  }, []);

  /** Scroll without the CSS `scroll-behavior: smooth` on the strip. */
  const jumpTo = (el: HTMLElement, left: number) => {
    const previous = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = left;
    el.style.scrollBehavior = previous;
  };

  useEffect(() => {
    const el = node;
    if (!el || count === 0) return;

    let raf = 0;
    const park = () => {
      // A slide is one strip wide, so a zero width means layout hasn't happened
      // yet (a dialog mid-transition, say) — try again next frame.
      if (el.clientWidth === 0) {
        raf = requestAnimationFrame(park);
        return;
      }
      const target = activeIndex * el.clientWidth;
      if (Math.abs(el.scrollLeft - target) < 4) {
        hasPaintedRef.current = true;
        return;
      }
      programmaticRef.current = true;
      if (hasPaintedRef.current) {
        el.scrollTo({ left: target, behavior: "smooth" });
      } else {
        jumpTo(el, target);
      }
      hasPaintedRef.current = true;
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => {
        programmaticRef.current = false;
      }, 500);
    };

    raf = requestAnimationFrame(park);
    return () => cancelAnimationFrame(raf);
  }, [node, activeIndex, count]);

  // A resize changes slide width, which would leave the strip mid-slide.
  useEffect(() => {
    const el = node;
    if (!el) return;
    const onResize = () => {
      programmaticRef.current = true;
      jumpTo(el, activeIndex * el.clientWidth);
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => {
        programmaticRef.current = false;
      }, 200);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [node, activeIndex]);

  useEffect(
    () => () => {
      window.clearTimeout(settleTimer.current);
      window.clearTimeout(scrollEndTimer.current);
    },
    []
  );

  const onScroll = useCallback(() => {
    const el = nodeRef.current;
    if (!el) return;
    window.clearTimeout(scrollEndTimer.current);
    // Selecting a brand refetches the grid, so wait for the swipe to settle
    // rather than firing on every intermediate frame.
    scrollEndTimer.current = window.setTimeout(() => {
      if (programmaticRef.current) return;
      const index = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
      if (index !== activeIndex) onIndexChange(index);
    }, settleMs);
  }, [activeIndex, onIndexChange, settleMs]);

  /** A real finger on the strip always wins over an in-flight animation. */
  const onPointerDown = useCallback(() => {
    programmaticRef.current = false;
  }, []);

  return { ref, onScroll, onPointerDown };
}

/** Styles that make a flex row behave as a snapped, scrollbar-free strip. */
export const snapScrollerSx = {
  display: "flex",
  overflowX: "auto",
  scrollSnapType: "x mandatory",
  scrollBehavior: "smooth",
  overscrollBehaviorX: "contain",
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
} as const;

/** Styles for one full-width slide inside a `snapScrollerSx` strip. */
export const snapSlideSx = {
  flex: "0 0 100%",
  minWidth: 0,
  scrollSnapAlign: "start",
  scrollSnapStop: "always",
} as const;
