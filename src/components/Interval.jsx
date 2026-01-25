import React from "react";
import PropTypes from "prop-types";

const Interval = React.memo(({interval, onFire}) => {
  const onFireRef = React.useRef(onFire);
  onFireRef.current = onFire;

  React.useEffect(() => {
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
Interval.propTypes = {
  interval: PropTypes.number.isRequired,
  onFire: PropTypes.func.isRequired,
};

export default Interval;