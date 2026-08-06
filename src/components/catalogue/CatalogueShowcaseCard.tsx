import React from 'react';
import { Box, IconButton, Paper, Tooltip, Typography, alpha, styled } from '@mui/material';
import { Check, ContentCopy, OpenInNew, PictureAsPdf, Schedule } from '@mui/icons-material';
import { formatCatalogueDate } from '../../util/date';

/**
 * The brand-catalogue card, shared by /catalogues and the customer homepage.
 *
 * It used to exist only on /catalogues, with the homepage rendering a plain
 * icon-and-title row — so the same catalogue looked like two different things
 * depending on where a customer met it. Extracted here so both surfaces stay
 * identical by construction.
 *
 * Hover choreography is driven by class names (`logo-mark`, `plate-sheen`,
 * `go-cue`, `go-arrow`) that `ShowcaseCard` targets from the parent, so the
 * whole card animates as one object from a single hover.
 */

export interface BrandDetail {
  _id: string;
  name: string;
  image_url?: string;
}

/* ------------------------------------------------------------------ */
/*  Brand monogram palette — deterministic gradient per brand name.    */
/*  Stays within the Deep Indigo brand family (primary / secondary).   */
/* ------------------------------------------------------------------ */
const BRAND_GRADIENTS: [string, string][] = [
  ['#4633B8', '#6A5AD1'],
  ['#4633B8', '#6A5AD1'],
  ['#6A5AD1', '#37279C'],
  ['#4633B8', '#A796FF'],
  ['#37279C', '#6A5AD1'],
  ['#8D7BF2', '#A796FF'],
];

const gradientForName = (name: string): [string, string] => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return BRAND_GRADIENTS[hash % BRAND_GRADIENTS.length];
};

const initialsForName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/* ------------------------------------------------------------------ */
/*  Logo plate — the card's masthead. Brand logos are dark-on-          */
/*  transparent SVGs, so the plate stays light in both themes.          */
/*  Catalogues with no linked brand fall back to a gradient monogram.   */
/* ------------------------------------------------------------------ */
export const LOGO_PLATE_HEIGHT = 132;

export const LogoPlate = ({
  name,
  brands,
  height = LOGO_PLATE_HEIGHT,
}: {
  name: string;
  brands: BrandDetail[];
  height?: number;
}) => {
  // Sibling brands can share one logo file (e.g. Afterbath / Afterbath Litter)
  // — showing it twice just looks like a rendering bug.
  const withLogos = (brands || []).filter(
    (b, i, all) => b?.image_url && all.findIndex((o) => o.image_url === b.image_url) === i
  );
  const [g1, g2] = gradientForName(name || '?');
  const paired = withLogos.length > 1;
  const scale = height / LOGO_PLATE_HEIGHT;

  return (
    <Box
      className='logo-plate'
      sx={{
        position: 'relative',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 3,
        overflow: 'hidden',
        borderBottom: '1px solid',
        borderColor: 'divider',
        background:
          withLogos.length > 0
            ? `radial-gradient(120% 120% at 50% 0%, #FFFFFF 40%, #F2F1F8 100%)`
            : `linear-gradient(135deg, ${g1}, ${g2})`,
      }}
    >
      {/* Light sweep that crosses the plate on hover. */}
      <Box
        className='plate-sheen'
        aria-hidden
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '-60%',
          width: '45%',
          background: `linear-gradient(90deg, transparent, ${alpha(
            '#fff',
            withLogos.length > 0 ? 0.85 : 0.25
          )}, transparent)`,
          transform: 'translateX(0) skewX(-18deg)',
          transition: 'transform 0.75s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: 'none',
        }}
      />
      {withLogos.length === 0 ? (
        <Typography
          className='logo-mark'
          sx={{
            color: '#fff',
            fontWeight: 800,
            fontSize: `${2.25 * scale}rem`,
            letterSpacing: '0.04em',
            transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {initialsForName(name || '?')}
        </Typography>
      ) : (
        withLogos.slice(0, 2).map((b, i) => (
          <Box
            key={b._id}
            className='logo-mark'
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              minWidth: 0,
              transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {i > 0 && (
              <Box
                aria-hidden
                sx={{ width: '1px', height: 44 * scale, bgcolor: alpha('#000', 0.12), flexShrink: 0 }}
              />
            )}
            <Box
              component='img'
              src={b.image_url}
              alt={b.name}
              loading='lazy'
              sx={{
                height: (paired ? 56 : 68) * scale,
                maxWidth: (paired ? 104 : 190) * scale,
                objectFit: 'contain',
              }}
            />
          </Box>
        ))
      )}
    </Box>
  );
};

