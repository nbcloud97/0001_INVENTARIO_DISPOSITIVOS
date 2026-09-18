import { useState, useEffect } from 'react';

/**
 * Hook para retrasar (debounce) la actualización de un valor
 * @param value Valor a retrasar (ej: término de búsqueda)
 * @param delay Tiempo en milisegundos (por defecto 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
