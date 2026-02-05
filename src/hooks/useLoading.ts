import { useState, useCallback } from 'react';

interface UseLoadingResult {
  isLoading: boolean;
  withLoading: <T>(action: () => Promise<T>) => Promise<T | undefined>;
}

/**
 * Hook to manage loading state for async operations
 * @returns isLoading state and a wrapper function to track async operations
 */
export function useLoading(): UseLoadingResult {
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = useCallback(async <T>(action: () => Promise<T>): Promise<T | undefined> => {
    setIsLoading(true);
    try {
      return await action();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, withLoading };
}
