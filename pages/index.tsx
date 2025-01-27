import { Box, Typography, Paper } from '@mui/material';
import { useContext } from 'react';
import AuthContext from '../src/components/Auth';
import OrderForm from '../src/components/OrderForm';

const Home = () => {
  const { user }: any = useContext(AuthContext);

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
          <OrderForm />
        </Box>
      </Paper>

      {/* Action Buttons */}
    </Box>
  );
};

export default Home;
