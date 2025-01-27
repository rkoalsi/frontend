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
      main: '#344054', // Dark slate gray for excellent contrast with the gradient background
      contrastText: '#ffffff', // White text for readability
    },
    secondary: {
      main: '#1E293B', // Slightly darker tone for accents and balance
      contrastText: '#ffffff',
    },

    error: {
      main: red.A400,
    },
    text: {
      primary: '#1A1A1A', // High-contrast dark text
      secondary: '#4A5568', // Neutral gray for secondary text
      disabled: '#A0AEC0', // Light gray for disabled text
    },
    background: {
      default: '#F7FAFC', // Light, professional background
      paper: '#ffffff', // White background for cards and dialogs
    },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
    allVariants: {
      color: '#1A1A1A', // High-contrast default text color
    },
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#344054', // Dark slate gray for main headings
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1E293B', // Complementary color for subheadings
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      color: '#1A1A1A',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // Smooth button edges for a modern look
          textTransform: 'none', // No uppercase for a polished appearance
        },
        containedPrimary: {
          backgroundColor: '#344054', // Dark slate gray for primary buttons
          '&:hover': {
            backgroundColor: '#2C3A48', // Slightly darker on hover
          },
        },
        containedSecondary: {
          backgroundColor: '#FF8A65', // Coral-orange for homepage-specific actions
          '&:hover': {
            backgroundColor: '#FF7043', // Deeper coral for hover effect
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #344054, #1E293B)', // New gradient with darker tones for clarity
          color: '#ffffff',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: '#4A5568', // Neutral gray for inactive steps
          '&.Mui-active': {
            color: '#344054', // Use primary color for active steps
          },
        },
      },
    },
  },
});

export default theme;
