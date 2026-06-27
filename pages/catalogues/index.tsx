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
  Stack,
} from '@mui/material';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../../src/components/common/Header';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ContentCopy,
  MenuBook,
  Share,
  PictureAsPdf,
  OpenInNew,
  NewReleases,
} from '@mui/icons-material';
import { useRouter } from 'next/router';

const ListItemCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  backgroundColor: theme.palette.background.paper,
  borderRadius: 14,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'nowrap',
  gap: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    opacity: 0,
    transition: 'opacity 0.25s ease-in-out',
    borderRadius: '4px 0 0 4px',
  },
  '&:hover': {
    transform: 'translateX(4px)',
    boxShadow: theme.shadows[4],
    borderColor: alpha(theme.palette.primary.main, 0.35),
    '&::before': { opacity: 1 },
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5, 2),
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
}));

const ShareButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.25, 3.5),
  borderRadius: 12,
  fontWeight: 600,
  fontSize: '0.925rem',
  textTransform: 'none',
  transition: 'all 0.25s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  '&:disabled': {
    opacity: 0.5,
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  backgroundColor: alpha(theme.palette.action.active, 0.05),
  borderRadius: 10,
  padding: theme.spacing(0.875, 1.5),
  fontSize: '0.875rem',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    borderColor: alpha(theme.palette.primary.main, 0.3),
    transform: 'scale(1.04)',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '56px',
  height: '56px',
  minWidth: '56px',
  borderRadius: 12,
  background: alpha(theme.palette.primary.main, 0.1),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
  transition: 'all 0.25s ease-in-out',
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    width: '44px',
    height: '44px',
    minWidth: '44px',
    borderRadius: 10,
  },
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: 'beforeChildren',
      staggerChildren: 0.08,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.2 },
  },
};

interface Props {}

const CatalogueSkeleton = () => (
  <Paper
    elevation={0}
    sx={{
      padding: 2,
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
    }}
  >
    <Skeleton variant='rounded' width={56} height={56} sx={{ borderRadius: '10px', flexShrink: 0 }} />
    <Box flex={1} minWidth={0}>
      <Skeleton variant='text' width='55%' height={28} sx={{ mb: 0.5 }} />
      <Skeleton variant='text' width='35%' height={20} />
    </Box>
    <Box display='flex' gap={1}>
      <Skeleton variant='rounded' width={80} height={36} sx={{ borderRadius: '10px' }} />
      <Skeleton variant='rounded' width={72} height={36} sx={{ borderRadius: '10px' }} />
    </Box>
  </Paper>
);

