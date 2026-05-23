import { Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const createAppTheme = (mode: 'dark' | 'light') =>
  createTheme({
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
            borderRadius: '8px',
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
              color: '#ffffff',
            }),
          },
          colorSecondary: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(154,133,201,0.25)',
              color: '#b09ed8',
            }),
            ...(mode === 'light' && {
              color: '#ffffff',
            }),
          },
          colorSuccess: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(102,187,106,0.2)',
              color: '#81c784',
            }),
            ...(mode === 'light' && {
              color: '#ffffff',
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
              color: '#ffffff',
            }),
          },
          colorInfo: {
            ...(mode === 'dark' && {
              backgroundColor: 'rgba(100,181,246,0.2)',
              color: '#90caf9',
            }),
            ...(mode === 'light' && {
              color: '#ffffff',
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
