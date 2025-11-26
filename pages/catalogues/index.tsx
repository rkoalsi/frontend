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
  CheckCircle,
} from '@mui/icons-material';

// Modern List Item Design
const ListItemCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  background: `linear-gradient(135deg, ${alpha(
    theme.palette.primary.main,
    0.95
  )}, ${alpha(theme.palette.primary.dark, 0.98)})`,
  borderRadius: 16,
  border: `2px solid ${alpha(theme.palette.primary.light, 0.2)}`,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
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
    background: `linear-gradient(180deg, ${theme.palette.info.main}, ${theme.palette.secondary.main})`,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
  '&:hover': {
    transform: 'translateX(4px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
    border: `2px solid ${alpha(theme.palette.info.main, 0.5)}`,
    '&::before': {
      opacity: 1,
    },
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    textAlign: 'center',
  },
}));

const ShareButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 4),
  background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
  color: 'white',
  borderRadius: 12,
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.4)',
  },
  '&:disabled': {
    background: alpha(theme.palette.grey[500], 0.3),
    color: alpha('#fff', 0.5),
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: alpha('#fff', 0.85),
  backgroundColor: alpha('#fff', 0.1),
  borderRadius: 10,
  padding: theme.spacing(1, 2),
  fontSize: '0.875rem',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: alpha('#fff', 0.2),
    color: '#fff',
    transform: 'scale(1.05)',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '64px',
  height: '64px',
  minWidth: '64px',
  borderRadius: 12,
  background: alpha(theme.palette.info.main, 0.2),
  border: `2px solid ${alpha(theme.palette.info.light, 0.3)}`,
  transition: 'all 0.3s ease-in-out',
}));

// Enhanced Animation Variants
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
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
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

// Skeleton Loader Component
const CatalogueSkeleton = () => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        padding: 2.5,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        background: alpha(theme.palette.primary.main, 0.2),
        mb: 2,
      }}
    >
      <Skeleton
        variant='rounded'
        width={64}
        height={64}
        sx={{ bgcolor: alpha('#fff', 0.1), borderRadius: 3 }}
      />
      <Box flex={1}>
        <Skeleton
          variant='text'
          width='60%'
          height={32}
          sx={{ bgcolor: alpha('#fff', 0.1), mb: 1 }}
        />
        <Skeleton
          variant='text'
          width='40%'
          height={24}
          sx={{ bgcolor: alpha('#fff', 0.1) }}
        />
      </Box>
      <Box display='flex' gap={1}>
        <Skeleton
          variant='rounded'
          width={80}
          height={40}
          sx={{ bgcolor: alpha('#fff', 0.1), borderRadius: 2 }}
        />
        <Skeleton
          variant='rounded'
          width={80}
          height={40}
          sx={{ bgcolor: alpha('#fff', 0.1), borderRadius: 2 }}
        />
      </Box>
    </Paper>
  );
};

