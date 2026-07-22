import { Prompt } from 'next/font/google';
import { createTheme } from '@mui/material/styles';

export const appFont = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Backwards-compatible alias (consumed in _document.tsx)
export const roboto = appFont;

// ---------------------------------------------------------------------------
// Brand tokens — derived from the Pupscribe Brand Book, muted for screen use.
// Primary pair: Bark Blue (actions) + Hello Yellow (highlights).
// Secondary: Pupscribe Pink (margins, links, illustrations, wordmark).
// Dark mode is a deep violet, not near-black.
// ---------------------------------------------------------------------------
export const brand = {
  blue: '#4633B8',
  blueDark: '#37279C',
  blueLight: '#6A5AD1',
  yellow: '#E4CD2E',
  yellowSoft: '#F8F1C9',
  yellowInk: '#6B5D00',
  pink: '#C2417F',
  pinkDark: '#A22F68',
  pinkSoft: '#F9E7F1',
  ink: '#1C1A33',
  ground: '#F9F8FD',
  hairline: '#E8E4F2',
  muted: '#837E96',
  faint: '#B9B3CB',
  // dark mode
  dkGround: '#191536',
  dkSurface: '#221E48',
  dkInk: '#F1EEFF',
  dkMuted: '#A79ED2',
  dkFaint: '#6F67A0',
  dkLine: 'rgba(158,142,255,0.22)',
  dkBlue: '#A796FF',
  dkBlueStrong: '#BCAFFF',
  dkBlueDeep: '#8D7BF2',
  dkOnBlue: '#1C163E',
  dkYellow: '#EFD84A',
  dkPink: '#E88BC0',
} as const;

