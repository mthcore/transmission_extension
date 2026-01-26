import {useContext, useCallback} from 'react';
import RootStoreCtx from '../tools/RootStoreCtx';

export function useOptionsPage() {
  const rootStore = useContext(RootStoreCtx);
  const configStore = rootStore.config;

  const handleChange = useCallback((e) => {
    const checkbox = e.currentTarget;
    configStore.setOptions({
      [checkbox.name]: checkbox.checked
    });
  }, [configStore]);

  const handleSetInt = useCallback((e) => {
    const input = e.currentTarget;
    const value = parseInt(input.value, 10);
    if (Number.isFinite(value)) {
      configStore.setOptions({
        [input.name]: value
      });
    }
  }, [configStore]);

  const handleRadioChange = useCallback((e) => {
    const radio = e.currentTarget;
    configStore.setOptions({
      [radio.name]: radio.value
    });
  }, [configStore]);

  return {
    rootStore,
    configStore,
    handleChange,
    handleSetInt,
    handleRadioChange
  };
}
