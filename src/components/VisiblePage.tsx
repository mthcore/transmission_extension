import React, { useState, useCallback, useEffect, ReactNode } from 'react';

interface VisiblePageProps {
  children: ReactNode;
}

const VisiblePage = React.memo<VisiblePageProps>(({ children }) => {
  const [isHidden, setHidden] = useState(document.hidden);

  const handleVisibilityChange = useCallback(() => {
    setHidden(document.hidden);
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  if (isHidden) return null;

  return <>{children}</>;
});

export default VisiblePage;
