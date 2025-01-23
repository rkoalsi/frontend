import { useContext, useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import AuthContext from '../../src/components/Auth';
import axios from 'axios';
import { useRouter } from 'next/router';

const AdminDashboard = () => {
  const router = useRouter();
  const { user }: any = useContext(AuthContext);

  // State to store stats from server
  const [stats, setStats] = useState<any>({
    active_stock_products: 0,
    active_products: 0,
    inactive_products: 0,
    total_products: 0,
    out_of_stock_products: 0,
    active_customers: 0,
    active_sales_people: 0,
    orders_draft: 0,
    orders_sent: 0,
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

  // Updated cards array with sub-stats for Products and Orders
  const cards = [
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
    {
      label: 'Products',
      route: 'products',
      subStats: [
        { label: 'Active Stock Products', value: stats.active_stock_products },
        { label: 'Active Products', value: stats.active_products },
        { label: 'Inactive Products', value: stats.inactive_products },
        { label: 'Total Products', value: stats.total_products },
      ],
    },
    {
      label: 'Orders',
      route: 'orders',
      subStats: [
        { label: 'Draft', value: stats.orders_draft },
        { label: 'Sent', value: stats.orders_sent },
        { label: 'Accepted', value: stats.orders_accepted },
        { label: 'Declined', value: stats.orders_declined },
      ],
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
        Welcome, {user?.data?.first_name || 'User'}
      </Typography>
      <Typography variant='body1' sx={{ color: '#6B7280' }}>
        This is your central hub to manage users, view analytics, and update
        settings.
      </Typography>

      <Box mt={3}>
        {/* Card Grid */}
        <Grid container spacing={2} justifyContent={'center'}>
          {cards.map((card, idx) => {
            const isWideCard =
              card.label === 'Orders' || card.label === 'Products';
            return (
              <Grid
                item
                xs={12}
                sm={isWideCard ? 8 : 6}
                md={isWideCard ? 8 : 4}
                key={idx}
              >
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-3px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => router.push(`/admin/${card.route}`)}
                >
                  <CardContent>
                    {card.subStats ? (
                      <>
                        <Typography
                          variant='h6'
                          color='textSecondary'
                          gutterBottom
                          sx={{ fontWeight: 'bold', color: '#3f51b5', mb: 1 }}
                        >
                          {card.label}
                        </Typography>

                        <Divider sx={{ mb: 1 }} />

                        {/* Display each sub-stat in a grid */}
                        <Grid container spacing={1}>
                          {card.subStats.map((sub, subIdx) => (
                            <Grid item xs={6} key={subIdx}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                }}
                              >
                                <Typography
                                  variant='body2'
                                  color='textSecondary'
                                  sx={{ fontWeight: 'medium' }}
                                >
                                  {sub.label}
                                </Typography>
                                <Typography
                                  variant='h5'
                                  sx={{
                                    fontWeight: 'bold',
                                    color: '#2e7d32',
                                    mt: 0.5,
                                  }}
                                >
                                  {sub.value}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </>
                    ) : (
                      // Single-value layout for smaller cards
                      <>
                        <Typography
                          variant='h6'
                          color='textSecondary'
                          gutterBottom
                          sx={{ fontWeight: 'bold', color: '#3f51b5' }}
                        >
                          {card.label}
                        </Typography>
                        <Typography
                          variant='h4'
                          sx={{
                            fontWeight: 'bold',
                            color: '#2e7d32',
                          }}
                        >
                          {card.value}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Paper>
  );
};

export default AdminDashboard;
