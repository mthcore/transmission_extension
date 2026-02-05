/**
 * Type declarations for promise-limit
 * https://github.com/featurist/promise-limit
 */

declare module 'promise-limit' {
  /**
   * Creates a promise limiter that limits the number of concurrent promises.
   * @param concurrency - The maximum number of concurrent promises
   * @returns A function that wraps promise-returning functions to enforce the limit
   */
  function promiseLimit(concurrency: number): <R>(fn: () => Promise<R>) => Promise<R>;

  export = promiseLimit;
}
