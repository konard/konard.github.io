import { Children, useId, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { mountControls } from '@link-foundation/ui-components/controls';
import { formatLinks } from '@link-foundation/ui-core';
import { localized } from '../i18n/localizer';
import { useLang } from '../i18n/prefs';
import { useSettings } from '../settings/store';
import { cue } from '../sound/options';
import '../ui/framework.css';

/** React event/skin adapter; the framework owns rendering and interaction.
 * Tab commit, page steps and menu sizing bridge the upstream migration gaps.
 */
export default function Select({ children, value, onChange, id, name, disabled, className = '', ...props }) {
  const generated = useId();
  const buttonId = id || `select-${generated}`;
  const host = useRef(null);
  const mounted = useRef(null);
  const settings = useSettings();
  const { t } = useLang();
  const menuHeight = settings['ui.menuHeight'];
  const menuWidth = settings['ui.menuWidth'];
  const attributes = JSON.stringify(
    Object.entries(props).filter(([key, val]) => (key.startsWith('aria-') || key.startsWith('data-')) && val != null),
  );
  const options = JSON.stringify(
    Children.toArray(children)
      .filter(Boolean)
      .map((child) => ({
        value: String(child.props.value),
        label: Children.toArray(child.props.children).join(''),
        disabled: !!child.props.disabled,
      })),
  );
  useLayoutEffect(() => {
    const source = formatLinks([
      {
        id: buttonId,
        values: [
          'select',
          ['label', ''],
          ...JSON.parse(options).map((option, i) => ({
            id: `${buttonId}-${i}`,
            values: [
              'option',
              option.label,
              ['value', option.value],
              ...(option.disabled ? [['disabled', 'true']] : []),
            ],
          })),
        ],
      },
    ]);
    const handle = mountControls(host.current, source);
    mounted.current = handle;
    const button = host.current.querySelector('button');
    const list = host.current.querySelector('[data-part="listbox"]');
    button.id = buttonId;
    button.removeAttribute('aria-labelledby');
    list.className = 'ui-select__list';
    list.removeAttribute('aria-labelledby');
    // The upstream positioner flips but does not resize a menu to available
    // vertical space. Size before it measures, including on viewport resize.
    const fitMenu = () => {
      const { top, bottom } = button.getBoundingClientRect();
      const available = Math.max(0, top - 12, window.innerHeight - bottom - 12);
      list.style.maxHeight = `min(var(--menu-height), ${available}px)`;
    };
    const onToggle = (event) => {
      if (event.newState === 'open') {
        fitMenu();
        window.addEventListener('resize', fitMenu);
      } else window.removeEventListener('resize', fitMenu);
    };
    const key = (key) => button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    const onKey = (event) => {
      fitMenu();
      if (button.getAttribute('aria-expanded') !== 'true') return;
      if (event.key === 'Tab') key('Enter');
      if (event.key === 'PageDown' || event.key === 'PageUp') {
        event.preventDefault();
        event.stopImmediatePropagation();
        for (let i = 0; i < 10; i++) key(event.key === 'PageDown' ? 'ArrowDown' : 'ArrowUp');
      }
    };
    const outside = (event) => {
      if (button.getAttribute('aria-expanded') !== 'true') return;
      if (!button.contains(event.target) && !list.contains(event.target)) key('Escape');
    };
    const focus = () => {
      fitMenu();
      button.focus({ preventScroll: true });
    };
    const preventDisabled = (event) => {
      if (event.target.closest('[role="option"]')?.getAttribute('aria-disabled') === 'true') {
        event.stopImmediatePropagation();
      }
    };
    list.addEventListener('click', preventDisabled, true);
    list.addEventListener('toggle', onToggle);
    button.addEventListener('click', focus, true);
    button.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      button.removeEventListener('click', focus, true);
      button.removeEventListener('keydown', onKey, true);
      list.removeEventListener('click', preventDisabled, true);
      list.removeEventListener('toggle', onToggle);
      window.removeEventListener('resize', fitMenu);
      handle.destroy();
      mounted.current = null;
    };
  }, [buttonId, options]);
  useLayoutEffect(() => {
    const { store } = mounted.current;
    store.setProp(buttonId, 'value', [String(value)]);
    store.setProp(buttonId, 'disabled', [String(!!disabled)]);
    if (name) store.setProp(buttonId, 'name', [name]);
    mounted.current.handle.flush();
    const button = host.current.querySelector('button');
    button.className = `ui-select ${className}`;
    button.dataset.value = value;
    for (const [key, val] of JSON.parse(attributes)) button.setAttribute(key, String(val));
    const list = host.current.querySelector('[data-part="listbox"]');
    list.style.setProperty('--menu-height', `${menuHeight}px`);
    list.style.maxHeight = 'min(var(--menu-height), calc(100vh - 16px))';
    list.style.minWidth = `min(${menuWidth}px, calc(100vw - 16px))`;
    list.style.maxWidth = 'calc(100vw - 16px)';
  }, [buttonId, options, value, disabled, name, className, attributes, menuHeight, menuWidth]);
  useLayoutEffect(() => {
    const button = host.current.querySelector('button');
    // Keep the host's existing labels; hidden framework options are not part
    // of the enclosing label's text, and the list has its own accessible name.
    const label = button.labels?.[0]?.cloneNode(true);
    label?.querySelectorAll('.framework-control').forEach((node) => node.remove());
    const labelText = props['aria-label'] || label?.textContent.trim();
    if (labelText && button.getAttribute('aria-label') !== labelText) button.setAttribute('aria-label', labelText);
    const list = host.current.querySelector('[data-part="listbox"]');
    const listName = `${t(localized('selectOptions'))}${labelText ? `: ${labelText}` : ''}`;
    if (list.getAttribute('aria-label') !== listName) list.setAttribute('aria-label', listName);
    const change = (event) => {
      if (event.detail.value === String(value)) return;
      const target = { value: event.detail.value, name };
      // This native framework event runs outside React's discrete event
      // system. Commit before returning, like the original React click did.
      flushSync(() => onChange?.({ target, currentTarget: target }));
      cue('select');
    };
    const element = host.current;
    element.addEventListener('ui-change', change);
    return () => element.removeEventListener('ui-change', change);
  });
  return <span className="framework-control" ref={host} />;
}
