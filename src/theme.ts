import { Inter } from 'next/font/google';
import { createTheme } from '@mui/material/styles';

export const appFont = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Backwards-compatible alias (consumed in _document.tsx)
export const roboto = appFont;

// Softer, modern elevation ramp (replaces MUI's harsh defaults).
const buildShadows = (mode: 'dark' | 'light') => {
  const c = mode === 'dark' ? '0,0,0' : '16,24,40';
  const a = mode === 'dark' ? 1 : 0.08;
  const base = [
    'none',
    `0 1px 2px rgba(${c},${a})`,
    `0 1px 3px rgba(${c},${a}), 0 1px 2px rgba(${c},${a * 0.6})`,
    `0 2px 4px rgba(${c},${a}), 0 1px 6px rgba(${c},${a * 0.5})`,
    `0 4px 8px rgba(${c},${a}), 0 2px 4px rgba(${c},${a * 0.5})`,
    `0 6px 12px rgba(${c},${a}), 0 2px 6px rgba(${c},${a * 0.5})`,
    `0 8px 18px rgba(${c},${a}), 0 4px 8px rgba(${c},${a * 0.4})`,
    `0 12px 24px rgba(${c},${a}), 0 4px 10px rgba(${c},${a * 0.4})`,
  ];
  // Fill the remaining MUI slots (up to 25) by reusing the strongest tier.
  while (base.length < 25) base.push(base[base.length - 1]);
  return base as unknown as import('@mui/material/styles').Shadows;
};

export const createAppTheme = (mode: 'dark' | 'light') =>
  createTheme({
    shape: { borderRadius: 12 },
    shadows: buildShadows(mode),
    typography: {
      fontFamily: appFont.style.fontFamily,
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.015em' },
      h4: { fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
    },
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#7c6fcd' : '#2a4a6b',
        light: mode === 'dark' ? '#9c92d8' : '#456089',
        dark: mode === 'dark' ? '#5e52b5' : '#192d45',
        contrastText: '#ffffff',
      },
      secondary: {
        main: mode === 'dark' ? '#9a85c9' : '#614998',
        light: mode === 'dark' ? '#b09ed8' : '#7d63be',
        dark: mode === 'dark' ? '#7a64a8' : '#4a3380',
        contrastText: '#ffffff',
      },
      success: {
        main: mode === 'dark' ? '#66bb6a' : '#4CAF50',
        dark: mode === 'dark' ? '#388E3C' : '#388E3C',
        contrastText: '#ffffff',
      },
      info: {
        main: mode === 'dark' ? '#64b5f6' : '#4E8098',
        dark: mode === 'dark' ? '#3B6374' : '#3B6374',
        contrastText: '#ffffff',
      },
      warning: {
        main: mode === 'dark' ? '#ffb74d' : '#C1A57B',
        dark: mode === 'dark' ? '#A78C69' : '#A78C69',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      error: {
        main: '#D9534F',
        dark: '#B93C3A',
        contrastText: '#ffffff',
      },
      ...(mode === 'dark' && {
        background: {
          default: '#0d1b2a',
          paper: '#132337',
        },
        text: {
          primary: 'rgba(255,255,255,0.92)',
          secondary: 'rgba(255,255,255,0.6)',
        },
      }),
      ...(mode === 'light' && {
        background: {
          default: '#f5f5f5',
          paper: '#ffffff',
        },
        text: {
          primary: 'rgba(0,0,0,0.87)',
          secondary: 'rgba(0,0,0,0.55)',
        },
      }),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { scrollBehavior: 'smooth' },
          '*': { scrollBehavior: 'smooth' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.02em',
            boxShadow: mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: mode === 'dark' ? '0 4px 16px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.2)',
            },
            '&.Mui-disabled': {
              color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#5A6978',
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#D0D5DD',
            },
          },
          containedPrimary: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, #7c6fcd, #5e52b5)'
              : 'linear-gradient(135deg, #2a4a6b, #192d45)',
            '&:hover': {
              backgroundImage: mode === 'dark'
                ? 'linear-gradient(135deg, #9c92d8, #7c6fcd)'
                : 'linear-gradient(135deg, #1e3a58, #111f30)',
            },
          },
          containedSecondary: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, #9a85c9, #7a64a8)'
              : 'linear-gradient(135deg, #614998, #4a3380)',
            '&:hover': {
              backgroundImage: mode === 'dark'
                ? 'linear-gradient(135deg, #b09ed8, #9a85c9)'
                : 'linear-gradient(135deg, #4a3380, #38266a)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: mode === 'dark' ? '#1c3452' : '#e4e8ed',
              color: mode === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.87)',
              fontWeight: 700,
              borderBottomColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 16,
            border: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(16,24,40,0.06)',
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
          },
          input: {
            '&::placeholder': {
              color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              opacity: 1,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(255,255,255,0.12)',
            }),
          },
          colorPrimary: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(124,111,205,0.25)',
              color: '#9c92d8',
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': { color: '#ffffff' },
            }),
          },
          colorSecondary: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(154,133,201,0.25)',
              color: '#b09ed8',
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': { color: '#ffffff' },
            }),
          },
          colorSuccess: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(102,187,106,0.2)',
              color: '#81c784',
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': { color: '#ffffff' },
            }),
          },
          colorWarning: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(255,183,77,0.2)',
              color: '#ffcc80',
            }),
          },
          colorError: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(217,83,79,0.2)',
              color: '#ef9a9a',
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': { color: '#ffffff' },
            }),
          },
          colorInfo: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(100,181,246,0.2)',
              color: '#90caf9',
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': { color: '#ffffff' },
            }),
          },
          outlined: {
            ...(mode === 'dark' && {
              backgroundColor: 'transparent',
              borderColor: 'rgba(255,255,255,0.3)',
            }),
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
            '&.Mui-selected': {
              backgroundColor: mode === 'dark' ? 'rgba(124,111,205,0.2)' : 'rgba(43,72,100,0.1)',
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(124,111,205,0.3)' : 'rgba(43,72,100,0.15)',
              },
            },
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            '& .MuiTableRow-root:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            },
            '& .MuiTableRow-hover:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

// Default theme for SSR
const theme = createAppTheme('light');
export default theme;
