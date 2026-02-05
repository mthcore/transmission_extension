import React from 'react';
import type { IRootStore } from '../stores/RootStore';

const RootStoreCtx = React.createContext<IRootStore | undefined>(undefined);
RootStoreCtx.displayName = 'RootStoreCtx';

export default RootStoreCtx;
