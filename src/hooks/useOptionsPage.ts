import { useContext, useCallback, ChangeEvent } from 'react';
import RootStoreCtx from '../tools/rootStoreCtx';

interface ConfigStore {
  setOptions(options: Record<string, unknown>): Promise<void>;
}

interface RootStore {
  config: ConfigStore;
}

export function useOptionsPage() {
  const rootStore = useContext(RootStoreCtx) as RootStore;
  const configStore = rootStore.config;

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const checkbox = e.currentTarget;
    configStore.setOptions({
      [checkbox.name]: checkbox.checked
    });
  }, [configStore]);

  const handleSetInt = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = parseInt(input.value, 10);
    if (Number.isFinite(value)) {
      configStore.setOptions({
        [input.name]: value
      });
    }
  }, [configStore]);

  const handleRadioChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
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
