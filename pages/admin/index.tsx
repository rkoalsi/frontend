import { useContext, useEffect, useState } from 'react';
import { Typography, Paper, Box, Card, CardContent, Grid } from '@mui/material';
import AuthContext from '../../src/Auth';
import axios from 'axios';
import { useRouter } from 'next/router';

const AdminDashboard = () => {
  const router = useRouter();
  const { user }: any = useContext(AuthContext);

  // State to store stats from server
  const [stats, setStats] = useState<any>({
    active_products: 0,
    active_customers: 0,
    active_sales_people: 0,
    orders_draft: 0,
    orders_accepted: 0,
    orders_declined: 0,
  });

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${process.env.api_url}/admin/stats`);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  const cards = [
    {
      label: 'Active Products',
      value: stats.active_products,
      route: 'products',
    },
    {
      label: 'Active Customers',
      value: stats.active_customers,
      route: 'customers',
    },
    {
      label: 'Active Sales People',
      value: stats.active_sales_people,
      route: 'sales_people',
    },
    { label: 'Orders in Draft', value: stats.orders_draft, route: 'orders' },
    {
      label: 'Declined Orders',
      value: stats.orders_declined,
      route: 'orders',
    },
    {
      label: 'Accepted Orders',
      value: stats.orders_accepted,
      route: 'orders',
    },
  ];
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

      <Box mt={3}>
        {/* Card Grid */}
        <Grid container spacing={2}>
          {cards.map((card, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card
                sx={{ p: 2, borderRadius: 2 }}
                onClick={() => router.push(`/admin/${card.route}`)}
              >
                <CardContent>
                  <Typography
                    variant='h6'
                    color='textSecondary'
                    gutterBottom
                    sx={{ fontWeight: 'medium' }}
                  >
                    {card.label}
                  </Typography>
                  <Typography
                    variant='h3'
                    sx={{ fontWeight: 'bold', color: 'primary.main' }}
                  >
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default AdminDashboard;
