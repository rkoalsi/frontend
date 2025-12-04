import { Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#2B4864', // Deep navy blue
      dark: '#172335',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6B5B95', // Slate Purple - Richer and more professional
      dark: '#554474',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4CAF50', // Keep the elegant green
      dark: '#388E3C',
      contrastText: '#ffffff',
    },
    info: {
      main: '#4E8098', // Deep Teal - Fresh and modern
      dark: '#3B6374',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#C1A57B', // Desert Sand - Warm, luxurious neutral
      dark: '#A78C69',
      contrastText: '#ffffff',
    },
    error: {
      main: '#D9534F', // Slightly muted red for a softer look
      dark: '#B93C3A',
      contrastText: '#ffffff',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
        },
        '*': {
          scrollBehavior: 'smooth',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          textTransform: 'none',
          '&.Mui-disabled': {
            color: '#5A6978',
            backgroundColor: '#D0D5DD',
          },
        },
        containedPrimary: {
          backgroundImage: 'linear-gradient(135deg, #2B4864, #172335)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #1E3850, #101D2B)',
          },
        },
        containedSecondary: {
          backgroundImage: 'linear-gradient(135deg, #6B5B95, #554474)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #554474, #453563)',
          },
        },
      },
    },
  },
});

export default theme;
