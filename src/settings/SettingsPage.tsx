// The settings page: the app's settings, which hold for every prompt and every browser, each saved
// the moment it is chosen. For now one: the model Claude composes with.
import { COMPOSER_MODEL_FACTS, COMPOSER_MODELS } from '../../shared/composer-models.ts';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import { useAppSettings, useChangeAppSettings } from '../queries/settings.ts';
import { usePageTitle } from '../use-page-title.ts';
import './SettingsPage.css';

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
      <fieldset className="settings-page-section" disabled={!settings || isPending}>
        <legend className="settings-page-label">The model that composes</legend>
        <p className="settings-page-about">
          Every job from now on, songs and takes, is composed by it; a job on its way keeps the
          model it started with. A faster model makes a job quicker; whether its songs are as good
          is for listening.
        </p>
        <div
          className="settings-page-options"
          role="radiogroup"
          aria-label="the model that composes"
        >
          {COMPOSER_MODELS.map((model) => (
            <button
              key={model}
              type="button"
              role="radio"
              aria-checked={settings?.composerModel === model}
              className={`settings-page-option${settings?.composerModel === model ? ' is-on' : ''}`}
              onClick={() => changeSettings({ composerModel: model })}
            >
              <span className="settings-page-option-name">{COMPOSER_MODEL_FACTS[model].name}</span>
              <span className="settings-page-option-about">
                {COMPOSER_MODEL_FACTS[model].about}
              </span>
            </button>
          ))}
        </div>
        {error && <p className="error">{error.message}</p>}
      </fieldset>
    </section>
  );
}
