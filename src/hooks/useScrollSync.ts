import { useRef, useEffect, useCallback, RefObject } from 'react';

interface ScrollSyncOptions {
  withWidthCheck?: boolean;
}

export function useScrollSync(
  headerRef: RefObject<HTMLElement | null>,
  options: ScrollSyncOptions = {}
): (e: React.UIEvent<HTMLElement>) => void {
  const scrollRafId = useRef<number | null>(null);
  const { withWidthCheck = false } = options;

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const scrollWidth = e.currentTarget.scrollWidth;
    if (scrollRafId.current) return;
    scrollRafId.current = requestAnimationFrame(() => {
      scrollRafId.current = null;
      const fixedHead = headerRef.current;
      if (!fixedHead) return;

      if (withWidthCheck) {
        const isWide = scrollWidth >= document.body.clientWidth;
        if (isWide && scrollLeft > 0) {
          fixedHead.style.left = `${scrollLeft * -1}px`;
        } else if (fixedHead.style.left) {
          fixedHead.style.left = '';
        }
      } else {
        fixedHead.style.left = `${scrollLeft * -1}px`;
      }
    });
  }, [headerRef, withWidthCheck]);

  useEffect(() => {
    return () => {
      if (scrollRafId.current) {
        cancelAnimationFrame(scrollRafId.current);
      }
    };
  }, []);

  return handleScroll;
}
