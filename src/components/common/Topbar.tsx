import React from 'react';
import { Box, Button, IconButton, Tooltip, Typography, useScrollTrigger } from '@mui/material';

/**
 * Shared topbar language for every layout (Layout / AdminLayout / CustomerLayout).
 *
 * The bar keeps the app's deep purple in both colour modes; the brand book shows
 * up as the rounded-triangle mark (the dog/cat ear motif, replacing the generic
 * icon tile) and a thin pink→yellow hairline, so the palette reads as Pupscribe
 * without repainting the whole bar.
 */

export const BRAND_PINK_SOFT = '#E88BC0';
export const BRAND_YELLOW = '#EDD100';
/** Dark-mode hairline — matches `brand.dkBlue`, the theme's dark accent. */
const HAIRLINE_DARK = '#A796FF';

/** Kept in sync with the spacer/offset each layout uses under a fixed AppBar. */
export const TOPBAR_HEIGHT = { xs: 56, sm: 64 } as const;

/** True once the page has scrolled off the top — used to lift the bar. */
export const useTopbarScrolled = () =>
  useScrollTrigger({ disableHysteresis: true, threshold: 8 });

/** AppBar sx — solid app purple, lifting on scroll, closed by an accent hairline. */
export const topbarSx = (scrolled = false) =>
  ({
    zIndex: (t: any) => t.zIndex.drawer + 100,
    color: '#fff',
    // Solid app purple. Translucency was tried and dropped — over a light page
    // the white showing through desaturates #191536 into a grey-purple.
    backgroundColor: scrolled ? '#151130' : '#191536',
    boxShadow: scrolled ? '0 6px 24px rgba(10,6,32,0.38)' : 'none',
    transition: 'box-shadow .25s ease, background-color .25s ease',
    // Accent hairline. Hello Yellow is the warm neutral edge in light mode; in
    // dark mode it switches to the theme's periwinkle blue, which sits better
    // against a dark page than a bright yellow line does.
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '2px',
      backgroundColor: (t: any) => (t.palette.mode === 'dark' ? HAIRLINE_DARK : BRAND_YELLOW),
      opacity: 0.7,
    },
  }) as const;

export const topbarToolbarSx = {
  gap: 1,
  justifyContent: 'space-between',
  minHeight: TOPBAR_HEIGHT,
  px: { xs: 1.25, sm: 2, md: 3 },
} as const;

const focusRing = {
  '&:focus-visible': {
    outline: `2px solid ${BRAND_YELLOW}`,
    outlineOffset: '2px',
  },
} as const;

/** Ghost icon button — theme toggle, notifications, compact actions. */
export const topbarIconSx = {
  color: 'rgba(255,255,255,0.82)',
  backgroundColor: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '10px',
  transition: 'background-color .18s ease, color .18s ease, transform .18s ease',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.16)',
    color: '#fff',
    transform: 'translateY(-1px)',
  },
  ...focusRing,
} as const;

/** Ghost pill — the labelled twin of `topbarIconSx`. */
export const topbarPillSx = {
  ...topbarIconSx,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.85rem',
  px: 1.5,
  py: 0.6,
  boxShadow: 'none',
  whiteSpace: 'nowrap',
  '& .MuiButton-startIcon': { mr: 0.6 },
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.16)',
    color: '#fff',
    borderColor: 'rgba(255,255,255,0.22)',
    boxShadow: 'none',
    transform: 'translateY(-1px)',
  },
} as const;

/** Logout / destructive icon button. */
export const topbarDangerIconSx = {
  ...topbarIconSx,
  color: 'rgba(255,255,255,0.72)',
  backgroundColor: 'rgba(217,83,79,0.14)',
  borderColor: 'rgba(217,83,79,0.24)',
  '&:hover': {
    backgroundColor: 'rgba(217,83,79,0.28)',
    color: '#ff8f8f',
    transform: 'translateY(-1px)',
  },
} as const;

export const topbarDividerSx = {
  borderColor: 'rgba(255,255,255,0.12)',
  mx: { xs: 0.25, sm: 0.5 },
  my: 1.25,
} as const;

/**
 * One action that renders as a labelled pill on wide screens and collapses to a
 * tooltipped icon when space is tight.
 */
export const TopbarAction: React.FC<{
  icon: React.ReactElement;
  label: string;
  onClick: () => void;
  /** Collapse to an icon-only button (mobile / tablet). */
  compact?: boolean;
}> = ({ icon, label, onClick, compact = false }) =>
  compact ? (
    <Tooltip title={label} arrow>
      <IconButton onClick={onClick} size='small' aria-label={label} sx={topbarIconSx}>
        {icon}
      </IconButton>
    </Tooltip>
  ) : (
    <Button size='small' onClick={onClick} startIcon={icon} sx={topbarPillSx}>
      {label}
    </Button>
  );

/**
 * The Pupscribe P-mark (dog silhouette in the P) — a 96px PNG on the CDN. The
 * source favicon.ico is 264 KB, far too heavy to ship for a 34px logo.
 */
// Served with a 1-year immutable cache, so the filename carries the version:
// to change the artwork, upload a new `-vN` key rather than overwriting this one
// (browsers holding an immutable copy never revalidate, and a CloudFront
// invalidation cannot reach them).
export const BRAND_MARK_SRC = 'https://assets.pupscribe.in/branding/P-v2.png';

export const BrandMark: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <Box
    component='img'
    src={BRAND_MARK_SRC}
    alt=''
    aria-hidden
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      display: 'block',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
    }}
  />
);

/** @deprecated Older name from when the mark was a drawn triangle. */
export const BrandTriangle = BrandMark;

/**
 * Brand mark + wordmark + section descriptor. Truncates rather than pushing the
 * action cluster off a narrow screen.
 */
export const BrandLockup: React.FC<{
  /** Section label under the wordmark — "Marketplace", "Admin", … */
  descriptor?: string;
  onClick?: () => void;
}> = ({ descriptor, onClick }) => (
  <Box
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: { xs: 1, sm: 1.25 },
      minWidth: 0,
      cursor: onClick ? 'pointer' : 'default',
      userSelect: 'none',
      borderRadius: '10px',
      ...focusRing,
    }}
  >
    <BrandMark size={34} />
    <Box sx={{ minWidth: 0 }}>
      <Typography
        noWrap
        sx={{
          color: '#fff',
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.015em',
          fontSize: { xs: '0.98rem', sm: '1.08rem' },
        }}
      >
        Pupscribe
      </Typography>
      {descriptor && (
        <Typography
          noWrap
          sx={{
            color: BRAND_PINK_SOFT,
            lineHeight: 1,
            fontSize: { xs: '0.6rem', sm: '0.64rem' },
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {descriptor}
        </Typography>
      )}
    </Box>
  </Box>
);
