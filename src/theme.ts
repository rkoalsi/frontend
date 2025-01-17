import { Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Create a theme instance.
const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#3A6073', // Darker primary for better contrast
      contrastText: '#ffffff', // Ensure good contrast for text on primary
    },
    secondary: {
      main: '#2B4864', // Slightly darker secondary
      contrastText: '#ffffff',
    },
    error: {
      main: red.A400,
    },
    text: {
      primary: '#1A1A1A', // Dark primary text
      secondary: '#4A4A4A', // Medium gray for secondary text
      disabled: '#7A7A7A', // Soft gray for disabled text
    },
    background: {
      default: '#F5F7FA', // Light background
      paper: '#ffffff', // Background for cards, dialogs, etc.
    },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
    allVariants: {
      color: '#1A1A1A', // Default text color for all variants
    },
  },
  components: {
    MuiAutocomplete: {
      styleOverrides: {
        inputRoot: {
          color: '#1A1A1A', // Darker text in input fields
        },
        paper: {
          backgroundColor: '#ffffff',
          color: '#1A1A1A',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: '#4A4A4A', // Darker text for inactive steps
          '&.Mui-active': {
            color: '#3A6073', // Primary color for active step
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#1A1A1A', // Dark text globally
        },
      },
    },
  },
});

export default theme;
