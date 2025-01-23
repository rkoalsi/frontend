import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  Divider,
  Skeleton,
  Chip,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import axios from 'axios';
import AuthContext from '../../../src/components/Auth';

const PastOrders = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { user }: any = useContext(AuthContext);

  /**
   * Fetch orders from the backend
   */
  const getData = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(
        `${process.env.api_url}/orders?created_by=${user?.data?._id?.$oid}`
      );
      const { data = [] } = resp;
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  /**
   * Navigate to order details page
   */
  const handleOrderClick = (id: number) => {
    router.push(`/orders/past/${id}`);
  };

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      justifyContent='flex-start'
      sx={{
        minHeight: '100vh',
        width: '100%',
        gap: '16px',
        padding: isMobile ? '16px' : '32px',
      }}
    >
      {/* Header */}
      <Typography variant='h4' fontWeight='bold' sx={{ mb: 2, color: 'white' }}>
        Past Orders
      </Typography>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ width: '100%', maxWidth: '1200px', mt: 4 }}>
          <Skeleton variant='rectangular' height={100} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' height={100} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' height={100} />
        </Box>
      ) : (
        /* Orders List */
        <Box
          sx={{
            background: 'none',
            width: isMobile ? '100%' : '35%',
            borderRadius: '8px',
          }}
        >
          {orders.length > 0 ? (
            <List>
              {orders.map((order: any, index: number) => {
                return (
                  <React.Fragment key={order._id}>
                    <ListItem
                      component='button'
                      onClick={() => handleOrderClick(order._id)}
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        padding: '16px',
                        textAlign: 'flex-start',
                        backgroundColor: 'primary',
                        border: '2px solid #475569', // Prominent border
                        borderRadius: '8px',
                        marginBottom: '16px',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#475569',
                        },
                      }}
                    >
                      {/* Order Card */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          width: '100%',
                          maxWidth: '400px', // Limit the width of each card for a cleaner layout
                          textAlign: 'flex-start',
                        }}
                      >
                        {/* Order Details */}
                        <Typography
                          variant='h6'
                          fontWeight='bold'
                          color='black'
                        >
                          Order #
                          {order?.estimate_created
                            ? order?.estimate_number
                            : order._id.slice(0, 6)}
                        </Typography>
                        <Typography variant='body2' color='black'>
                          Customer: {order.customer_name}
                        </Typography>
                        <Typography variant='body2' color='black'>
                          Date:{' '}
                          {new Date(order.created_at).toLocaleDateString()}
                        </Typography>

                        {/* Order Status and Total */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '8px',
                          }}
                        >
                          <Chip
                            label={
                              order.status.charAt(0).toUpperCase() +
                              order.status.slice(1).toLowerCase()
                            }
                            color={
                              order?.status.toLowerCase() === 'draft' ||
                              order?.status.toLowerCase() === 'sent'
                                ? 'default'
                                : order?.status.toLowerCase() === 'accepted'
                                ? 'success'
                                : 'error'
                            }
                            sx={{
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              color: 'black',
                            }}
                          />
                          <Typography
                            variant='body1'
                            fontWeight='bold'
                            sx={{ color: 'black' }}
                          >
                            ₹{order?.total_amount || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < orders.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          ) : (
            <Typography
              variant='body1'
              align='center'
              sx={{ padding: '16px', color: 'white' }}
            >
              No past orders available.
            </Typography>
          )}
        </Box>
      )}

      {/* Navigation Buttons */}
      <Box display='flex' justifyContent='center' gap='8px' sx={{ mt: 2 }}>
        <Button
          variant='contained'
          color='secondary'
          onClick={() => router.push('/')}
        >
          Go Back
        </Button>
      </Box>
    </Box>
  );
};

export default PastOrders;
