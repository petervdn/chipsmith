/** The style guides from the server, and making, changing and deleting one; each answers with the list. */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Guide, GuideDraft } from '../../shared/guide.types.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson, sendJson } from './request.ts';

/** The guides, by name. */
export function useGuides() {
  return useQuery({
    queryKey: getQueryKey({ type: 'guides' }),
    queryFn: () => requestJson<Guide[]>('/api/guides'),
  });
}

/** Makes a guide (no id) or changes one. */
export function useSaveGuide() {
  return useMutation({
    mutationFn: ({ guideId, draft }: { guideId: string | null; draft: GuideDraft }) =>
      guideId
        ? sendJson<Guide[]>(`/api/guides/${encodeURIComponent(guideId)}`, 'PATCH', draft)
        : sendJson<Guide[]>('/api/guides', 'POST', draft),
    onSuccess: keepGuides,
  });
}

/** Deletes a guide; what was sent with it keeps its copy. */
export function useDeleteGuide() {
  return useMutation({
    mutationFn: (guideId: string) =>
      sendJson<Guide[]>(`/api/guides/${encodeURIComponent(guideId)}`, 'DELETE', null),
    onSuccess: keepGuides,
  });
}

function keepGuides(guides: Guide[]): void {
  queryClient.setQueryData(getQueryKey({ type: 'guides' }), guides);
}
