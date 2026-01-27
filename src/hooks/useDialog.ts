import { useRef, useEffect, RefObject } from 'react';

export function useDialog(onClose: () => void): RefObject<HTMLDivElement | null> {
  const refDialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleBodyClick = (e: MouseEvent) => {
      if (refDialog.current && !refDialog.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleBodyClick);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleBodyClick);
    };
  }, [onClose]);

  return refDialog;
}