function Catalogue(props: Props) {
  const {} = props;
  const router = useRouter();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get(`${process.env.api_url}/catalogues`);
      setBrands(resp?.data || []);
    } catch (error: any) {
      console.error('Error fetching catalogues:', error);
      setError(error?.response?.data?.message || 'Failed to load catalogues');
      toast.error('Failed to load catalogues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  const handleOpenCatalogue = useCallback((url: string, name: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(`Opening ${name} catalogue`);
  }, []);

  const handleCopyLink = useCallback(
    (event: React.MouseEvent, url: string, name: string) => {
      event.stopPropagation();
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success(`${name} catalogue link copied!`))
        .catch(() => toast.error('Failed to copy link'));
    },
    []
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

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      sx={{ width: '100%', minHeight: '100vh', paddingBottom: 4 }}
    >
      <Header title='View Catalogues' showBackButton useBack />

      <Container maxWidth='lg' sx={{ mt: 2 }}>
        {/* Share All Button */}
        <Fade in timeout={600}>
          <Box display='flex' alignItems='center' justifyContent='center' sx={{ mb: 4 }}>
            <motion.div
              variants={buttonVariants}
              initial='hidden'
              animate='visible'
              style={{ width: isMobile ? '100%' : 'auto' }}
            >
              <ShareButton
                variant='contained'
                color='secondary'
                startIcon={<Share />}
                onClick={handleShareAll}
                disabled={brands.length === 0 || loading}
                fullWidth={isMobile}
                size={isMobile ? 'medium' : 'large'}
              >
                Copy All Catalogue Links
              </ShareButton>
            </motion.div>
          </Box>
        </Fade>

        {/* Loading */}
        {loading && (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => <CatalogueSkeleton key={i} />)}
          </Stack>
        )}

        {/* Error */}
        {error && !loading && (
          <Fade in>
            <Paper
              elevation={0}
              sx={{
                padding: 4,
                textAlign: 'center',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'error.main',
                borderRadius: 4,
              }}
            >
              <Typography variant='h6' color='error' gutterBottom>{error}</Typography>
              <Button variant='contained' onClick={getData} sx={{ mt: 2 }}>Try Again</Button>
            </Paper>
          </Fade>
        )}

        {/* Catalogues List */}
        {!loading && !error && (
          <AnimatePresence mode='wait'>
            <motion.div variants={containerVariants} initial='hidden' animate='visible'>
              <Stack spacing={2}>

                {/* All Products Catalogue */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <ListItemCard
                    elevation={0}
                    onClick={() => router.push('/catalogues/all_products')}
                    sx={{
                      '&::before': { opacity: 1, background: theme.palette.secondary.main },
                      borderColor: alpha(theme.palette.secondary.main, 0.3),
                      bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.08 : 0.04),
                    }}
                  >
                    {/* Icon + Text row (full width on mobile) */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: { xs: 1.5, sm: 2 },
                        flex: 1,
                        minWidth: 0,
                        width: { xs: '100%', sm: 'auto' },
                      }}
                    >
                      <IconWrapper
                        sx={{
                          background: alpha(theme.palette.secondary.main, 0.14),
                          border: `1px solid ${alpha(theme.palette.secondary.main, 0.28)}`,
                        }}
                      >
                        <NewReleases sx={{ fontSize: { xs: '26px', sm: '30px' }, color: 'secondary.main' }} />
                      </IconWrapper>

                      <Box flex={1} minWidth={0}>
                        <Box display='flex' alignItems='center' gap={1} flexWrap='wrap' mb={0.25}>
                          <Typography
                            variant='h6'
                            fontWeight='700'
                            color='text.primary'
                            sx={{ minWidth: 0, lineHeight: 1.3 }}
                          >
                            All Products Catalogue
                          </Typography>
                          <Chip
                            label='Latest'
                            size='small'
                            color='secondary'
                            variant='outlined'
                            sx={{ fontWeight: 600, height: '22px', flexShrink: 0 }}
                          />
                        </Box>
                        <Typography variant='body2' color='text.secondary'>
                          Browse all products across every brand
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Buttons (wrap to new row on mobile) */}
                    <Box
                      display='flex'
                      gap={1}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        flexShrink: 0,
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                      }}
                    >
                      <Tooltip title='Copy link' arrow>
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = `${window.location.origin}/catalogues/all_products`;
                            navigator.clipboard
                              .writeText(url)
                              .then(() => toast.success('All Products catalogue link copied!'))
                              .catch(() => toast.error('Failed to copy link'));
                          }}
                          size='small'
                        >
                          <ContentCopy fontSize='small' />
                          <Typography variant='caption' sx={{ ml: 0.5, fontWeight: 600 }}>
                            Copy
                          </Typography>
                        </ActionButton>
                      </Tooltip>
                      <Tooltip title='Open catalogue' arrow>
                        <ActionButton
                          onClick={() => router.push('/catalogues/all_products')}
                          size='small'
                        >
                          <OpenInNew fontSize='small' />
                          <Typography variant='caption' sx={{ ml: 0.5, fontWeight: 600 }}>
                            Open
                          </Typography>
                        </ActionButton>
                      </Tooltip>
                    </Box>
                  </ListItemCard>
                </motion.div>

                {/* Brand Catalogues */}
                {brands.length > 0 && brands.map((b: any, index: number) => (
                  <motion.div
                    key={b._id || index}
                    variants={itemVariants}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <ListItemCard
                      elevation={0}
                      onClick={() => handleOpenCatalogue(b.image_url, b.name)}
                    >
                      {/* Icon + Text row (full width on mobile) */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: 1.5, sm: 2 },
                          flex: 1,
                          minWidth: 0,
                          width: { xs: '100%', sm: 'auto' },
                        }}
                      >
                        <IconWrapper>
                          <PictureAsPdf sx={{ fontSize: { xs: '24px', sm: '28px' }, color: 'primary.main' }} />
                        </IconWrapper>

                        <Box flex={1} minWidth={0}>
                          <Typography
                            variant='h6'
                            fontWeight='700'
                            color='text.primary'
                            sx={{ minWidth: 0, lineHeight: 1.3, mb: 0.25 }}
                          >
                            {b.name}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Click to view PDF catalogue
                          </Typography>
                        </Box>
                      </Box>

                      {/* Action Buttons (wrap to new row on mobile) */}
                      <Box
                        display='flex'
                        gap={1}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          flexShrink: 0,
                          width: { xs: '100%', sm: 'auto' },
                          justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                        }}
                      >
                        <Tooltip title='Copy link' arrow>
                          <ActionButton
                            onClick={(e) => handleCopyLink(e, b.image_url, b.name)}
                            size='small'
                          >
                            <ContentCopy fontSize='small' />
                            <Typography variant='caption' sx={{ ml: 0.5, fontWeight: 600 }}>
                              Copy
                            </Typography>
                          </ActionButton>
                        </Tooltip>
                        <Tooltip title='Open in new tab' arrow>
                          <ActionButton
                            onClick={() => handleOpenCatalogue(b.image_url, b.name)}
                            size='small'
                          >
                            <OpenInNew fontSize='small' />
                            <Typography variant='caption' sx={{ ml: 0.5, fontWeight: 600 }}>
                              Open
                            </Typography>
                          </ActionButton>
                        </Tooltip>
                      </Box>
                    </ListItemCard>
                  </motion.div>
                ))}

                {/* Empty state */}
                {brands.length === 0 && (
                  <Fade in>
                    <Paper
                      elevation={0}
                      sx={{
                        padding: 6,
                        textAlign: 'center',
                        bgcolor: 'background.paper',
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 4,
                      }}
                    >
                      <MenuBook sx={{ fontSize: '56px', color: 'text.disabled', mb: 1.5 }} />
                      <Typography variant='h6' color='text.secondary' fontWeight={500}>
                        No brand catalogues available
                      </Typography>
                      <Typography variant='body2' color='text.disabled' sx={{ mt: 0.5 }}>
                        Check back later for brand PDFs
                      </Typography>
                    </Paper>
                  </Fade>
                )}
              </Stack>
            </motion.div>
          </AnimatePresence>
        )}
      </Container>
    </Box>
  );
}

export default Catalogue;
