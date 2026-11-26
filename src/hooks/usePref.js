import { useState } from 'react';

// Layout choices (panels open, split position) are remembered per browser.
export default function usePref(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved ?? initial;
    } catch {
      return initial;
    }
  });
  const set = (next) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };
  return [value, set];
}
