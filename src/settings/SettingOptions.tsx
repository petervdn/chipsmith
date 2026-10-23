// A setting's options on the settings page: buttons in a row that wraps, the one chosen marked.

/** An option of a setting: its value, its name, and a line on what it does, if it needs one. */
export type SettingOption<Value> = { value: Value; name: string; about?: string };

type SettingOptionsProps<Value> = {
  label: string;
  options: SettingOption<Value>[];
  chosen: Value | undefined;
  onChoose: (value: Value) => void;
};

/**
 * Shows a setting's options as buttons in a row that wraps, the one chosen marked.
 *
 * @param props - The component's props.
 * @param props.label - What the setting is, for a screen reader.
 * @param props.options - The options.
 * @param props.chosen - The value chosen, or undefined before the settings are read.
 * @param props.onChoose - Called with the value of the option tapped.
 * @returns The options' element.
 */
export function SettingOptions<Value>({
  label,
  options,
  chosen,
  onChoose,
}: SettingOptionsProps<Value>) {
  return (
    <div className="settings-page-options" role="radiogroup" aria-label={label}>
      {options.map(({ value, name, about }) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={value === chosen}
          className={`settings-page-option${value === chosen ? ' is-on' : ''}`}
          onClick={() => onChoose(value)}
        >
          <span className="settings-page-option-name">{name}</span>
          {about && <span className="settings-page-option-about">{about}</span>}
        </button>
      ))}
    </div>
  );
}
