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
  Stack,
  Grid,
  Container,
  Fade,
  Chip,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../../src/components/common/Header';
import { motion } from 'framer-motion';
import {
  ContentCopy,
  Launch,
  Link as LinkIcon,
  OpenInNew,
  Language,
  Public,
  Share,
  ArrowOutward,
} from '@mui/icons-material';

// Enhanced Styled Card with better glassmorphism
const StyledCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background:
    'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
  borderRadius: 20,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow:
    '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background:
      'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow:
      '0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    '&::before': {
      opacity: 1,
    },
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    borderRadius: 16,
  },
}));

const CardContent = styled(Box)({
  cursor: 'pointer',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  position: 'relative',
  zIndex: 1,
});

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background:
    'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
    background:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 100%)',
  },
  [theme.breakpoints.down('sm')]: {
    width: 60,
    height: 60,
    marginBottom: theme.spacing(1.5),
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: 'rgba(255, 255, 255, 0.9)',
  borderRadius: 12,
  padding: theme.spacing(1, 2),
  fontSize: '0.85rem',
  fontWeight: 500,
  minWidth: 'auto',
  gap: theme.spacing(1),
  border: '1px solid rgba(255, 255, 255, 0.15)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5, 1),
    fontSize: '0.75rem',
  },
}));

const GradientBackground = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  zIndex: -1,
});

const StatusChip = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: 'rgba(76, 175, 80, 0.2)',
  color: '#4caf50',
  border: '1px solid rgba(76, 175, 80, 0.3)',
  fontSize: '0.7rem',
  height: 24,
  '& .MuiChip-label': {
    padding: '0 8px',
  },
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      type: 'spring',
      damping: 20,
      stiffness: 100,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

interface Props {}

function ExternalLinks(props: Props) {
  const {} = props;
  const [externalLinks, setExternalLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Get appropriate icon for external links
  const getIcon = (index: number) => {
    const icons = [Language, Public, OpenInNew, Launch, LinkIcon];
    return icons[index % icons.length];
  };

  // Fetch catalogues from API
  const getData = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`${process.env.api_url}/external_links`);
      setExternalLinks(resp?.data);
    } catch (error: any) {
      console.log(error);
      toast.error('Failed to load external links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // Open link in new tab
  const handleOpenLink = async (url: string, name: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(`Opening ${name}...`);
  };

  // Copy link to clipboard
  const handleCopyLink = (
    event: React.MouseEvent,
    url: string,
    name: string
  ) => {
    event.stopPropagation();
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success(`${name} link copied to clipboard!`);
      })
      .catch((err) => {
        toast.error('Failed to copy link');
        console.error('Could not copy text: ', err);
      });
  };

  // Share link
  const handleShare = async (
    event: React.MouseEvent,
    url: string,
    name: string
  ) => {
    event.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          url: url,
        });
        toast.success(`${name} shared successfully!`);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          handleCopyLink(event, url, name);
        }
      }
    } else {
      handleCopyLink(event, url, name);
    }
  };

  return (
    <>
      <GradientBackground />
      <Container maxWidth='lg' sx={{ minHeight: '100vh', py: 4 }}>
        <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          sx={{ width: '100%' }}
        >
          {/* Page Header */}
          <motion.div
            variants={headerVariants}
            initial='hidden'
            animate='visible'
            style={{ width: '100%', marginBottom: 32 }}
          >
            <Header title='External Links' showBackButton />
            <Typography
              variant='body1'
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
                mt: 2,
                maxWidth: 600,
                mx: 'auto',
                fontSize: isMobile ? '0.9rem' : '1rem',
              }}
            >
              Explore external resources and links curated for you
            </Typography>
          </motion.div>

          {/* Links Grid */}
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            style={{ width: '100%' }}
          >
            {loading ? (
              <Box display='flex' justifyContent='center' py={8}>
                <Typography variant='body1' color='rgba(255, 255, 255, 0.6)'>
                  Loading external links...
                </Typography>
              </Box>
            ) : externalLinks.length > 0 ? (
              <Grid container spacing={isMobile ? 2 : 3}>
                {externalLinks.map((link: any, index: number) => {
                  const IconComponent = getIcon(index);
                  return (
                    <Box>
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ height: '100%' }}
                      >
                        <StyledCard>
                          <StatusChip label='Live' size='small' />

                          <CardContent
                            onClick={() => handleOpenLink(link.url, link.name)}
                          >
                            <IconWrapper>
                              <IconComponent
                                sx={{
                                  fontSize: isMobile ? 28 : 32,
                                  color: 'rgba(255, 255, 255, 0.9)',
                                }}
                              />
                            </IconWrapper>

                            <Typography
                              variant={isMobile ? 'subtitle1' : 'h6'}
                              fontWeight='600'
                              sx={{
                                color: 'white',
                                mb: 1,
                                textAlign: 'center',
                                lineHeight: 1.3,
                              }}
                            >
                              {link.name}
                            </Typography>

                            <Box
                              display='flex'
                              alignItems='center'
                              gap={0.5}
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                              <ArrowOutward sx={{ fontSize: 16 }} />
                              <Typography variant='caption'>
                                External Link
                              </Typography>
                            </Box>
                          </CardContent>

                          {/* Action Buttons */}
                          <Box
                            display='flex'
                            justifyContent='center'
                            gap={1}
                            mt={2}
                          >
                            <Tooltip title='Copy link'>
                              <ActionButton
                                onClick={(e) =>
                                  handleCopyLink(e, link.url, link.name)
                                }
                                size='small'
                              >
                                <ContentCopy sx={{ fontSize: 16 }} />
                                {!isMobile && 'Copy'}
                              </ActionButton>
                            </Tooltip>

                            <Tooltip title='Share link'>
                              <ActionButton
                                onClick={(e) =>
                                  handleShare(e, link.url, link.name)
                                }
                                size='small'
                              >
                                <Share sx={{ fontSize: 16 }} />
                                {!isMobile && 'Share'}
                              </ActionButton>
                            </Tooltip>
                          </Box>
                        </StyledCard>
                      </motion.div>
                    </Box>
                  );
                })}
              </Grid>
            ) : (
              <Fade in={!loading} timeout={800}>
                <Box
                  display='flex'
                  flexDirection='column'
                  alignItems='center'
                  justifyContent='center'
                  py={8}
                >
                  <LinkIcon
                    sx={{
                      fontSize: 64,
                      color: 'rgba(255, 255, 255, 0.3)',
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant='h6'
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      textAlign: 'center',
                      mb: 1,
                    }}
                  >
                    No External Links Available
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      textAlign: 'center',
                    }}
                  >
                    External links will appear here when available
                  </Typography>
                </Box>
              </Fade>
            )}
          </motion.div>
        </Box>
      </Container>
    </>
  );
}

export default ExternalLinks;
