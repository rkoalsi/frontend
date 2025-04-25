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
} from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../../src/components/common/Header';
import { motion } from 'framer-motion';
import { ContentCopy, MenuBook, Share } from '@mui/icons-material';

// Styled Paper for Glassmorphism Effect
const StyledCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0px 4px 20px rgba(0,0,0,0.25)',
  transition: 'all 0.3s ease-in-out',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const CardContent = styled(Box)({
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
  transition: 'all 0.2s ease-in-out',
  flex: 1,
});

const ShareButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  borderRadius: 8,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
}));

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

interface Props {}

function Catalogue(props: Props) {
  const {} = props;
  const [brands, setBrands] = useState<any[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch catalogues from API
  const getData = async () => {
    try {
      const resp = await axios.get(`${process.env.api_url}/catalogues`);
      setBrands(resp?.data);
    } catch (error: any) {
      console.log(error);
      toast.error(error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // Open Catalogue in new tab
  const handleOpenCatalogue = async (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Copy single catalogue link to clipboard
  const handleCopyLink = (
    event: React.MouseEvent,
    url: string,
    name: string
  ) => {
    event.stopPropagation();
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success(`${name} catalogue link copied to clipboard!`);
      })
      .catch((err) => {
        toast.error('Failed to copy link');
        console.error('Could not copy text: ', err);
      });
  };

  // Share all catalogues
  const handleShareAll = () => {
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
  };

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      sx={{
        width: '100%',
        padding: isMobile ? 2 : 4,
      }}
    >
      {/* Page Header */}
      <Header title='View Catalogues' showBackButton />

      {/* Share All Button */}
      <motion.div
        variants={itemVariants}
        initial='hidden'
        animate='visible'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '12px',
          marginBottom: '16px',
          maxWidth: '900px',
          width: '100%',
        }}
      >
        <ShareButton
          startIcon={<Share />}
          onClick={handleShareAll}
          disabled={brands.length === 0}
          fullWidth={isMobile}
          size={isMobile ? 'medium' : 'large'}
        >
          Share All Catalogues
        </ShareButton>
      </motion.div>

      {/* Catalogue Box Layout with Stack */}
      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        style={{ width: '100%', maxWidth: '900px' }}
      >
        {brands.length > 0 ? (
          <Box sx={{ width: '100%' }}>
            <Stack
              direction={isMobile ? 'column' : 'row'}
              gap={3}
              spacing={isMobile ? 1 : 3}
              flexWrap='wrap'
            >
              {brands.map((b: any, index: number) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <StyledCard>
                    <CardContent
                      onClick={() => handleOpenCatalogue(b.image_url)}
                      display='flex'
                      flexDirection='column'
                      alignItems='center'
                      p={1}
                    >
                      {/* Catalogue Icon */}
                      <MenuBook sx={{ fontSize: '48px', color: '#e3f2fd' }} />

                      {/* Catalogue Title */}
                      <Typography
                        variant='h6'
                        fontWeight='bold'
                        sx={{ color: 'white', mt: 1, textAlign: 'center' }}
                      >
                        {b.name} Catalogue
                      </Typography>
                    </CardContent>

                    {/* Copy Link Button */}
                    <Box display='flex' justifyContent='center' mt={1}>
                      <Tooltip title='Copy catalogue link'>
                        <IconButton
                          onClick={(e) =>
                            handleCopyLink(e, b.image_url, b.name)
                          }
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            gap: '8px',
                            '&:hover': {
                              color: 'white',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                          size='small'
                        >
                          Copy Link
                          <ContentCopy fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </StyledCard>
                </motion.div>
              ))}
            </Stack>
          </Box>
        ) : (
          <Typography
            variant='body1'
            sx={{
              textAlign: 'center',
              mt: 3,
              color: 'rgba(255,255,255,0.8)',
              width: '100%',
              padding: 2,
            }}
          >
            No catalogues available.
          </Typography>
        )}
      </motion.div>
    </Box>
  );
}

export default Catalogue;
