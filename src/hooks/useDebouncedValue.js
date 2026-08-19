import { useEffect, useState } from "react";

// Devuelve `value`, pero recién actualizado `delayMs` después de que dejó de
// cambiar — para no pegarle a una API externa en cada tecla que se tipea.
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
