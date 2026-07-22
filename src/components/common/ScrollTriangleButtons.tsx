// Minimal scroll-to-top/bottom buttons — quiet paper circles with a hairline
// border; the arrow picks up the primary color only on hover.
// Shared by the order form Products and Review steps. Render inside a
// position:fixed container; this component only draws the two buttons.
import React from 'react';
import { IconButton } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

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
  const common = {
    width: 44,
    height: 44,
    bgcolor: 'background.paper',
    color: 'primary.main',
    border: '1.5px solid',
    borderColor: 'primary.main',
    boxShadow: '0 2px 10px rgba(28,26,51,0.16)',
    '&:hover:not(:disabled)': {
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      borderColor: 'primary.main',
    },
    '&:active:not(:disabled)': {
      transform: isMobile ? 'none' : 'scale(0.95)',
    },
    '&:disabled': {
      bgcolor: 'action.disabledBackground',
      color: 'action.disabled',
      opacity: 0.4,
    },
    transition: 'color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease, opacity 0.15s ease',
    pointerEvents: 'auto' as const,
  };

  return (
    <>
      <IconButton onClick={onScrollTop} disabled={disabled} aria-label='Scroll to top' sx={common}>
        <ArrowUpward sx={{ fontSize: 22, strokeWidth: 1, stroke: 'currentColor' }} />
      </IconButton>
      <IconButton onClick={onScrollBottom} disabled={disabled} aria-label='Scroll to bottom' sx={common}>
        <ArrowDownward sx={{ fontSize: 22, strokeWidth: 1, stroke: 'currentColor' }} />
      </IconButton>
    </>
  );
};

export default ScrollTriangleButtons;
