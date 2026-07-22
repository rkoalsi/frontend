import { createContext, useContext, useState, useEffect } from 'react';

type ColorMode = 'dark' | 'light';

interface ColorModeContextType {
  mode: ColorMode;
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

export const ColorModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ColorMode>('light');

  useEffect(() => {
    // Explicit user choice (via the toggle) always wins; otherwise follow the
    // OS preference, defaulting to light when it can't be read.
    const saved = localStorage.getItem('colorMode') as ColorMode | null;
    if (saved === 'light' || saved === 'dark') {
      setMode(saved);
      return;
    }

    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mql) return;
    setMode(mql.matches ? 'dark' : 'light');

    // Track live OS theme changes until the user picks a mode themselves.
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('colorMode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const toggleColorMode = () => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('colorMode', next);
      return next;
    });
  };

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      {children}
    </ColorModeContext.Provider>
  );
};

export const useColorMode = () => useContext(ColorModeContext);