function Catalogue(props: Props) {
  const {} = props;
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch catalogues from API with proper error handling
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

  // Open Catalogue in new tab
  const handleOpenCatalogue = useCallback((url: string, name: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(`Opening ${name} catalogue`);
  }, []);

  // Copy single catalogue link to clipboard
  const handleCopyLink = useCallback(
    (event: React.MouseEvent, url: string, name: string) => {
      event.stopPropagation();
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast.success(`${name} catalogue link copied!`);
        })
        .catch((err) => {
          toast.error('Failed to copy link');
          console.error('Could not copy text: ', err);
        });
    },
    []
  );

  // Share all catalogues
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
      .then(() => {
        toast.success('All catalogue links copied to clipboard!');
      })
      .catch((err) => {
        toast.error('Failed to copy links');
        console.error('Could not copy text: ', err);
      });
  }, [brands]);

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      sx={{
        width: '100%',
        minHeight: '100vh',
        paddingBottom: 4,
      }}
    >
      {/* Page Header */}
      <Header title='View Catalogues' showBackButton />

      <Container maxWidth='lg' sx={{ mt: 2 }}>
        {/* Share All Button */}
        <Fade in timeout={600}>
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            sx={{ mb: 4 }}
          >
            <motion.div
              variants={buttonVariants}
              initial='hidden'
              animate='visible'
              style={{ width: isMobile ? '100%' : 'auto' }}
            >
              <ShareButton
                startIcon={<Share />}
                onClick={handleShareAll}
                disabled={brands.length === 0 || loading}
                fullWidth={isMobile}
                size={isMobile ? 'medium' : 'large'}
              >
                Share All Catalogues
              </ShareButton>
            </motion.div>
          </Box>
        </Fade>

        {/* Loading State */}
        {loading && (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <CatalogueSkeleton key={i} />
            ))}
          </Stack>
        )}

        {/* Error State */}
        {error && !loading && (
          <Fade in>
            <Paper
              sx={{
                padding: 4,
                textAlign: 'center',
                background: alpha(theme.palette.error.main, 0.1),
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

        {/* Catalogues List */}
        {!loading && !error && (
          <AnimatePresence mode='wait'>
            {brands.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial='hidden'
                animate='visible'
              >
                <Stack spacing={2}>
                  {brands.map((b: any, index: number) => (
                    <motion.div
                      key={b._id || index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <ListItemCard
                        elevation={4}
                        onClick={() => handleOpenCatalogue(b.image_url, b.name)}
                      >
                        {/* PDF Icon */}
                        <IconWrapper>
                          <PictureAsPdf
                            sx={{
                              fontSize: '36px',
                              color: theme.palette.info.light,
                            }}
                          />
                        </IconWrapper>

                        {/* Catalogue Info */}
                        <Box flex={1}>
                          <Box
                            display='flex'
                            alignItems='center'
                            gap={1.5}
                            mb={0.5}
                          >
                            <Typography
                              variant='h6'
                              fontWeight='700'
                              sx={{
                                color: 'white',
                                letterSpacing: '0.3px',
                              }}
                            >
                              {b.name}
                            </Typography>
                            {b.is_active !== false && (
                              <Chip
                                icon={
                                  <CheckCircle
                                    sx={{ fontSize: '14px !important' }}
                                  />
                                }
                                label='Active'
                                size='small'
                                sx={{
                                  background: alpha(
                                    theme.palette.success.main,
                                    0.2
                                  ),
                                  color: theme.palette.success.light,
                                  border: `1px solid ${alpha(
                                    theme.palette.success.main,
                                    0.4
                                  )}`,
                                  fontWeight: 600,
                                  height: '24px',
                                }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant='body2'
                            sx={{
                              color: alpha('#fff', 0.7),
                              fontWeight: 500,
                            }}
                          >
                            Click to view catalogue
                          </Typography>
                        </Box>

                        {/* Action Buttons */}
                        <Box
                          display='flex'
                          gap={1}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip title='Copy link' arrow>
                            <ActionButton
                              onClick={(e) =>
                                handleCopyLink(e, b.image_url, b.name)
                              }
                              size='small'
                            >
                              <ContentCopy fontSize='small' />
                              <Typography
                                variant='caption'
                                sx={{
                                  ml: 0.5,
                                  fontWeight: 600,
                                  display: { xs: 'none', sm: 'inline' },
                                }}
                              >
                                Copy
                              </Typography>
                            </ActionButton>
                          </Tooltip>
                          <Tooltip title='Open in new tab' arrow>
                            <ActionButton
                              onClick={() =>
                                handleOpenCatalogue(b.image_url, b.name)
                              }
                              size='small'
                            >
                              <OpenInNew fontSize='small' />
                              <Typography
                                variant='caption'
                                sx={{
                                  ml: 0.5,
                                  fontWeight: 600,
                                  display: { xs: 'none', sm: 'inline' },
                                }}
                              >
                                Open
                              </Typography>
                            </ActionButton>
                          </Tooltip>
                        </Box>
                      </ListItemCard>
                    </motion.div>
                  ))}
                </Stack>
              </motion.div>
            ) : (
              <Fade in>
                <Paper
                  sx={{
                    padding: 4,
                    textAlign: 'center',
                    background: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 4,
                  }}
                >
                  <MenuBook
                    sx={{ fontSize: '64px', color: alpha('#fff', 0.3), mb: 2 }}
                  />
                  <Typography
                    variant='h6'
                    sx={{
                      color: alpha('#fff', 0.7),
                      fontWeight: 500,
                    }}
                  >
                    No catalogues available at the moment
                  </Typography>
                </Paper>
              </Fade>
            )}
          </AnimatePresence>
        )}
      </Container>
    </Box>
  );
}

export default Catalogue;
