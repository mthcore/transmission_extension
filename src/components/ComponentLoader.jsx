import React from "react";
import PropTypes from "prop-types";

const Graph = React.lazy(() => import('./Graph'));

const idComponent = {
  graph: Graph,
};

const Spinner = () => null;

const ComponentLoader = ({'load-page': componentId}) => {
  if (window.PRERENDER) {
    return <Spinner/>;
  }

  const Component = idComponent[componentId];

  return (
    <React.Suspense fallback={<Spinner/>}>
      <Component/>
    </React.Suspense>
  );
};

ComponentLoader.propTypes = {
  'load-page': PropTypes.string.isRequired,
};

export default ComponentLoader;
