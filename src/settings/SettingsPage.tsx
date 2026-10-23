// The settings page: the app's settings, which hold for every prompt and every browser, each saved
// the moment it is chosen: the model Claude composes with, and how hard it thinks.
import { COMPOSER_EFFORT_NAMES, COMPOSER_EFFORTS } from '../../shared/composer-efforts.ts';
import { COMPOSER_MODEL_FACTS, COMPOSER_MODELS } from '../../shared/composer-models.ts';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import { useAppSettings, useChangeAppSettings } from '../queries/settings.ts';
import { SettingOptions } from './SettingOptions.tsx';
import { usePageTitle } from '../use-page-title.ts';
import './SettingsPage.css';

const MODEL_OPTIONS = COMPOSER_MODELS.map((model) => ({
  value: model,
  ...COMPOSER_MODEL_FACTS[model],
}));
const EFFORT_OPTIONS = [
  { value: null, name: 'Default', about: "Claude Code's own for the model" },
  ...COMPOSER_EFFORTS.map((effort) => ({ value: effort, name: COMPOSER_EFFORT_NAMES[effort] })),
];

/**
 * Shows the settings page.
 *
 * @returns The page's element.
 */
export function SettingsPage() {
  usePageTitle('Settings');
  const { data: settings, error: readError } = useAppSettings();
  const { mutate: changeSettings, error: changeError, isPending } = useChangeAppSettings();
  const error = readError ?? changeError;
  return (
    <section className="settings-page">
      <Breadcrumbs crumbs={[{ label: 'Settings' }]} />
      <p className="settings-page-intro">
        For every job from now on, songs and takes; a job on its way keeps what it started with.
        Faster makes a job quicker; whether its songs are as good is for listening.
      </p>
      <fieldset className="settings-page-section" disabled={!settings || isPending}>
        <legend className="settings-page-label">The model that composes</legend>
        <SettingOptions
          label="the model that composes"
          options={MODEL_OPTIONS}
          chosen={settings?.composerModel}
          onChoose={(composerModel) => changeSettings({ composerModel })}
        />
      </fieldset>
      <fieldset className="settings-page-section" disabled={!settings || isPending}>
        <legend className="settings-page-label">How hard it thinks</legend>
        <p className="settings-page-about">
          Most of a job is its thinking: a lower effort thinks less, so it is faster, and the music
          may be plainer.
        </p>
        <SettingOptions
          label="how hard it thinks"
          options={EFFORT_OPTIONS}
          chosen={settings === undefined ? undefined : settings.composerEffort}
          onChoose={(composerEffort) => changeSettings({ composerEffort })}
        />
      </fieldset>
      {error && <p className="error">{error.message}</p>}
    </section>
  );
}
