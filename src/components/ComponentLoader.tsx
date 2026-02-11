import React from 'react';

declare const window: Window & { PRERENDER?: boolean };

const Graph = React.lazy(() => import('./Graph'));

const idComponent: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  graph: Graph,
};

const Spinner = () => null;

interface ComponentLoaderProps {
  'load-page': string;
}

const ComponentLoader = ({ 'load-page': componentId }: ComponentLoaderProps) => {
  if (window.PRERENDER) {
    return <Spinner />;
  }

  const Component = idComponent[componentId];

  return (
    <React.Suspense fallback={<Spinner />}>
      <Component />
    </React.Suspense>
  );
};

export default ComponentLoader;
