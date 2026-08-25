"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { useState } from "react";
import { handleSessionDeath } from "@/lib/session";

function handleError(error: Error) {
  if (error.message === "Unauthorized") {
    // Filters the sentinel from api-wrapper's failed refresh path;
    // mutations bypassing useQuery also funnel here.
    void handleSessionDeath(queryClientRef);
  }
}

// Module-stable ref for the handler closure (created once by useState).
let queryClientRef: QueryClient;

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
      queryCache: new QueryCache({ onError: handleError }),
      mutationCache: new MutationCache({ onError: handleError }),
    });
    queryClientRef = client;
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
