import { Box, Button, Stack, useMediaQuery, useTheme } from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import AuthContext from './Auth';
import { useContext } from 'react';
import { motion } from 'framer-motion';
import {
  Payment,
  ShoppingCart,
  ShoppingCartCheckout,
} from '@mui/icons-material';

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

const OrderManagement: React.FC = () => {
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

  return (
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
        </Stack>
      </Box>
    </Box>
  );
};

export default OrderManagement;
