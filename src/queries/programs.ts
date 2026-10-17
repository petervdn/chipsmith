/** The check of the programs the app calls (config/programs.ts): read once, and run again on request. */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ProgramCheck } from '../../shared/api.types.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson } from './request.ts';

/** The programs, as the server last checked them. */
export function usePrograms() {
  return useQuery({
    queryKey: getQueryKey({ type: 'programs' }),
    queryFn: () => requestJson<ProgramCheck[]>('/api/programs'),
    staleTime: Infinity,
  });
}

/** Checks the programs again (after installing one or changing a setting). */
export function useCheckProgramsAgain() {
  return useMutation({
    mutationFn: () => requestJson<ProgramCheck[]>('/api/programs', { method: 'POST' }),
    onSuccess: (checks) => queryClient.setQueryData(getQueryKey({ type: 'programs' }), checks),
  });
}
