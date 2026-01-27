import React, { useContext, useRef } from "react";
import { observer } from "mobx-react";
import RootStoreCtx from "../tools/rootStoreCtx";
import { useGraph } from "../hooks/useGraph";

const Graph: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const refChart = useRef<HTMLDivElement>(null);
  const speedRoll = rootStore?.client?.speedRoll;

  useGraph(refChart as React.RefObject<HTMLElement>, speedRoll);

  return (
    <div ref={refChart} style={{ width: '100%', height: '30px' }}/>
  );
});

export default Graph;
