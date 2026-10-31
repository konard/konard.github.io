import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [position, setPosition] = useState({});
  const trigger = useRef(null);
  const popup = useRef(null);
  const id = useId();
  const { t } = useLang();
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current.getBoundingClientRect();
      const width = Math.min(280, window.innerWidth - 16);
      setPosition({
        position: 'fixed',
        width,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        // The palettes make the chooser taller, so it is kept on the screen by its own height.
        top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - (popup.current?.offsetHeight || 250) - 8)),
        maxHeight: Math.max(80, window.innerHeight - 16),
      });
    };
    place();
    popup.current.querySelector('input').focus({ preventScroll: true });
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
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
  const channels = [1, 3, 5].map((start) => parseInt(value.slice(start, start + 2), 16));
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
        aria-label={`${t({ en: 'Choose color', ru: 'Выбрать цвет' })}: ${props['aria-label'] || label}`}
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
            aria-label={t({ en: 'Color chooser', ru: 'Выбор цвета' })}
            className="ui-color__picker ui-select__list"
            style={position}
          >
            {[
              { en: 'Red', ru: 'Красный' },
              { en: 'Green', ru: 'Зелёный' },
              { en: 'Blue', ru: 'Синий' },
            ].map((name, index) => (
              <label key={name.en}>
                <span>{t(name)}</span>
                <input
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
