import { useCallback, ChangeEvent } from 'react';
import useRootStore from './useRootStore';

interface ConfigStore {
  setOptions(options: Record<string, unknown>): void;
}

interface RootStore {
  config: ConfigStore;
}

export function useOptionsPage<T = ConfigStore>() {
  const rootStore = useRootStore() as unknown as RootStore;
  const configStore = rootStore.config;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const checkbox = e.currentTarget;
      configStore.setOptions({
        [checkbox.name]: checkbox.checked,
      });
    },
    [configStore]
  );

  const handleSetInt = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const value = parseInt(input.value, 10);
      if (Number.isFinite(value)) {
        configStore.setOptions({
          [input.name]: value,
        });
      }
    },
    [configStore]
  );

  const handleRadioChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const radio = e.currentTarget;
      configStore.setOptions({
        [radio.name]: radio.value,
      });
    },
    [configStore]
  );

  return {
    rootStore,
    configStore: configStore as unknown as T,
    handleChange,
    handleSetInt,
    handleRadioChange,
  };
}
