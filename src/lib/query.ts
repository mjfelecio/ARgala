import { QueryClient } from '@tanstack/react-query';

// Remote provider content is transient, never persisted, and removed when unused.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false }, mutations: { retry: false } },
});
