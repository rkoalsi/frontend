import { Typography, Box, Paper } from '@mui/material';

const SalesPeople = () => {
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
        Sales People
      </Typography>
      <Typography variant='body1' sx={{ color: '#6B7280' }}>
        View Sales People Below
      </Typography>
    </Paper>
  );
};

export default SalesPeople;
