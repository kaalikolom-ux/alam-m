import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

/**
 * Keeps the application query cache in IndexedDB so already-read articles render
 * without a network connection.
 */
export function useQueryPersistence() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const persister = createAsyncStoragePersister({
      storage: {
        getItem: (key) => get<string>(key).then((v) => v ?? null),
        setItem: (key, value) => set(key, value),
        removeItem: (key) => del(key),
      },
      key: "alam-m-query-cache",
      throttleTime: 2000,
    });

    const [unsubscribe] = persistQueryClient({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 60 * 24 * 365,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          const key = query.queryKey[0];
          return (
            query.state.status === "success" &&
            (key === "articles" || key === "categories" || key === "page" || key === "menu")
          );
        },
      },
    });

    return unsubscribe;
  }, [queryClient]);
}
