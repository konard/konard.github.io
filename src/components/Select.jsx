import { Children, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useSettings } from '../settings/store';
import { createPortal } from 'react-dom';
import { cue } from '../sound/options';

/** Owned select-only combobox. Native-shaped onChange keeps callers simple.
 * The popup lives outside clipped glass panels; only an open menu has listeners.
 * Keyboard behavior follows WAI-ARIA APG, including cancellation and typeahead.
 */
export default function Select({ children, value, onChange, id, name, disabled, className = '', ...props }) {
  const settings = useSettings();
  const menuHeight = settings['ui.menuHeight'];
  const menuWidth = settings['ui.menuWidth'];
  const generated = useId();
  const buttonId = id || `select-${generated}`;
  const listId = `${buttonId}-list`;
  const options = Children.toArray(children)
    .filter(Boolean)
    .map((child) => ({
      value: String(child.props.value),
      label: child.props.children,
      disabled: child.props.disabled,
    }));
  const selected = options.findIndex((option) => option.value === String(value));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selected);
  const [position, setPosition] = useState({});
  const button = useRef(null);
  const popup = useRef(null);
  const typed = useRef({ text: '', at: 0 });
  const show = () => {
    if (!disabled && options.length) {
      setActive(selected);
      setOpen(true);
    }
  };
  const commit = (index) => {
    const option = options[index];
    if (option && !option.disabled && option.value !== String(value)) {
      onChange?.({ target: { value: option.value, name }, currentTarget: { value: option.value, name } });
      cue('select');
    }
    setOpen(false);
  };
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = button.current.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, menuWidth), window.innerWidth - 16);
      const bottom = Math.max(4, Math.min(rect.bottom, window.innerHeight - 4));
      const top = Math.max(4, Math.min(rect.top, window.innerHeight - 4));
      const below = window.innerHeight - bottom - 8;
      const above = top - 8;
      const up = below < 200 && above > below;
      setPosition({
        position: 'fixed',
        width,
        left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8),
        maxHeight: Math.min(menuHeight, Math.max(80, up ? above : below)),
        ...(up ? { bottom: window.innerHeight - top + 4 } : { top: bottom + 4 }),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, menuHeight, menuWidth]);
  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!button.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useEffect(() => {
    const list = popup.current;
    const option = list?.children[active];
    if (open && option) {
      // Scroll only the popup. scrollIntoView can also move the document and
      // pull a portalled menu away from its anchor while it is being placed.
      if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
      else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight)
        list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
    }
  }, [active, open]);
  const move = (start, delta = 1) => {
    for (let index = start; index >= 0 && index < options.length; index += delta) {
      if (!options[index].disabled) {
        setActive(index);
        return;
      }
    }
  };
  const keyDown = (event) => {
    const key = event.key;
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageUp', 'PageDown', 'Enter', ' ', 'Escape'].includes(key))
      event.preventDefault();
    if (key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (key === 'Tab') {
      if (open) commit(active);
      return;
    }
    if (open && event.altKey && key === 'ArrowUp') {
      commit(active);
      return;
    }
    if (!open && ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
      show();
      if (key === 'Home' || key === 'ArrowUp') move(0);
      if (key === 'End') move(options.length - 1, -1);
      return;
    }
    if (key === 'ArrowDown') move(Math.max(0, active + 1));
    else if (key === 'ArrowUp') move(active - 1, -1);
    else if (key === 'Home') move(0);
    else if (key === 'End') move(options.length - 1, -1);
    else if (open && key === 'PageDown') move(Math.min(options.length - 1, active + 10), -1);
    else if (open && key === 'PageUp') move(Math.max(0, active - 10));
    else if (open && (key === 'Enter' || key === ' ')) commit(active);
    else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const state = typed.current;
      state.text = now - state.at > 700 ? key.toLowerCase() : state.text + key.toLowerCase();
      state.at = now;
      if (!open) show();
      const query = [...state.text].every((c) => c === state.text[0]) ? state.text[0] : state.text;
      for (let offset = 1; offset <= options.length; offset++) {
        const index = (Math.max(active, 0) + offset) % options.length;
        const option = options[index];
        if (!option.disabled && String(option.label).trim().toLocaleLowerCase().startsWith(query)) {
          setActive(index);
          break;
        }
      }
    }
  };
  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        {...props}
        id={buttonId}
        ref={button}
        type="button"
        role="combobox"
        disabled={disabled}
        className={`ui-select ${className}`}
        data-value={value}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        onClick={(event) => {
          // Safari does not necessarily focus a button after a pointer click.
          // Keep keyboard navigation on the combobox in every engine.
          event.currentTarget.focus({ preventScroll: true });
          if (open) setOpen(false);
          else show();
        }}
        onKeyDown={keyDown}
        onBlur={(event) => {
          if (!popup.current?.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <span>{options[selected]?.label || '—'}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open &&
        createPortal(
          <ul
            ref={popup}
            id={listId}
            role="listbox"
            aria-labelledby={buttonId}
            className="ui-select__list"
            style={position}
            onPointerDown={(event) => event.preventDefault()}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === selected}
                aria-disabled={option.disabled || undefined}
                data-value={option.value}
                data-active={index === active}
                onPointerMove={() => !option.disabled && setActive(index)}
                onClick={() => !option.disabled && commit(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
