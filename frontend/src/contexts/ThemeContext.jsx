import { useEffect } from 'react';

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    localStorage.removeItem('theme');
  }, []);

  return children;
}
