import { Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#344054', // Dark slate gray
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1E293B', // Slightly darker tone for accents
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
      color: '#344054',
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1E293B',
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
          borderRadius: '8px', // Smooth button edges
          textTransform: 'none', // No uppercase for a polished appearance
          '&.Mui-disabled': {
            // This applies to all buttons, so if needed, you can adjust here too.
            cursor: 'default',
          },
        },
        // Overrides for contained buttons remain unchanged.
        containedPrimary: {
          backgroundImage: 'linear-gradient(135deg, #344054, #1E293B)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #2C3A48, #172235)',
          },
          '&.Mui-disabled': {
            backgroundImage: 'linear-gradient(135deg, #6c757d, #5a6268)',
            cursor: 'default',
          },
        },
        containedSecondary: {
          backgroundImage: 'linear-gradient(135deg, #FF8A65, #FF7043)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #FF7043, #FF5733)',
          },
          '&.Mui-disabled': {
            backgroundImage: 'linear-gradient(135deg, #6c757d, #5a6268)',
            cursor: 'default',
          },
        },
        containedSuccess: {
          backgroundImage: 'linear-gradient(135deg, #2ecc71, #27ae60)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #27ae60, #1e8449)',
          },
          '&.Mui-disabled': {
            backgroundImage: 'linear-gradient(135deg, #6c757d, #5a6268)',
            cursor: 'default',
          },
        },
        containedInfo: {
          backgroundImage: 'linear-gradient(135deg, #3498db, #2980b9)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #2980b9, #2471a3)',
          },
          '&.Mui-disabled': {
            backgroundImage: 'linear-gradient(135deg, #6c757d, #5a6268)',
            cursor: 'default',
          },
        },
      },
      // Define variants for outlined buttons for both primary and secondary
      variants: [
        {
          props: { variant: 'outlined', color: 'primary' },
          style: {
            color: '#344054', // Matches primary main
            backgroundImage: 'linear-gradient(135deg, #344054, #1E293B)',
            '&:hover': {
              backgroundImage: 'linear-gradient(135deg, #2C3A48, #172235)',
            },
            '&.Mui-disabled': {
              backgroundImage: 'linear-gradient(135deg, #6c757d, #5a6268)',
              color: '#344054', // Force text color to primary
              opacity: 1, // Ensure full opacity for text visibility
              cursor: 'default',
              WebkitTextFillColor: '#344054', // Ensures text is visible in Webkit browsers
              WebkitBackgroundClip: 'initial',
              backgroundClip: 'initial',
            },
          },
        },
        {
          props: { variant: 'outlined', color: 'secondary' },
          style: {
            color: '#1E293B', // Matches secondary main
            backgroundImage: 'linear-gradient(135deg, #FF8A65, #FF7043)', // Same gradient as containedSecondary
            '&:hover': {
              backgroundImage: 'linear-gradient(135deg, #FF7043, #FF5733)',
            },
            '&.Mui-disabled': {
              backgroundImage: 'linear-gradient(135deg, #6c757d, #5a6268)',
              color: '#1E293B', // Force text color to secondary
              opacity: 1, // Ensure full opacity for text visibility
              cursor: 'default',
              WebkitTextFillColor: '#1E293B',
              WebkitBackgroundClip: 'initial',
              backgroundClip: 'initial',
            },
          },
        },
      ],
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #344054, #1E293B)', // Gradient for the AppBar
          color: '#ffffff',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: '#4A5568', // Neutral gray for inactive steps
          '&.Mui-active': {
            color: '#344054', // Primary color for active steps
          },
        },
      },
    },
  },
});

export default theme;
