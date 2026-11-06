import { useEffect, useState } from 'react';

/** Paramètres d'adresse partagés entre pages : une sous-page a sa propre adresse et le bouton retour du navigateur fonctionne. */
const listeners = new Set<() => void>();

export function setQueryParams(params: Record<string, string | null>, options: { replace?: boolean } = {}) {
  const url = new URL(window.location.href);
  for (const [name, value] of Object.entries(params)) {
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
  }
  url.hash = '';
  if (url.toString() !== window.location.href) {
    window.history[options.replace ? 'replaceState' : 'pushState'](null, '', url.toString());
  }
  listeners.forEach((listener) => listener());
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

export function useQueryParam(name: string): string | null {
  const read = () => new URLSearchParams(window.location.search).get(name);
  const [value, setValue] = useState(read);
  useEffect(() => {
    const update = () => setValue(read());
    listeners.add(update);
    window.addEventListener('popstate', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('popstate', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  return value;
}
