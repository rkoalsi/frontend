import {
  Box,
  Typography,
  Paper,
  Button,
  useTheme,
  useMediaQuery,
  styled,
  Tooltip,
  IconButton,
  Skeleton,
  Fade,
  Chip,
  alpha,
  Container,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../../src/components/common/Header';
import { event as trackEvent } from '../../src/util/gtag';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ContentCopy,
  MenuBook,
  Share,
  PictureAsPdf,
  OpenInNew,
  NewReleases,
  Check,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';

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

interface BrandDetail {
  _id: string;
  name: string;
  image_url?: string;
}

/* ------------------------------------------------------------------ */
/*  Logo plate — the card's masthead. Brand logos are dark-on-          */
/*  transparent SVGs, so the plate stays light in both themes.          */
/*  Catalogues with no linked brand fall back to a gradient monogram.   */
/* ------------------------------------------------------------------ */
const LOGO_PLATE_HEIGHT = 132;

const LogoPlate = ({
  name,
  brands,
}: {
  name: string;
  brands: BrandDetail[];
}) => {
  // Sibling brands can share one logo file (e.g. Afterbath / Afterbath Litter)
  // — showing it twice just looks like a rendering bug.
  const withLogos = (brands || []).filter(
    (b, i, all) =>
      b?.image_url && all.findIndex((o) => o.image_url === b.image_url) === i
  );
  const [g1, g2] = gradientForName(name || '?');
  const paired = withLogos.length > 1;

  return (
    <Box
      className='logo-plate'
      sx={{
        position: 'relative',
        height: LOGO_PLATE_HEIGHT,
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
            fontSize: '2.25rem',
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
                sx={{
                  width: '1px',
                  height: 44,
                  bgcolor: alpha('#000', 0.12),
                  flexShrink: 0,
                }}
              />
            )}
            <Box
              component='img'
              src={b.image_url}
              alt={b.name}
              loading='lazy'
              sx={{
                height: paired ? 56 : 68,
                maxWidth: paired ? 104 : 190,
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
const ShowcaseCard = styled(Paper)(({ theme }) => ({
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
    theme.palette.mode === 'dark'
      ? '0 1px 2px rgba(0,0,0,0.4)'
      : '0 1px 4px rgba(0,0,0,0.05)',
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

const FeaturedCard = styled(Paper)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  padding: theme.spacing(3),
  borderRadius: 20,
  cursor: 'pointer',
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
  background:
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.14)}, ${alpha(
          theme.palette.primary.main,
          0.1
        )})`
      : `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.07)}, ${alpha(
          theme.palette.primary.main,
          0.04
        )})`,
  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? `0 16px 40px ${alpha('#000', 0.55)}`
        : `0 16px 34px ${alpha(theme.palette.secondary.main, 0.22)}`,
    '& .featured-glow': { opacity: 1 },
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: theme.spacing(2.5),
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
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

const ShareButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1, 2.5),
  borderRadius: 12,
  fontWeight: 600,
  fontSize: '0.875rem',
  textTransform: 'none',
  transition: 'all 0.25s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  '&:disabled': { opacity: 0.5 },
}));

/* ------------------------------------------------------------------ */
/*  Animation variants                                                */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      when: 'beforeChildren',
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: { opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.25 } },
};

const heroVariants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const },
  },
};

interface Props {}

/* ------------------------------------------------------------------ */
/*  Skeleton with shimmer                                              */
/* ------------------------------------------------------------------ */
const CardSkeleton = () => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: '20px',
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      height: '100%',
      overflow: 'hidden',
    }}
  >
    <Skeleton
      variant='rectangular'
      height={LOGO_PLATE_HEIGHT}
      sx={{ transform: 'none' }}
    />
    <Box sx={{ p: 2.5, pt: 2 }}>
      <Skeleton variant='text' width='35%' height={16} />
      <Skeleton variant='text' width='65%' height={30} />
      <Skeleton variant='text' width='50%' height={20} sx={{ mb: 2 }} />
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Skeleton variant='text' width={120} height={22} />
        <Skeleton variant='rounded' width={38} height={34} sx={{ borderRadius: '10px' }} />
      </Box>
    </Box>
  </Paper>
);

function Catalogue(_props: Props) {
  const router = useRouter();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const prefersReducedMotion = useReducedMotion();

  const getData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get(`${process.env.api_url}/catalogues`);
      setBrands(resp?.data || []);
    } catch (err: any) {
      console.error('Error fetching catalogues:', err);
      setError(err?.response?.data?.message || 'Failed to load catalogues');
      toast.error('Failed to load catalogues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  const flashCopied = useCallback((key: string) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1400);
  }, []);

  const handleOpenCatalogue = useCallback((url: string, name: string) => {
    trackEvent('select_catalogue', { catalogue_name: name, link_url: url });
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(`Opening ${name} catalogue`);
  }, []);

  const handleCopyLink = useCallback(
    (event: React.MouseEvent, url: string, name: string, key: string) => {
      event.stopPropagation();
      navigator.clipboard
        .writeText(url)
        .then(() => {
          flashCopied(key);
          toast.success(`${name} catalogue link copied!`);
        })
        .catch(() => toast.error('Failed to copy link'));
    },
    [flashCopied]
  );

  const handleShareAll = useCallback(() => {
    if (brands.length === 0) {
      toast.info('No catalogues available to share');
      return;
    }
    const catalogueLinks = brands
      .map((b: any) => `${b.name} Catalogue: ${b.image_url}`)
      .join('\n\n');
    navigator.clipboard
      .writeText(catalogueLinks)
      .then(() => toast.success('All catalogue links copied to clipboard!'))
      .catch(() => toast.error('Failed to copy links'));
  }, [brands]);

  const motionProps = prefersReducedMotion
    ? { initial: false as const }
    : { initial: 'hidden' as const, animate: 'visible' as const };

  // Matches on the catalogue name and on any linked brand name, so searching
  // "Dogfest" finds the Petfest catalogue.
  const visibleBrands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b: any) => {
      const haystack = [b.name, ...(b.brand_details || []).map((d: BrandDetail) => d.name)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [brands, query]);

  const countLabel = useMemo(() => {
    const n = brands.length;
    // +1 for the All Products catalogue
    const total = n + 1;
    return `${total} ${total === 1 ? 'catalogue' : 'catalogues'}`;
  }, [brands.length]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        pb: 6,
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth='lg'
        sx={{ position: 'relative', zIndex: 1, pt: { xs: 3, sm: 5, md: 6 } }}
      >
        {/* ---------------------------------------------------------- */}
        {/*  Hero                                                       */}
        {/* ---------------------------------------------------------- */}
        <Box
          component={motion.div}
          variants={heroVariants}
          {...motionProps}
          sx={{ mb: { xs: 4, sm: 5 } }}
        >
          <Header title='View Catalogues' showBackButton useBack />

          {/* Masthead: a single accent rule in the app's primary colour. */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 2,
              mt: { xs: 2, sm: 2.5 },
              pl: { xs: 1.5, sm: 2 },
              borderLeft: '3px solid',
              borderColor: 'primary.main',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                flex: 1,
              }}
            >
              <Box>
                <Typography
                  variant='overline'
                  sx={{
                    display: 'block',
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    color: 'text.disabled',
                    lineHeight: 1.4,
                  }}
                >
                  Brand library
                </Typography>
                <Typography
                  variant='body1'
                  color='text.secondary'
                  sx={{ fontWeight: 500 }}
                >
                  Every brand catalogue, ready to open or share
                  {!loading && !error && (
                    <Box
                      component='span'
                      sx={{ color: 'text.primary', fontWeight: 700 }}
                    >
                      {' '}
                      — {countLabel}
                    </Box>
                  )}
                </Typography>
              </Box>

              <ShareButton
                variant='contained'
                color='secondary'
                startIcon={<Share />}
                onClick={handleShareAll}
                disabled={brands.length === 0 || loading}
                fullWidth={isMobile}
                sx={{ flexShrink: 0 }}
              >
                Copy All Links
              </ShareButton>
            </Box>
          </Box>

          {!loading && !error && brands.length > 4 && (
            <TextField
              size='small'
              fullWidth
              placeholder='Search by catalogue or brand…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ mt: 2.5, maxWidth: { sm: 380 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon fontSize='small' />
                  </InputAdornment>
                ),
              }}
            />
          )}
        </Box>

        {/* ---------------------------------------------------------- */}
        {/*  Loading                                                    */}
        {/* ---------------------------------------------------------- */}
        {loading && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2.5,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </Box>
        )}

        {/* ---------------------------------------------------------- */}
        {/*  Error                                                      */}
        {/* ---------------------------------------------------------- */}
        {error && !loading && (
          <Fade in>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: 'center',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'error.main',
                borderRadius: 4,
              }}
            >
              <Typography variant='h6' color='error' gutterBottom>
                {error}
              </Typography>
              <Button variant='contained' onClick={getData} sx={{ mt: 2 }}>
                Try Again
              </Button>
            </Paper>
          </Fade>
        )}

        {/* ---------------------------------------------------------- */}
        {/*  Content                                                    */}
        {/* ---------------------------------------------------------- */}
        {!loading && !error && (
          <AnimatePresence mode='wait'>
            <motion.div variants={containerVariants} {...motionProps}>
              {/* Featured: All Products */}
              <Box
                component={motion.div}
                variants={itemVariants}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.005 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
                sx={{ mb: 3 }}
              >
                <FeaturedCard
                  elevation={0}
                  onClick={() => router.push('/catalogues/all_products')}
                >
                  <Box
                    className='featured-glow'
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      top: -60,
                      right: -40,
                      width: 220,
                      height: 220,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${alpha(
                        theme.palette.secondary.main,
                        0.35
                      )}, transparent 70%)`,
                      opacity: 0,
                      transition: 'opacity 0.4s ease',
                      pointerEvents: 'none',
                    }}
                  />
                  <Box
                    sx={{
                      width: { xs: 56, sm: 64 },
                      height: { xs: 56, sm: 64 },
                      minWidth: { xs: 56, sm: 64 },
                      borderRadius: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                      boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.4)}`,
                      flexShrink: 0,
                    }}
                  >
                    <NewReleases sx={{ fontSize: { xs: 28, sm: 32 }, color: '#fff' }} />
                  </Box>

                  <Box flex={1} minWidth={0} sx={{ zIndex: 1 }}>
                    <Box display='flex' alignItems='center' gap={1} flexWrap='wrap' mb={0.5}>
                      <Typography variant='h6' fontWeight={700} color='text.primary'>
                        All Products Catalogue
                      </Typography>
                      <Chip
                        label='Latest'
                        size='small'
                        color='secondary'
                        sx={{ fontWeight: 600, height: 22 }}
                      />
                    </Box>
                    <Typography variant='body2' color='text.secondary'>
                      Browse every product across all brands in one place
                    </Typography>
                  </Box>

                  <Box
                    display='flex'
                    gap={1}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      zIndex: 1,
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                    }}
                  >
                    <Tooltip title='Copy link' arrow>
                      <ActionButton
                        size='small'
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}/catalogues/all_products`;
                          navigator.clipboard
                            .writeText(url)
                            .then(() => {
                              flashCopied('all_products');
                              toast.success('All Products catalogue link copied!');
                            })
                            .catch(() => toast.error('Failed to copy link'));
                        }}
                      >
                        {copiedKey === 'all_products' ? (
                          <Check fontSize='small' color='success' />
                        ) : (
                          <ContentCopy fontSize='small' />
                        )}
                        <Typography variant='caption' sx={{ ml: 0.5, fontWeight: 600 }}>
                          {copiedKey === 'all_products' ? 'Copied' : 'Copy'}
                        </Typography>
                      </ActionButton>
                    </Tooltip>
                    <Tooltip title='Open catalogue' arrow>
                      <ActionButton
                        size='small'
                        onClick={() => router.push('/catalogues/all_products')}
                      >
                        <OpenInNew fontSize='small' />
                        <Typography variant='caption' sx={{ ml: 0.5, fontWeight: 600 }}>
                          Open
                        </Typography>
                      </ActionButton>
                    </Tooltip>
                  </Box>
                </FeaturedCard>
              </Box>

              {/* Section rule */}
              {visibleBrands.length > 0 && (
                <Box
                  component={motion.div}
                  variants={itemVariants}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mt: 4,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant='overline'
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '0.18em',
                      color: 'text.secondary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    By brand
                  </Typography>
                  <Box
                    aria-hidden
                    sx={{
                      flex: 1,
                      height: '1px',
                      bgcolor: 'divider',
                    }}
                  />
                  <Typography
                    variant='caption'
                    sx={{ color: 'text.disabled', fontWeight: 700 }}
                  >
                    {visibleBrands.length}
                  </Typography>
                </Box>
              )}

              {/* Brand grid */}
              {visibleBrands.length > 0 && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                    },
                    gap: 2.5,
                  }}
                >
                  {visibleBrands.map((b: any, index: number) => {
                    const key = b._id || `brand-${index}`;
                    const isCopied = copiedKey === key;
                    // Only worth naming the brands when they differ from the
                    // catalogue title (e.g. Petfest -> Dogfest, Catfest).
                    const brandNames: string[] = (b.brand_details || [])
                      .map((d: BrandDetail) => d.name)
                      .filter(Boolean);
                    const showBrandNames =
                      brandNames.length > 1 ||
                      (brandNames.length === 1 &&
                        brandNames[0].toLowerCase() !==
                          String(b.name || '').toLowerCase());
                    return (
                      <Box
                        key={key}
                        component={motion.div}
                        variants={itemVariants}
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                      >
                        <ShowcaseCard
                          elevation={0}
                          tabIndex={0}
                          role='button'
                          aria-label={`Open ${b.name} catalogue`}
                          onClick={() => handleOpenCatalogue(b.image_url, b.name)}
                          onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleOpenCatalogue(b.image_url, b.name);
                            }
                          }}
                        >
                          <LogoPlate
                            name={b.name || '?'}
                            brands={b.brand_details || []}
                          />

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              flex: 1,
                              p: 2.5,
                              pt: 2,
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
                              }}
                            >
                              {String(index + 1).padStart(2, '0')} ·{' '}
                              {showBrandNames
                                ? `${brandNames.length} brands`
                                : 'Brand catalogue'}
                            </Typography>

                            <Typography
                              variant='h6'
                              fontWeight={700}
                              color='text.primary'
                              sx={{ lineHeight: 1.3 }}
                              noWrap
                              title={b.name}
                            >
                              {b.name}
                            </Typography>

                            <Typography
                              variant='body2'
                              color='text.secondary'
                              noWrap
                              sx={{ mt: 0.25 }}
                            >
                              {showBrandNames
                                ? brandNames.join(' · ')
                                : 'Full product range, PDF'}
                            </Typography>

                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                                mt: 'auto',
                                pt: 2,
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
                                  fontSize: '0.875rem',
                                  transition: 'color 0.25s ease',
                                }}
                              >
                                <PictureAsPdf sx={{ fontSize: 18 }} />
                                View catalogue
                                <OpenInNew
                                  className='go-arrow'
                                  sx={{
                                    fontSize: 16,
                                    transition:
                                      'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
                                  }}
                                />
                              </Box>

                              <Tooltip
                                title={isCopied ? 'Copied' : 'Copy link'}
                                arrow
                              >
                                <ActionButton
                                  size='small'
                                  aria-label={`Copy ${b.name} catalogue link`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink(e, b.image_url, b.name, key);
                                  }}
                                >
                                  {isCopied ? (
                                    <Check fontSize='small' color='success' />
                                  ) : (
                                    <ContentCopy fontSize='small' />
                                  )}
                                </ActionButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </ShowcaseCard>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Empty state */}
              {visibleBrands.length === 0 && (
                <Box component={motion.div} variants={itemVariants}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 6,
                      textAlign: 'center',
                      bgcolor: 'background.paper',
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 4,
                    }}
                  >
                    <MenuBook sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant='h6' color='text.secondary' fontWeight={500}>
                      {query.trim()
                        ? `No catalogues match “${query.trim()}”`
                        : 'No brand catalogues available'}
                    </Typography>
                    <Typography variant='body2' color='text.disabled' sx={{ mt: 0.5 }}>
                      {query.trim()
                        ? 'Try a different brand or catalogue name'
                        : 'Check back later for brand PDFs'}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </Container>
    </Box>
  );
}

export default Catalogue;