/* ------------------------------------------------------------------ */
/*  Styled building blocks                                             */
/* ------------------------------------------------------------------ */
export const ShowcaseCard = styled(Paper)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: 0,
  borderRadius: 20,
  cursor: 'pointer',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.05)',
  transition:
    'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease, border-color 0.3s ease',
  '&:hover, &:focus-visible': {
    transform: 'translateY(-6px)',
    borderColor: alpha(theme.palette.primary.main, 0.4),
    boxShadow:
      theme.palette.mode === 'dark'
        ? `0 14px 36px ${alpha('#000', 0.55)}`
        : `0 14px 30px ${alpha(theme.palette.primary.main, 0.18)}`,
    '& .logo-mark': { transform: 'scale(1.05)' },
    '& .plate-sheen': { transform: 'translateX(140%) skewX(-18deg)' },
    '& .go-cue': { color: theme.palette.primary.main },
    '& .go-cue .go-arrow': { transform: 'translateX(4px)' },
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}));

export const ActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  backgroundColor: alpha(theme.palette.action.active, 0.05),
  borderRadius: 10,
  padding: theme.spacing(0.75, 1.25),
  fontSize: '0.8rem',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
}));

/* ------------------------------------------------------------------ */
/*  The card                                                           */
/* ------------------------------------------------------------------ */
export interface CatalogueShowcaseCardProps {
  name: string;
  imageUrl: string;
  brandDetails?: BrandDetail[];
  /** 1-based position, rendered as the editorial catalogue number. */
  index: number;
  isCopied?: boolean;
  onOpen: (url: string, name: string) => void;
  onCopy: (event: React.MouseEvent, url: string, name: string) => void;
  /** Compact variant for the homepage, where the card is a secondary element. */
  dense?: boolean;
  /* Naive-UTC timestamps from Mongo. Customers and salespeople see a single
     date — the last edit, or the upload date if it has never been edited. */
  createdAt?: string | null;
  updatedAt?: string | null;
}

const CatalogueShowcaseCard = ({
  name,
  imageUrl,
  brandDetails,
  index,
  isCopied = false,
  onOpen,
  onCopy,
  dense = false,
  createdAt,
  updatedAt,
}: CatalogueShowcaseCardProps) => {
  const dateLabel = formatCatalogueDate(updatedAt, createdAt);
  // Only worth naming the brands when they differ from the catalogue title
  // (e.g. Petfest -> Dogfest, Catfest).
  const brandNames: string[] = (brandDetails || []).map((d) => d.name).filter(Boolean);
  const showBrandNames =
    brandNames.length > 1 ||
    (brandNames.length === 1 && brandNames[0].toLowerCase() !== String(name || '').toLowerCase());

  return (
    <ShowcaseCard
      elevation={0}
      tabIndex={0}
      role='button'
      aria-label={`Open ${name} catalogue`}
      onClick={() => onOpen(imageUrl, name)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(imageUrl, name);
        }
      }}
    >
      <LogoPlate
        name={name || '?'}
        brands={brandDetails || []}
        height={dense ? 104 : LOGO_PLATE_HEIGHT}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          p: dense ? 2 : 2.5,
          pt: dense ? 1.5 : 2,
        }}
      >
        {/* Index reads as an editorial catalogue number. */}
        <Typography
          variant='overline'
          sx={{
            color: 'text.disabled',
            fontWeight: 700,
            letterSpacing: '0.14em',
            lineHeight: 1.6,
            fontSize: dense ? '0.6rem' : undefined,
          }}
        >
          {String(index).padStart(2, '0')} ·{' '}
          {showBrandNames ? `${brandNames.length} brands` : 'Brand catalogue'}
        </Typography>

        <Typography
          variant={dense ? 'subtitle1' : 'h6'}
          fontWeight={700}
          color='text.primary'
          sx={{ lineHeight: 1.3 }}
          noWrap
          title={name}
        >
          {name}
        </Typography>

        <Typography variant='body2' color='text.secondary' noWrap sx={{ mt: 0.25 }}>
          {showBrandNames ? brandNames.join(' · ') : 'Full product range, PDF'}
        </Typography>

        {dateLabel && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 0.75,
              color: 'text.disabled',
            }}
          >
            <Schedule sx={{ fontSize: dense ? 13 : 14 }} />
            <Typography
              variant='caption'
              sx={{ fontSize: dense ? '0.68rem' : '0.72rem', lineHeight: 1.4 }}
              noWrap
            >
              {dateLabel}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mt: 'auto',
            pt: dense ? 1.5 : 2,
          }}
        >
          <Box
            className='go-cue'
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: dense ? '0.8rem' : '0.875rem',
              transition: 'color 0.25s ease',
            }}
          >
            <PictureAsPdf sx={{ fontSize: 18 }} />
            View catalogue
            <OpenInNew
              className='go-arrow'
              sx={{ fontSize: 16, transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </Box>

          <Tooltip title={isCopied ? 'Copied' : 'Copy link'} arrow>
            <ActionButton
              size='small'
              aria-label={`Copy ${name} catalogue link`}
              onClick={(e) => {
                e.stopPropagation();
                onCopy(e, imageUrl, name);
              }}
            >
              {isCopied ? <Check fontSize='small' color='success' /> : <ContentCopy fontSize='small' />}
            </ActionButton>
          </Tooltip>
        </Box>
      </Box>
    </ShowcaseCard>
  );
};

export default CatalogueShowcaseCard;
