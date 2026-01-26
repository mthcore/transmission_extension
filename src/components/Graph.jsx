import React, {useContext, useRef} from "react";
import {observer} from "mobx-react";
import RootStoreCtx from "../tools/RootStoreCtx";
import {useGraph} from "../hooks/useGraph";

const Graph = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const refChart = useRef(null);
  const speedRoll = rootStore.client?.speedRoll;

  useGraph(refChart, speedRoll);

  return (
    <div ref={refChart} style={{width: '100%', height: '30px'}}/>
  );
});

export default Graph;
