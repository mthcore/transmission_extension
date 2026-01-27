import { useContext } from 'react';
import RootStoreCtx from '../tools/rootStoreCtx';
import type { IRootStore } from '../stores/RootStore';

/**
 * Hook to access the RootStore from context.
 * Throws an error if used outside of RootStoreCtx.Provider.
 *
 * @returns The RootStore instance (never undefined)
 */
export function useRootStore(): IRootStore {
  const store = useContext(RootStoreCtx);
  if (!store) {
    throw new Error('useRootStore must be used within a RootStoreCtx.Provider');
  }
  return store;
}

/**
 * Hook to access the RootStore from context, allowing undefined.
 * Use this when the component might render before the store is initialized.
 *
 * @returns The RootStore instance or undefined
 */
export function useRootStoreMaybe(): IRootStore | undefined {
  return useContext(RootStoreCtx);
}

export default useRootStore;
