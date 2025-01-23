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
    active_products: 0,
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

  // Updated cards array with one card for Orders
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
        <Grid container spacing={2}>
          {cards.map((card, idx) => {
            // Make the Orders card span the full width
            const isOrdersCard = card.label === 'Orders';
            return (
              <Grid
                item
                xs={12}
                sm={isOrdersCard ? 12 : 6}
                md={isOrdersCard ? 12 : 4}
                key={idx}
              >
                <Card
                  sx={{ p: 2, borderRadius: 2, cursor: 'pointer' }}
                  onClick={() => router.push(`/admin/${card.route}`)}
                >
                  <CardContent>
                    {/* If the card has subStats (i.e., Orders), render them differently */}
                    {card.subStats ? (
                      <>
                        <Typography
                          variant='h5'
                          color='textSecondary'
                          gutterBottom
                          sx={{ fontWeight: 'medium' }}
                        >
                          {card.label}
                        </Typography>

                        <Divider sx={{ mb: 2 }} />

                        {/* Display each sub-stat in a grid */}
                        <Grid container spacing={2}>
                          {card.subStats.map((sub, subIdx) => (
                            <Grid item xs={6} sm={3} key={subIdx}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                }}
                              >
                                <Typography
                                  variant='h5'
                                  color='textSecondary'
                                  sx={{ fontWeight: 500 }}
                                >
                                  {sub.label}
                                </Typography>
                                <Typography
                                  variant='h3'
                                  sx={{
                                    fontWeight: 'bold',
                                    color: 'primary.main',
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
                      // Original single-value layout for the other cards
                      <>
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
