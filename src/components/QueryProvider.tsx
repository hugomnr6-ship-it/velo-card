"use client";

import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // Cache de 2 minutes par défaut
          staleTime: 2 * 60 * 1000,
          // Garbage collection après 10 minutes
          gcTime: 10 * 60 * 1000,
          // Retry intelligent : pas de retry sur 4xx
          retry: (failureCount, error: any) => {
            if (error?.status >= 400 && error?.status < 500) return false;
            return failureCount < 2;
          },
          // Pas de refetch au focus par défaut (économie de requêtes)
          refetchOnWindowFocus: false,
          // Refetch au reconnect
          refetchOnReconnect: "always",
        },
        mutations: {
          retry: 1,
        },
      },
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary onReset={reset}>
            {children}
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </QueryClientProvider>
  );
}
