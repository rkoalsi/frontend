import { Typography, Paper } from '@mui/material';
import { useContext } from 'react';
import AuthContext from '../../src/Auth';

const AdminDashboard = () => {
  const { user }: any = useContext(AuthContext);
  return (
    <Paper
      elevation={3}
      sx={{
        padding: 4,
        borderRadius: 4,
        backgroundColor: 'white',
      }}
    >
      <Typography
        variant='h4'
        gutterBottom
        sx={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold' }}
      >
        Welcome, {user.data.first_name || 'User'}
      </Typography>
      <Typography variant='body1' sx={{ color: '#6B7280' }}>
        This is your central hub to manage users, view analytics, and update
        settings.
      </Typography>
    </Paper>
  );
};

export default AdminDashboard;
