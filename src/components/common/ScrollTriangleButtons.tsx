// ScrollTriangleButtons.tsx — brand-book triangle scroll buttons (rounded, minimal).
// Shared by the order form Products and Review steps. Render inside a
// position:fixed container; this component only draws the two buttons.
import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

// Rounded-corner triangles via clip-path: path() (polygon() can't round).
// Fixed 54×48 canvas — keep width/height in sync with these paths.
const TRI_UP =
  "path('M 22.8 8.4 Q 27 1 31.2 8.4 L 49.8 38.6 Q 53.5 45 46 45 L 8 45 Q 0.5 45 4.2 38.6 Z')";
const TRI_DOWN =
  "path('M 22.8 37.6 Q 27 45 31.2 37.6 L 49.8 7.4 Q 53.5 1 46 1 L 8 1 Q 0.5 1 4.2 7.4 Z')";

interface ScrollTriangleButtonsProps {
  onScrollTop: () => void;
  onScrollBottom: () => void;
  disabled?: boolean;
  isMobile?: boolean;
}

const ScrollTriangleButtons: React.FC<ScrollTriangleButtonsProps> = ({
  onScrollTop,
  onScrollBottom,
  disabled = false,
  isMobile = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const bg = isDark ? 'rgba(239,216,74,0.92)' : 'rgba(228,205,46,0.92)';
  const bgHover = isDark ? '#F5E06A' : '#EFD84A';

  const common = {
    width: 54,
    height: 48,
    borderRadius: 0,
    backgroundColor: bg,
    color: '#1C1A33',
    filter: 'drop-shadow(0 3px 6px rgba(28,26,51,0.22))',
    '&:disabled': {
      backgroundColor: 'action.disabledBackground',
      color: 'action.disabled',
      opacity: 0.4,
    },
    '&:active:not(:disabled)': {
      transform: isMobile ? 'none' : 'scale3d(0.95, 0.95, 1)',
    },
    transition: 'background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
    pointerEvents: 'auto' as const,
  };

  return (
    <>
      <IconButton
        onClick={onScrollTop}
        disabled={disabled}
        aria-label='Scroll to top'
        sx={{
          ...common,
          clipPath: TRI_UP,
          pt: 1.75,
          '&:hover:not(:disabled)': {
            backgroundColor: bgHover,
            transform: isMobile ? 'none' : 'translate3d(0, -2px, 0)',
          },
        }}
      >
        <ArrowUpward sx={{ fontSize: 18 }} />
      </IconButton>

      <IconButton
        onClick={onScrollBottom}
        disabled={disabled}
        aria-label='Scroll to bottom'
        sx={{
          ...common,
          clipPath: TRI_DOWN,
          pb: 1.75,
          '&:hover:not(:disabled)': {
            backgroundColor: bgHover,
            transform: isMobile ? 'none' : 'translate3d(0, 2px, 0)',
          },
        }}
      >
        <ArrowDownward sx={{ fontSize: 18 }} />
      </IconButton>
    </>
  );
};

export default ScrollTriangleButtons;
