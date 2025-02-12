import {
  Box,
  Typography,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useContext } from 'react';
import AuthContext from '../src/components/Auth';
import { useRouter } from 'next/router';
import {
  Campaign,
  LibraryBooks,
  Payment,
  ShoppingCart,
  ShoppingCartCheckout,
  VideoLibrary,
} from '@mui/icons-material';
import CustomButton from '../src/components/common/Button';
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
  const handleTraining = () => {
    router.push('/training');
  };
  const handleAnnouncements = () => {
    router.push('/announcements');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        // minHeight: '100vh',
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
              <Stack direction={'column'} spacing={4}>
                <CustomButton
                  large
                  icon={<ShoppingCart />}
                  text={'New Order'}
                  color={'primary'}
                  onClick={handleNewOrder}
                />
                <CustomButton
                  large
                  icon={<ShoppingCartCheckout />}
                  text={'Past Orders'}
                  color={'secondary'}
                  onClick={handlePastOrder}
                />
                <CustomButton
                  large
                  icon={<Payment />}
                  color={'info'}
                  text={'Payments Due'}
                  onClick={handlePaymentsDue}
                />
                <CustomButton
                  large
                  icon={<LibraryBooks />}
                  color={'primary'}
                  text={'Catalogues'}
                  onClick={handleCatelogues}
                />
                <CustomButton
                  large
                  icon={<VideoLibrary />}
                  color={'secondary'}
                  text={'Training Videos'}
                  onClick={handleTraining}
                />
                <CustomButton
                  large
                  icon={<Campaign />}
                  color={'info'}
                  text={'Announcements'}
                  onClick={handleAnnouncements}
                />
              </Stack>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;
