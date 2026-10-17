/** The songs from the server: the list, one song, and changing a song's status. */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { SongDetail, SongListing } from '../../shared/api.types.ts';
import type { Status } from '../../shared/catalogue.types.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson, sendJson } from './request.ts';

/** The songs list. */
export function useSongs() {
  return useQuery({
    queryKey: getQueryKey({ type: 'songs' }),
    queryFn: () => requestJson<SongListing[]>('/api/songs'),
  });
}

/** One song with the clips it plays. */
export function useSong(songId: string) {
  return useQuery({
    queryKey: getQueryKey({ type: 'song', songId }),
    queryFn: () => readSong(songId),
  });
}

/** One song, from the cache when it is fresh, else from the server (for code outside a component). */
export function fetchSong(songId: string): Promise<SongDetail> {
  return queryClient.fetchQuery({
    queryKey: getQueryKey({ type: 'song', songId }),
    queryFn: () => readSong(songId),
  });
}

/** Changes a song's status; the songs list and the song are read again. */
export function useSetSongStatus() {
  return useMutation({
    mutationFn: ({ songId, status }: { songId: string; status: Status }) =>
      sendJson<SongDetail>(`/api/songs/${encodeURIComponent(songId)}`, 'PATCH', { status }),
    onSuccess: (detail) => {
      queryClient.setQueryData(getQueryKey({ type: 'song', songId: detail.song.id }), detail);
      return queryClient.invalidateQueries({
        queryKey: getQueryKey({ type: 'songs' }),
        exact: true,
      });
    },
  });
}

function readSong(songId: string): Promise<SongDetail> {
  return requestJson<SongDetail>(`/api/songs/${encodeURIComponent(songId)}`);
}
