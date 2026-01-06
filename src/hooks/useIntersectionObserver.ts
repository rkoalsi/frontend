import { useEffect, useRef, RefObject } from 'react';

interface UseIntersectionObserverProps {
  onIntersect: () => void;
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export const useIntersectionObserver = ({
  onIntersect,
  enabled = true,
  threshold = 1.0,
  rootMargin = '0px',
}: UseIntersectionObserverProps): RefObject<HTMLDivElement | null> => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onIntersect);

  // Update callback ref when onIntersect changes
  useEffect(() => {
    callbackRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    if (!enabled) return;

    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callbackRef.current();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [enabled, threshold, rootMargin]);

  return targetRef;
};
