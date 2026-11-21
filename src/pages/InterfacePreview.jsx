import { localized } from '../i18n/localizer.js';
import { useState } from 'react';
import Select from '../components/Select';
import { focusSlider, numericKey } from '../components/numericKeys';
import { useLang } from '../i18n/prefs';
import { MATERIAL_PRESETS } from '../settings/schema.materials';
import { setSettings } from '../settings/store';
import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { iconProps } from '../components/icons';

export function MaterialPresets() {
  const { t } = useLang();
  return (
    <div className="page-hero__actions" role="group" aria-label={t(localized('m7551bc4cab25'))}>
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
    <div className="ui-preview" aria-label={t(localized('m7ef3b6cd2abc'))}>
      <div className="ui-preview__panel">
        <p>{t(localized('m120c071ac27d'))}</p>
        <Select aria-label={t(localized('m8065f91eff5f'))} value="sample" onChange={() => {}}>
          <option value="sample">{t(localized('m67c82fbb2931'))}</option>
          <option value="disabled" disabled>
            {t(localized('m00e52f59f346'))}
          </option>
        </Select>
        <div className="page-hero__actions">
          <button type="button" onClick={() => setChecked(!checked)} aria-pressed={checked}>
            {t(localized('mc7d6e86a9f14'))}
          </button>
          <button type="button" disabled>
            {t(localized('m2125b9dd7d09'))}
          </button>
          <label>
            <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
            {t(localized('m88f10a6fbb1c'))}
          </label>
          <input
            id="ui-preview-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            onPointerDown={focusSlider}
            onClick={focusSlider}
            onKeyDown={(event) => numericKey(event, setLevel)}
            aria-label={t(localized('m3e29dc67ebb3'))}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>{t(localized('m408be26c7b32'))}</th>
              <th>{t(localized('mfd6d4fd26692'))}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t(localized('mbbea670fb8b3'))}</td>
              <td>
                <ArrowUpLeft {...iconProps} /> <ArrowUpRight {...iconProps} /> <ArrowDownRight {...iconProps} />{' '}
                <ArrowDownLeft {...iconProps} />
              </td>
            </tr>
            <tr>
              <td>{t(localized('md7b34964d8f8'))}</td>
              <td>1 · 2 · 3</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
