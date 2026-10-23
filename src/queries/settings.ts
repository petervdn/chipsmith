/** The app's settings (settings.json in the data folder): read, and changed one at a time. */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AppSettingsChange } from '../../shared/api-requests.schema.ts';
import type { AppSettings } from '../../shared/app-settings.schema.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson, sendJson } from './request.ts';

/**
 * Reads the app's settings.
 *
 * @returns The query of the settings.
 */
export function useAppSettings() {
  return useQuery({
    queryKey: getQueryKey({ type: 'settings' }),
    queryFn: () => requestJson<AppSettings>('/api/settings'),
  });
}

/**
 * Changes the app's settings; the server's answer becomes the cached settings.
 *
 * @returns The mutation, called with the settings changed.
 */
export function useChangeAppSettings() {
  return useMutation({
    mutationFn: (change: AppSettingsChange) =>
      sendJson<AppSettings>('/api/settings', 'PATCH', change),
    onSuccess: (settings) => queryClient.setQueryData(getQueryKey({ type: 'settings' }), settings),
  });
}
