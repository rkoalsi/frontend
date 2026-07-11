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
  AutoStories,
  Check,
} from '@mui/icons-material';
import { useRouter } from 'next/router';

/* ------------------------------------------------------------------ */
/*  Brand monogram palette — deterministic gradient per brand name.    */
/*  Stays within the Deep Indigo brand family (primary / secondary).   */
/* ------------------------------------------------------------------ */
const BRAND_GRADIENTS: [string, string][] = [
  ['#2a4a6b', '#456089'],
  ['#614998', '#7d63be'],
  ['#4E8098', '#2B4864'],
  ['#5e52b5', '#9c92d8'],
  ['#3B6374', '#4E8098'],
  ['#7a64a8', '#b09ed8'],
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
/*  Styled building blocks                                             */
/* ------------------------------------------------------------------ */
const ShowcaseCard = styled(Paper)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: theme.spacing(2.5),
  borderRadius: 18,
  cursor: 'pointer',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 1px 2px rgba(0,0,0,0.4)'
      : '0 1px 4px rgba(0,0,0,0.05)',
  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease, border-color 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    height: '3px',
    width: '100%',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    transform: 'scaleX(0)',
    transformOrigin: 'left',
    transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
  },
  '&:hover': {
    transform: 'translateY(-6px)',
    borderColor: alpha(theme.palette.primary.main, 0.4),
    boxShadow:
      theme.palette.mode === 'dark'
        ? `0 14px 36px ${alpha('#000', 0.55)}`
        : `0 14px 30px ${alpha(theme.palette.primary.main, 0.18)}`,
    '&::before': { transform: 'scaleX(1)' },
    '& .monogram': { transform: 'scale(1.06) rotate(-2deg)' },
    '& .open-cue': { opacity: 1, transform: 'translateX(0)' },
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
      p: 2.5,
      borderRadius: '18px',
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      height: '100%',
    }}
  >
    <Skeleton variant='rounded' width={56} height={56} sx={{ borderRadius: '14px', mb: 2 }} />
    <Skeleton variant='text' width='65%' height={28} sx={{ mb: 0.5 }} />
    <Skeleton variant='text' width='45%' height={20} sx={{ mb: 2 }} />
    <Box display='flex' gap={1}>
      <Skeleton variant='rounded' width={76} height={34} sx={{ borderRadius: '10px' }} />
      <Skeleton variant='rounded' width={76} height={34} sx={{ borderRadius: '10px' }} />
    </Box>
  </Paper>
);

function Catalogue(_props: Props) {
  const router = useRouter();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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
      {/* Brand-tinted background wash */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            theme.palette.mode === 'dark'
              ? `radial-gradient(900px circle at 50% -120px, ${alpha(
                  theme.palette.secondary.main,
                  0.18
                )}, transparent 60%), radial-gradient(700px circle at 100% 0, ${alpha(
                  theme.palette.primary.main,
                  0.12
                )}, transparent 55%)`
              : `radial-gradient(900px circle at 50% -120px, ${alpha(
                  theme.palette.secondary.main,
                  0.1
                )}, transparent 60%), radial-gradient(700px circle at 100% 0, ${alpha(
                  theme.palette.primary.main,
                  0.07
                )}, transparent 55%)`,
        }}
      />

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

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mt: { xs: 1.5, sm: 2 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                textAlign: { xs: 'center', sm: 'left' },
              }}
            >
              <Typography variant='body1' color='text.secondary' sx={{ fontWeight: 500 }}>
                Our complete brand collection, ready to share
              </Typography>
              {!loading && !error && (
                <Chip
                  label={countLabel}
                  size='small'
                  color='primary'
                  variant='outlined'
                  sx={{ fontWeight: 600, height: 24 }}
                />
              )}
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

              {/* Brand grid */}
              {brands.length > 0 && (
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
                  {brands.map((b: any, index: number) => {
                    const key = b._id || `brand-${index}`;
                    const [g1, g2] = gradientForName(b.name || '?');
                    const isCopied = copiedKey === key;
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
                          onClick={() => handleOpenCatalogue(b.image_url, b.name)}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              mb: 2,
                            }}
                          >
                            <Box
                              className='monogram'
                              sx={{
                                position: 'relative',
                                width: 56,
                                height: 56,
                                borderRadius: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${g1}, ${g2})`,
                                boxShadow: `0 6px 16px ${alpha(g1, 0.4)}`,
                                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                                flexShrink: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  color: '#fff',
                                  fontWeight: 800,
                                  fontSize: '1.15rem',
                                  letterSpacing: '0.02em',
                                }}
                              >
                                {initialsForName(b.name || '?')}
                              </Typography>
                            </Box>

                            <Box
                              className='open-cue'
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: 'primary.main',
                                opacity: 0,
                                transform: 'translateX(-8px)',
                                transition: 'all 0.3s ease',
                                mt: 0.5,
                              }}
                            >
                              <AutoStories sx={{ fontSize: 18 }} />
                            </Box>
                          </Box>

                          <Typography
                            variant='h6'
                            fontWeight={700}
                            color='text.primary'
                            sx={{ lineHeight: 1.3, mb: 0.25 }}
                            noWrap
                            title={b.name}
                          >
                            {b.name}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: 'text.secondary',
                              mb: 2,
                            }}
                          >
                            <PictureAsPdf sx={{ fontSize: 16 }} />
                            <Typography variant='body2' color='text.secondary'>
                              PDF Catalogue
                            </Typography>
                          </Box>

                          <Box
                            display='flex'
                            gap={1}
                            mt='auto'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Tooltip title='Copy link' arrow>
                              <ActionButton
                                size='small'
                                onClick={(e) => handleCopyLink(e, b.image_url, b.name, key)}
                              >
                                {isCopied ? (
                                  <Check fontSize='small' color='success' />
                                ) : (
                                  <ContentCopy fontSize='small' />
                                )}
                                <Typography variant='caption' sx={{ ml: 0.5, fontWeight: 600 }}>
                                  {isCopied ? 'Copied' : 'Copy'}
                                </Typography>
                              </ActionButton>
                            </Tooltip>
                            <Tooltip title='Open in new tab' arrow>
                              <ActionButton
                                size='small'
                                onClick={() => handleOpenCatalogue(b.image_url, b.name)}
                              >
                                <OpenInNew fontSize='small' />
                                <Typography variant='caption' sx={{ ml: 0.5, fontWeight: 600 }}>
                                  Open
                                </Typography>
                              </ActionButton>
                            </Tooltip>
                          </Box>
                        </ShowcaseCard>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Empty state */}
              {brands.length === 0 && (
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
                      No brand catalogues available
                    </Typography>
                    <Typography variant='body2' color='text.disabled' sx={{ mt: 0.5 }}>
                      Check back later for brand PDFs
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
