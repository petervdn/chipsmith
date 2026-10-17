/**
 * The filter each list last had in this tab, in sessionStorage (Zustand's persist), so the top bar's
 * links go back to a list as it was filtered. The filter itself lives in the address (docs/adr/0017).
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** The last query of each list, by its path, and how to keep one. */
type ListMemoryStore = {
  lastQueries: Record<string, string>;
  rememberQuery: (path: string, query: string) => void;
};

/** The list memory store. */
export const useListMemoryStore = create<ListMemoryStore>()(
  persist(
    (set) => ({
      lastQueries: {},
      rememberQuery: (path, query) =>
        set(({ lastQueries }) => ({ lastQueries: { ...lastQueries, [path]: query } })),
    }),
    {
      name: 'chiptune.lists',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ lastQueries }) => ({ lastQueries }),
    },
  ),
);
