// Common responsive padding values for admin pages
export const pagePadding = { xs: 2, sm: 3, md: 3 };
export const paperPadding = { xs: 2, sm: 3, md: 4 };

// Responsive drawer widths
export const drawerWidth = {
  mobile: '100%',
  tablet: 400,
  desktop: 500,
  wide: 600,
};

// Responsive typography variants (for use with sx prop)
export const titleVariant = { xs: 'h5', sm: 'h4' };
export const subtitleVariant = { xs: 'h6', sm: 'h5' };

// Responsive gap values
export const headerGap = { xs: 1, sm: 2 };
export const contentGap = { xs: 2, sm: 3 };

// Responsive flex direction for headers
export const headerFlexDirection = { xs: 'column', sm: 'row' };

// Responsive width utilities
export const fullWidth = '100%';

// Helper function to get responsive drawer width
export const getResponsiveDrawerWidth = (size: 'narrow' | 'medium' | 'wide' = 'medium') => {
  switch (size) {
    case 'narrow':
      return { xs: '100%', sm: 300, md: 300 };
    case 'medium':
      return { xs: '100%', sm: 400, md: 500 };
    case 'wide':
      return { xs: '100%', md: 600, lg: 800 };
    default:
      return { xs: '100%', sm: 400, md: 500 };
  }
};