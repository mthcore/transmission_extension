import React, { useRef } from 'react';
import { observer } from 'mobx-react';
import useRootStore from '../hooks/useRootStore';
import { useGraph } from '../hooks/useGraph';

const Graph = observer(() => {
  const rootStore = useRootStore();
  const refChart = useRef<HTMLDivElement>(null);
  const speedRoll = rootStore?.client?.speedRoll;

  useGraph(refChart as React.RefObject<HTMLElement>, speedRoll);

  return (
    <div
      ref={refChart}
      style={{ width: '100%', height: '30px' }}
      role="img"
      aria-label={chrome.i18n.getMessage('speedGraph') || 'Speed graph'}
    />
  );
});

export default Graph;
