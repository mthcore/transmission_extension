import {useRef, useEffect} from 'react';

export function useDialog(onClose) {
  const refDialog = useRef(null);

  useEffect(() => {
    const handleBodyClick = (e) => {
      if (refDialog.current && !refDialog.current.contains(e.target)) {
        onClose();
      }
    };
    // Delay adding listener to avoid catching the click that opened the dialog
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
