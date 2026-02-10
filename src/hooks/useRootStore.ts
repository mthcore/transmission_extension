import { useContext } from 'react';
import RootStoreCtx from '../tools/rootStoreCtx';
import type { IRootStore } from '../stores/RootStore';

export default function useRootStore(): IRootStore {
  const store = useContext(RootStoreCtx);
  if (!store) throw new Error('useRootStore must be used within RootStoreCtx.Provider');
  return store;
}
