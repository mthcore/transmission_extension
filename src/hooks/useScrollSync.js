import {useRef, useEffect, useCallback} from 'react';

export function useScrollSync(headerRef, options = {}) {
  const scrollRafId = useRef(null);
  const {withWidthCheck = false} = options;

  const handleScroll = useCallback((e) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const scrollWidth = e.currentTarget.scrollWidth;
    if (scrollRafId.current) return;
    scrollRafId.current = requestAnimationFrame(() => {
      scrollRafId.current = null;
      const fixedHead = headerRef.current;
      if (!fixedHead) return;

      if (withWidthCheck) {
        // Firefox-specific: only apply when content is wider than viewport
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
