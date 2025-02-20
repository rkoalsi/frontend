import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  useTheme,
  useMediaQuery,
  styled,
} from '@mui/material';
import CustomButton from '../../src/components/common/Button';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../../src/components/common/Header';
import { motion } from 'framer-motion';
import { MenuBook } from '@mui/icons-material';

// Styled Paper for Glassmorphism Effect
const StyledCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0px 4px 20px rgba(0,0,0,0.25)',
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0px 8px 25px rgba(0,0,0,0.3)',
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
  const [brands, setBrands] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      {/* Catalogue Grid */}
      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        style={{ width: '100%', maxWidth: '900px', marginTop: '24px' }}
      >
        <Grid container spacing={3} justifyContent='center'>
          {brands.length > 0 ? (
            brands.map((b: any, index: number) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <StyledCard onClick={() => handleOpenCatalogue(b.image_url)}>
                    <Box
                      display='flex'
                      flexDirection='column'
                      alignItems='center'
                      p={2}
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
                    </Box>
                  </StyledCard>
                </motion.div>
              </Grid>
            ))
          ) : (
            <Typography
              variant='body1'
              sx={{
                textAlign: 'center',
                mt: 3,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              No catalogues available.
            </Typography>
          )}
        </Grid>
      </motion.div>
    </Box>
  );
}

export default Catalogue;
