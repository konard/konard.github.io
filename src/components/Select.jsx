import { Children, useId, useLayoutEffect, useRef } from 'react';
import { mountControls } from '@link-foundation/ui-components/controls';
import { formatLinks } from '@link-foundation/ui-core';
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
  const menuHeight = settings['ui.menuHeight'];
  const menuWidth = settings['ui.menuWidth'];
  const options = JSON.stringify(
    Children.toArray(children)
      .filter(Boolean)
      .map((child) => ({
        value: String(child.props.value),
        label: String(child.props.children),
        disabled: !!child.props.disabled,
      })),
  );
  useLayoutEffect(() => {
    const source = formatLinks([
      {
        id: buttonId,
        values: [
          'select',
          ['label', 'Selection'],
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
    list.setAttribute('aria-labelledby', buttonId);
    const key = (key) => button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    const onKey = (event) => {
      if (button.getAttribute('aria-expanded') !== 'true') return;
      if (event.key === 'Tab') key('Enter');
      if (event.key === 'PageDown' || event.key === 'PageUp') {
        event.preventDefault();
        event.stopImmediatePropagation();
        for (let i = 0; i < 10; i++) key(event.key === 'PageDown' ? 'ArrowDown' : 'ArrowUp');
      }
    };
    const outside = (event) => {
      if (!button.contains(event.target) && !list.contains(event.target)) key('Escape');
    };
    const focus = () => button.focus({ preventScroll: true });
    const preventDisabled = (event) => {
      if (event.target.closest('[role="option"]')?.getAttribute('aria-disabled') === 'true') {
        event.stopImmediatePropagation();
      }
    };
    list.addEventListener('click', preventDisabled, true);
    button.addEventListener('click', focus, true);
    button.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      button.removeEventListener('click', focus, true);
      button.removeEventListener('keydown', onKey, true);
      list.removeEventListener('click', preventDisabled, true);
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
    for (const [key, val] of Object.entries(props)) {
      if ((key.startsWith('aria-') || key.startsWith('data-')) && val != null) button.setAttribute(key, String(val));
    }
    const list = host.current.querySelector('[data-part="listbox"]');
    list.style.maxHeight = `${menuHeight}px`;
    list.style.minWidth = `min(${menuWidth}px, calc(100vw - 16px))`;
    list.style.maxWidth = 'calc(100vw - 16px)';
    const change = (event) => {
      if (event.detail.value === String(value)) return;
      const target = { value: event.detail.value, name };
      onChange?.({ target, currentTarget: target });
      cue('select');
    };
    const element = host.current;
    element.addEventListener('ui-change', change);
    return () => element.removeEventListener('ui-change', change);
  });
  return <span className="framework-control" ref={host} />;
}
