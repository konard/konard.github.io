import { useState } from 'react';
import Select from '../components/Select';
import { focusSlider, numericKey } from '../components/numericKeys';
import { useLang } from '../i18n/prefs';
import { MATERIAL_PRESETS } from '../settings/schema.materials';
import { setSettings } from '../settings/store';

export function MaterialPresets() {
  const { t } = useLang();
  return (
    <div
      className="page-hero__actions"
      role="group"
      aria-label={t({ en: 'Glass material presets', ru: 'Пресеты стекла' })}
    >
      {MATERIAL_PRESETS.map(({ id, label, values }) => (
        <button
          key={id}
          className="button button--small"
          type="button"
          onClick={() => setSettings({ ...values, 'skin.name': 'liquid' })}
        >
          {t(label)}
        </button>
      ))}
    </div>
  );
}

export default function InterfacePreview() {
  const { t } = useLang();
  const [checked, setChecked] = useState(true);
  const [level, setLevel] = useState(50);
  return (
    <div className="ui-preview" aria-label={t({ en: 'Interface preview', ru: 'Предпросмотр интерфейса' })}>
      <div className="ui-preview__panel">
        <p>{t({ en: 'Live corner and control preview', ru: 'Предпросмотр углов и элементов' })}</p>
        <Select aria-label={t({ en: 'Preview menu', ru: 'Меню предпросмотра' })} value="sample" onChange={() => {}}>
          <option value="sample">{t({ en: 'Sample menu', ru: 'Пример меню' })}</option>
          <option value="disabled" disabled>
            {t({ en: 'Disabled option', ru: 'Недоступный вариант' })}
          </option>
        </Select>
        <div className="page-hero__actions">
          <button type="button" onClick={() => setChecked(!checked)} aria-pressed={checked}>
            {t({ en: 'Sample button', ru: 'Пример кнопки' })}
          </button>
          <button type="button" disabled>
            {t({ en: 'Disabled button', ru: 'Отключённая кнопка' })}
          </button>
          <label>
            <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
            {t({ en: 'Sample checkbox', ru: 'Пример флажка' })}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            onPointerDown={focusSlider}
            onClick={focusSlider}
            onKeyDown={(event) => numericKey(event, setLevel)}
            aria-label={t({ en: 'Preview slider', ru: 'Бегунок предпросмотра' })}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>{t({ en: 'Element', ru: 'Элемент' })}</th>
              <th>{t({ en: 'Preview', ru: 'Предпросмотр' })}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t({ en: 'Corners', ru: 'Углы' })}</td>
              <td>↖ ↗ ↘ ↙</td>
            </tr>
            <tr>
              <td>{t({ en: 'Table rows', ru: 'Строки таблицы' })}</td>
              <td>1 · 2 · 3</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
