import React, { useRef, useEffect } from "react";

interface IntervalProps {
  interval: number;
  onFire: (isInitial: boolean) => void;
}

const Interval = React.memo<IntervalProps>(({ interval, onFire }) => {
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;

  useEffect(() => {
    const intervalId = setInterval(() => {
      onFireRef.current(false);
    }, interval);

    onFireRef.current(true);
    return () => {
      clearInterval(intervalId);
    };
  }, [interval]);
  return null;
});

export default Interval;
