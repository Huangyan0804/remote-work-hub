"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useT } from "next-i18next/client";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/get-error-message";

export function Providers({ children }: { children: ReactNode }) {
  const { t } = useT("errors");
  const tRef = useRef(t);
  tRef.current = t;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.silent) return;
            toast.error(getErrorMessage(error, tRef.current));
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _vars, _ctx, mutation) => {
            if (mutation.meta?.silent) return;
            toast.error(getErrorMessage(error, tRef.current));
          },
        }),
        defaultOptions: {
          queries: {
            retry: 0,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