// Softer, modern elevation ramp (replaces MUI's harsh defaults).
const buildShadows = (mode: 'dark' | 'light') => {
  const c = mode === 'dark' ? '10,6,32' : '70,51,184';
  const a = mode === 'dark' ? 0.55 : 0.1;
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
      h1: { fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.15 },
      h2: { fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.18 },
      h3: { fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 },
      h4: { fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.25 },
      h5: { fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.3 },
      h6: { fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.35 },
      subtitle1: { fontWeight: 500, lineHeight: 1.4 },
      subtitle2: { fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: '0.95rem', lineHeight: 1.55 },
      body2: { fontSize: '0.85rem', lineHeight: 1.5 },
      caption: { fontSize: '0.72rem', lineHeight: 1.4 },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
    },
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? brand.dkBlue : brand.blue,
        light: mode === 'dark' ? brand.dkBlueStrong : brand.blueLight,
        dark: mode === 'dark' ? brand.dkBlueDeep : brand.blueDark,
        contrastText: mode === 'dark' ? brand.dkOnBlue : '#ffffff',
      },
      secondary: {
        main: mode === 'dark' ? brand.dkPink : brand.pink,
        light: mode === 'dark' ? '#F2A9D2' : '#D06A9C',
        dark: mode === 'dark' ? '#D06AA6' : brand.pinkDark,
        contrastText: mode === 'dark' ? brand.dkOnBlue : '#ffffff',
      },
      success: {
        main: mode === 'dark' ? '#8FD3A6' : '#2E7D48',
        dark: mode === 'dark' ? '#5FA97B' : '#1F5A33',
        contrastText: mode === 'dark' ? brand.dkOnBlue : '#ffffff',
      },
      info: {
        main: mode === 'dark' ? brand.dkBlue : brand.blue,
        dark: mode === 'dark' ? brand.dkBlueDeep : brand.blueDark,
        contrastText: mode === 'dark' ? brand.dkOnBlue : '#ffffff',
      },
      warning: {
        main: mode === 'dark' ? brand.dkYellow : '#C9A821',
        dark: mode === 'dark' ? '#CDB52E' : '#9A7F12',
        contrastText: mode === 'dark' ? brand.dkOnBlue : '#ffffff',
      },
      error: {
        main: mode === 'dark' ? '#F08A8A' : '#C94444',
        dark: mode === 'dark' ? '#D96A6A' : '#A93232',
        contrastText: mode === 'dark' ? brand.dkOnBlue : '#ffffff',
      },
      divider: mode === 'dark' ? brand.dkLine : brand.hairline,
      ...(mode === 'dark' && {
        background: {
          default: brand.dkGround,
          paper: brand.dkSurface,
        },
        text: {
          primary: brand.dkInk,
          secondary: brand.dkMuted,
        },
      }),
      ...(mode === 'light' && {
        background: {
          default: brand.ground,
          paper: '#ffffff',
        },
        text: {
          primary: brand.ink,
          secondary: brand.muted,
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
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow: 'none',
            '&:hover': {
              boxShadow:
                mode === 'dark'
                  ? '0 8px 22px -8px rgba(167,150,255,0.5)'
                  : '0 8px 20px -8px rgba(70,51,184,0.45)',
            },
            '&.Mui-disabled': {
              color: mode === 'dark' ? brand.dkFaint : '#9A94AC',
              backgroundColor: mode === 'dark' ? 'rgba(158,142,255,0.12)' : '#EBE8F3',
            },
          },
          containedPrimary: {
            boxShadow:
              mode === 'dark'
                ? '0 8px 22px -8px rgba(167,150,255,0.45)'
                : '0 8px 20px -8px rgba(70,51,184,0.4)',
            '&:hover': {
              backgroundColor: mode === 'dark' ? brand.dkBlueStrong : brand.blueDark,
            },
          },
          containedSecondary: {
            boxShadow:
              mode === 'dark'
                ? '0 8px 22px -8px rgba(232,139,192,0.4)'
                : '0 8px 20px -8px rgba(194,65,127,0.35)',
            '&:hover': {
              backgroundColor: mode === 'dark' ? '#F2A9D2' : brand.pinkDark,
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor:
                mode === 'dark' ? 'rgba(167,150,255,0.1)' : 'rgba(70,51,184,0.05)',
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: mode === 'dark' ? '#2A2557' : '#EFEBF7',
              color: mode === 'dark' ? brand.dkInk : brand.ink,
              fontWeight: 600,
              borderBottomColor: mode === 'dark' ? brand.dkLine : brand.hairline,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? brand.dkInk : brand.ink,
            borderColor: mode === 'dark' ? brand.dkLine : brand.hairline,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor:
                mode === 'dark' ? 'rgba(167,150,255,0.06)' : 'rgba(70,51,184,0.04)',
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
            border:
              mode === 'dark'
                ? `1px solid ${brand.dkLine}`
                : `1px solid ${brand.hairline}`,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? brand.dkInk : brand.ink,
          },
          input: {
            '&::placeholder': {
              color: mode === 'dark' ? brand.dkFaint : brand.faint,
              opacity: 1,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? brand.dkLine : '#DDD8EA',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? brand.dkBlue : brand.blueLight,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? brand.dkMuted : brand.muted,
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: mode === 'dark' ? brand.dkMuted : brand.muted,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? brand.dkInk : brand.ink,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            color: mode === 'dark' ? brand.dkInk : brand.ink,
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(158,142,255,0.14)',
            }),
          },
          colorPrimary: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(167,150,255,0.2)',
              color: brand.dkBlueStrong,
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': { color: '#ffffff' },
            }),
          },
          colorSecondary: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(232,139,192,0.18)',
              color: brand.dkPink,
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': {
                backgroundColor: brand.pinkSoft,
                color: brand.pink,
              },
            }),
          },
          colorSuccess: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(143,211,166,0.18)',
              color: '#8FD3A6',
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': {
                backgroundColor: '#E4F2E9',
                color: '#2E7D48',
              },
            }),
          },
          colorWarning: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(239,216,74,0.16)',
              color: brand.dkYellow,
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': {
                backgroundColor: brand.yellowSoft,
                color: brand.yellowInk,
              },
            }),
          },
          colorError: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(240,138,138,0.18)',
              color: '#F08A8A',
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': { color: '#ffffff' },
            }),
          },
          colorInfo: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(167,150,255,0.2)',
              color: brand.dkBlueStrong,
            }),
            ...(mode === 'light' && {
              '&:not(.MuiChip-outlined)': { color: '#ffffff' },
            }),
          },
          outlined: {
            ...(mode === 'dark' && {
              backgroundColor: 'transparent',
              borderColor: brand.dkLine,
            }),
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: mode === 'dark' ? brand.dkLine : brand.hairline,
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
              backgroundColor:
                mode === 'dark' ? 'rgba(167,150,255,0.06)' : 'rgba(70,51,184,0.04)',
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor:
                mode === 'dark' ? 'rgba(167,150,255,0.1)' : 'rgba(70,51,184,0.06)',
            },
            '&.Mui-selected': {
              backgroundColor:
                mode === 'dark' ? 'rgba(167,150,255,0.18)' : 'rgba(70,51,184,0.1)',
              '&:hover': {
                backgroundColor:
                  mode === 'dark' ? 'rgba(167,150,255,0.26)' : 'rgba(70,51,184,0.15)',
              },
            },
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            '& .MuiTableRow-root:hover': {
              backgroundColor:
                mode === 'dark' ? 'rgba(167,150,255,0.06)' : 'rgba(70,51,184,0.04)',
            },
            '& .MuiTableRow-hover:hover': {
              backgroundColor:
                mode === 'dark' ? 'rgba(167,150,255,0.06)' : 'rgba(70,51,184,0.04)',
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
