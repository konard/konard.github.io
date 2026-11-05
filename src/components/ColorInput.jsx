import { localized } from '../i18n/localizer.js';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { parseHex } from '@link-foundation/ui-components/controls';
import { positionFloating } from '@link-foundation/ui-components/overlays';
import { useLang } from '../i18n/prefs';
import { COLOR_PALETTES } from './colorPalettes';
import { focusSlider, numericKey } from './numericKeys';

/** Owned hex field and pointer RGB chooser with palettes of ready colours
 * (issue #45). Incomplete drafts never enter the store. Only an open chooser
 * subscribes to outside/focus/viewport events.
 */
export default function ColorInput({ value, onChange, label = '', ...props }) {
  const [draft, setDraft] = useState(null);
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const popup = useRef(null);
  const id = useId();
  const { t } = useLang();
  useLayoutEffect(() => {
    if (!open) return;
    const element = popup.current;
    // Floating UI measures asynchronously. Avoid exposing a moving hit target
    // while keeping the chooser measurable for its first layout calculation.
    Object.assign(element.style, { position: 'fixed', left: '0px', top: '0px', visibility: 'hidden' });
    let positioned = false;
    return positionFloating(trigger.current, element, {
      offset: 4,
      onUpdate() {
        if (positioned) return;
        positioned = true;
        element.style.visibility = 'visible';
        element.querySelector('input').focus({ preventScroll: true });
      },
    });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!trigger.current.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.current.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  const rgb = parseHex(value);
  const channels = [rgb.r, rgb.g, rgb.b];
  const choose = (hex) => {
    setDraft(null);
    onChange({ target: { value: hex }, currentTarget: { value: hex } });
  };
  const update = (index, channel) => {
    const next = channels.map((current, i) => (i === index ? channel : current));
    choose('#' + next.map((current) => current.toString(16).padStart(2, '0')).join(''));
  };
  return (
    <span className="ui-color">
      <button
        ref={trigger}
        type="button"
        className="ui-color__swatch"
        style={{ '--color': value }}
        aria-label={`${t(localized('m2b9b849b00be'))}: ${props['aria-label'] || label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        disabled={props.disabled}
        onClick={() => setOpen(!open)}
      />
      <input
        {...props}
        type="text"
        spellCheck={false}
        autoComplete="off"
        maxLength={7}
        value={draft ?? value}
        pattern="#[0-9a-fA-F]{6}"
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (/^#[0-9a-f]{6}$/i.test(next)) {
            onChange(event);
            setDraft(null);
          }
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setDraft(null);
        }}
      />
      {open &&
        createPortal(
          <div
            ref={popup}
            id={id}
            role="dialog"
            aria-label={t(localized('m4ccaa88f0716'))}
            className="ui-color__picker ui-select__list"
            style={{ width: 'min(280px, calc(100vw - 16px))', maxHeight: 'max(80px, calc(100vh - 16px))' }}
          >
            {[localized('m9cc00e8c66e8'), localized('m3c3a5c88f76a'), localized('m2b774520127e')].map((name, index) => (
              <label key={name.en}>
                <span>{t(name)}</span>
                <input
                  id={`${id}-${name.en.toLowerCase()}`}
                  type="range"
                  aria-label={t(name)}
                  min="0"
                  max="255"
                  step="1"
                  value={channels[index]}
                  onChange={(event) => update(index, Number(event.target.value))}
                  onPointerDown={focusSlider}
                  onClick={focusSlider}
                  onKeyDown={(event) => numericKey(event, (next) => update(index, next))}
                />
                <output>{channels[index]}</output>
              </label>
            ))}
            {COLOR_PALETTES.map((palette) => (
              <div key={palette.id} className="ui-color__palette" role="group" aria-label={t(palette.name)}>
                <span className="ui-color__palette-name">{t(palette.name)}</span>
                {palette.colors.map(([hex, name]) => (
                  <button
                    key={hex}
                    type="button"
                    className="ui-color__chip"
                    style={{ '--chip': hex }}
                    title={`${t(name)} ${hex}`}
                    aria-label={`${t(name)} ${hex}`}
                    aria-pressed={value.toLowerCase() === hex}
                    onClick={() => choose(hex)}
                  >
                    <i className="swatch" aria-hidden="true" />
                  </button>
                ))}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
}
