import { createContext, useContext, useState, useEffect } from 'react';

type ColorMode = 'dark' | 'light';

interface ColorModeContextType {
  mode: ColorMode;
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'dark',
  toggleColorMode: () => {},
});

export const ColorModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ColorMode>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('colorMode') as ColorMode | null;
    if (saved === 'light' || saved === 'dark') {
      setMode(saved);
    }
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
