/**
 * The songs from the server: the list, one song, and changing or deleting a song. A list or song that
 * waits for audio (rendered when the server starts) is read again until it has it.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { SongDeletion, SongDetail, SongListing } from '../../shared/api.types.ts';
import type { Status } from '../../shared/catalogue.schema.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson, sendJson } from './request.ts';
import type { Track } from '../../shared/song.schema.ts';

/** Milliseconds between reads while audio is being rendered. */
const WAITING_INTERVAL = 3000;

/**
 * Reads the songs list from the server, again every few seconds while a song waits for its audio.
 *
 * @returns The query of the song listings.
 */
export function useSongs() {
  return useQuery({
    queryKey: getQueryKey({ type: 'songs' }),
    queryFn: () => requestJson<SongListing[]>('/api/songs'),
    refetchInterval: (query) =>
      query.state.data?.some((listing) => listing.isWaitingForAudio) ? WAITING_INTERVAL : false,
  });
}

/**
 * Reads one song with the clips it plays from the server, again every few seconds while it waits
 * for its audio.
 *
 * @param songId - The id of the song.
 * @returns The query of the song.
 */
export function useSong(songId: string) {
  return useQuery({
    queryKey: getQueryKey({ type: 'song', songId }),
    queryFn: () => readSong(songId),
    refetchInterval: (query) => (query.state.data?.isWaitingForAudio ? WAITING_INTERVAL : false),
  });
}

/**
 * Fetches one song with the clips it plays: from the cache when it is fresh, else from the server.
 * For code outside a component.
 *
 * @param songId - The id of the song.
 * @returns The song.
 */
export function fetchSong(songId: string): Promise<SongDetail> {
  return queryClient.fetchQuery({
    queryKey: getQueryKey({ type: 'song', songId }),
    queryFn: () => readSong(songId),
  });
}

/**
 * Changes a song's status on the server; the server's answer becomes the cached song, and the songs
 * list is read again.
 *
 * @returns The mutation, called with the song's id (`songId`) and its new `status`.
 */
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

/**
 * Deletes a song on the server, with the clips no other song played; it leaves the cache, and the
 * songs list and the clip pool are read again.
 *
 * @returns The mutation, called with the song's id.
 */
export function useDeleteSong() {
  return useMutation({
    mutationFn: (songId: string) =>
      sendJson<SongDeletion>(`/api/songs/${encodeURIComponent(songId)}`, 'DELETE', null),
    onSuccess: (_deletion, songId) => {
      queryClient.removeQueries({ queryKey: getQueryKey({ type: 'song', songId }) });
      void queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'clips' }) });
      return queryClient.invalidateQueries({
        queryKey: getQueryKey({ type: 'songs' }),
        exact: true,
      });
    },
  });
}

/**
 * Saves a song's tracks on the server; the server's answer becomes the cached song, and the songs
 * list is read again.
 *
 * @returns The mutation, called with the song's id (`songId`) and its `tracks`.
 */
export function useSaveTracks() {
  return useMutation({
    mutationFn: ({ songId, tracks }: { songId: string; tracks: Track[] }) =>
      sendJson<SongDetail>(`/api/songs/${encodeURIComponent(songId)}/tracks`, 'PUT', { tracks }),
    onSuccess: (detail) => {
      queryClient.setQueryData(getQueryKey({ type: 'song', songId: detail.song.id }), detail);
      return queryClient.invalidateQueries({
        queryKey: getQueryKey({ type: 'songs' }),
        exact: true,
      });
    },
  });
}

/**
 * Splits a song that is one whole clip into tracks of blocks on the server; its new clips render in
 * the background. The server's answer becomes the cached song; the songs list and the clip pool are
 * read again.
 *
 * @returns The mutation, called with the song's id.
 */
export function useSplitSong() {
  return useMutation({
    mutationFn: (songId: string) =>
      sendJson<SongDetail>(`/api/songs/${encodeURIComponent(songId)}/split`, 'POST', {}),
    onSuccess: (detail) => {
      queryClient.setQueryData(getQueryKey({ type: 'song', songId: detail.song.id }), detail);
      void queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'clips' }) });
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
