import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useContext } from 'react';
import AuthContext from '../src/components/Auth';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  Payment,
  ShoppingCart,
  ShoppingCartCheckout,
} from '@mui/icons-material';
import axios from 'axios';
const Home = () => {
  const router = useRouter();
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const handleNewOrder = async () => {
    try {
      const resp = await axios.post(`${process.env.api_url}/orders/`, {
        created_by: user?.data?._id,
        status: 'draft',
      });
      const { data = {} } = resp;
      const { _id = '' } = data;
      router.push(`/orders/new/${_id}`);
    } catch (error) {
      console.error('Error creating new order:', error);
    }
  };

  const handlePastOrder = () => {
    router.push('/orders/past');
  };

  const handlePaymentsDue = () => {
    router.push('/orders/past/payment_due');
  };

  const handleCatelogues = () => {
    router.push('/catalogues');
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
      transition: {
        duration: 0.3,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100vh',
        width: '100%',
        padding: '16px',
        color: 'white',
      }}
    >
      {/* Header */}
      <Paper
        sx={{
          background: 'none',
          width: '100%',
          padding: '16px',
          textAlign: 'center',
          boxShadow: 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            padding: '16px',
            gap: '16px',
          }}
        >
          <Typography variant='h4' fontWeight='bold' color={'white'}>
            Welcome, {user?.data?.first_name || 'Guest'}!
          </Typography>
          <Typography variant='body1' color={'white'}>
            Your gateway to seamless order management.
          </Typography>
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
          >
            <Box
              sx={{
                textAlign: 'center',
              }}
            >
              <Stack direction={isMobile ? 'column' : 'row'} spacing={4}>
                <motion.div
                  variants={buttonVariants}
                  whileHover='hover'
                  whileTap='tap'
                >
                  <Button
                    variant='contained'
                    color='primary'
                    startIcon={<ShoppingCart />}
                    sx={{
                      fontSize: '1.2rem',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                    }}
                    fullWidth
                    onClick={handleNewOrder}
                  >
                    New Order
                  </Button>
                </motion.div>
                <motion.div
                  variants={buttonVariants}
                  whileHover='hover'
                  whileTap='tap'
                >
                  <Button
                    variant='contained'
                    color='secondary'
                    startIcon={<ShoppingCartCheckout />}
                    sx={{
                      fontSize: '1.2rem',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                    }}
                    fullWidth
                    onClick={handlePastOrder}
                  >
                    Past Orders
                  </Button>
                </motion.div>
                <motion.div
                  variants={buttonVariants}
                  whileHover='hover'
                  whileTap='tap'
                >
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={<Payment />}
                    sx={{
                      fontSize: '1.2rem',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                    }}
                    fullWidth
                    onClick={handlePaymentsDue}
                  >
                    Payments Due
                  </Button>
                </motion.div>
                <motion.div
                  variants={buttonVariants}
                  whileHover='hover'
                  whileTap='tap'
                >
                  <Button
                    variant='contained'
                    color='info'
                    startIcon={<Payment />}
                    sx={{
                      fontSize: '1.2rem',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                    }}
                    fullWidth
                    onClick={handleCatelogues}
                  >
                    Catelogues
                  </Button>
                </motion.div>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;
