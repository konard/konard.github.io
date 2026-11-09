import { Children, useId, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { mountControls } from '@link-foundation/ui-components/controls';
import { formatLinks } from '@link-foundation/ui-core';
import { localized } from '../i18n/localizer';
import { useLang } from '../i18n/prefs';
import { useSettings } from '../settings/store';
import { cue } from '../sound/options';
import '../ui/framework.css';

/** React event/skin adapter; the framework owns rendering and interaction. */
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
          ['external-label', 'true'],
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
    const list = document.getElementById(button.getAttribute('aria-controls'));
    button.id = buttonId;
    list.className = 'ui-select__list';
    return () => {
      handle.destroy();
      mounted.current = null;
    };
  }, [buttonId, options]);
  useLayoutEffect(() => {
    const { store } = mounted.current;
    store.setProp(buttonId, 'value', [String(value)]);
    store.setProp(buttonId, 'disabled', [String(!!disabled)]);
    store.setProp(buttonId, 'menu-min-width', [String(menuWidth)]);
    store.setProp(buttonId, 'menu-max-height', [String(menuHeight)]);
    if (name) store.setProp(buttonId, 'name', [name]);
    for (const [key, val] of JSON.parse(attributes)) {
      if (key === 'aria-label' || key === 'aria-labelledby') store.setProp(buttonId, key, [String(val)]);
    }
    mounted.current.handle.flush();
    const button = host.current.querySelector('button');
    button.className = `ui-select ${className}`;
    button.dataset.value = value;
    for (const [key, val] of JSON.parse(attributes)) button.setAttribute(key, String(val));
  }, [buttonId, options, value, disabled, name, className, attributes, menuHeight, menuWidth]);
  useLayoutEffect(() => {
    const button = host.current.querySelector('button');
    // Keep the host's existing labels; hidden framework options are not part
    // of the enclosing label's text, and the list has its own accessible name.
    const label = button.labels?.[0]?.cloneNode(true);
    label?.querySelectorAll('.framework-control').forEach((node) => node.remove());
    const labelText = props['aria-label'] || label?.textContent.trim();
    const list = document.getElementById(button.getAttribute('aria-controls'));
    const listName = `${t(localized('selectOptions'))}${labelText ? `: ${labelText}` : ''}`;
    const { store, handle } = mounted.current;
    const labelChanged = labelText && button.getAttribute('aria-label') !== labelText;
    const listChanged = list.getAttribute('aria-label') !== listName;
    if (labelChanged) store.setProp(buttonId, 'aria-label', [labelText]);
    if (listChanged) store.setProp(buttonId, 'list-label', [listName]);
    if (labelChanged || listChanged) handle.flush();
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
