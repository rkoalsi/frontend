import { Typography, Box, Paper } from '@mui/material';

const Settings = () => {
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
        sx={{
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
        }}
      >
        Settings
      </Typography>
      <Typography variant='body1' sx={{ color: '#6B7280' }}>
        Update your application settings here.
      </Typography>
    </Paper>
  );
};

export default Settings;
