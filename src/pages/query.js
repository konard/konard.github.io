import { useCallback, useState } from 'react';
import { replaceAddress } from '../history';

const read = (name) => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(name));

/**
 * State kept in the query string (`?role=ml`, `?field=art`), so filtered views
 * can be linked to and survive reloads. Updates use history.replaceState.
 */
export function useQueryParam(name, fallback = '') {
  const [value, setValue] = useState(() => read(name) ?? fallback);
  const update = useCallback(
    (next) => {
      setValue(next);
      const params = new URLSearchParams(window.location.search);
      if (next === fallback || next === '' || next == null) params.delete(name);
      else params.set(name, next);
      const search = params.toString();
      replaceAddress(`${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`);
    },
    [name, fallback],
  );
  return [value, update];
}
