/**
 * useAsync — run an async read and track its {data, loading, error}. A minimal
 * stand-in for a data-fetching library (kept out of Phase 1 to stay lean); good
 * enough for local-first reads that resolve fast.
 *
 * `deps` controls re-running, exactly like useEffect's dependency array. The
 * hook guards against setting state after unmount.
 */
import { useEffect, useState, type DependencyList } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

export function useAsync<T>(run: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    loading: true,
    error: undefined,
  });

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    run()
      .then((data) => {
        if (active) setState({ data, loading: false, error: undefined });
      })
      .catch((err: unknown) => {
        if (active) {
          setState({
            data: undefined,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
