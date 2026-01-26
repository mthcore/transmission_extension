import {useEffect} from 'react';
import {reaction} from 'mobx';

export function useTheme(config) {
  useEffect(() => {
    if (!config) return;

    const applyTheme = () => {
      const theme = config.theme;
      if (theme === 'system') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    };

    applyTheme();
    const dispose = reaction(() => config.theme, applyTheme);

    return () => dispose();
  }, [config]);
}
