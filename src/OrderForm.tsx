import { Box, Button, Typography, Stack } from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import AuthContext from './Auth';
import { useContext } from 'react';
import { motion } from 'framer-motion';

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

  const handleNewOrder = async () => {
    try {
      const resp = await axios.post(`${process.env.api_url}/orders/`, {
        created_by: user?.data?._id?.$oid,
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
        <Stack direction='row' spacing={4}>
          <motion.div
            variants={buttonVariants}
            whileHover='hover'
            whileTap='tap'
          >
            <Button
              variant='contained'
              color='primary'
              fullWidth
              onClick={handleNewOrder}
              sx={{
                padding: '12px 16px',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
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
              fullWidth
              onClick={handlePastOrder}
              sx={{
                padding: '12px 16px',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              Past Orders
            </Button>
          </motion.div>
        </Stack>
      </Box>
    </Box>
  );
};

export default OrderManagement;
