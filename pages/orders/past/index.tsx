import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  Divider,
  Skeleton,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import axios from 'axios';
import AuthContext from '../../../src/components/Auth';
import { toast } from 'react-toastify';

type OrderType = {
  _id: string;
  estimate_created?: boolean;
  estimate_number?: string;
  customer_name: string;
  created_at: string;
  status: string;
  total_amount?: number;
};

const PastOrders = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [filterType, setFilterType] = useState<
    'all' | 'draft' | 'accepted' | 'declined' | 'invoiced'
  >('all');
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

      const queryParams = {
        status: filterType === 'all' ? '' : filterType,
        created_by: user?.data?._id,
      };

      // Build the query string
      const queryString = new URLSearchParams(queryParams).toString();

      const resp = await axios.get(
        `${process.env.api_url}/orders?${queryString}`
      );

      const { data = [] } = resp;
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to order details page
   */
  const handleOrderClick = (id: string) => {
    router.push(`/orders/past/${id}`);
  };

  /**
   * Delete a specific order
   */
  const deleteOrder = async (id: string) => {
    try {
      await axios.delete(`${process.env.api_url}/orders/${id}`);
      toast.success(`Order Deleted Successfully`);
      // Refresh orders after deletion
      getData();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(`Error Deleting Order`);
    }
  };

  /**
   * Clear empty orders
   */
  const clearEmptyOrders = async () => {
    try {
      await axios.delete(
        `${process.env.api_url}/orders/clear/${user?.data?._id}`
      );
      toast.success(`Empty Orders Deleted Successfully`);
      await getData();
    } catch (error) {
      console.log(error);
      toast.error(`Error Deleting Orders`);
    }
  };

  // Filter orders based on the selected dropdown value
  const filteredOrders = orders.filter((order) => {
    if (filterType === 'all') return true;
    if (filterType) return order.status;
    return true;
  });

  useEffect(() => {
    getData();
  }, [filterType]);

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      justifyContent='flex-start'
      sx={{
        width: '100%',
        gap: '16px',
        padding: isMobile ? '16px' : '32px',
      }}
    >
      {/* Header */}
      <Typography variant='h4' fontWeight='bold' sx={{ mb: 2, color: 'white' }}>
        Past Orders
      </Typography>

      {/* Dropdown for filtering orders */}
      <FormControl
        variant='outlined'
        sx={{ minWidth: isMobile ? 200 : 250, color: 'white' }}
      >
        <InputLabel id='order-filter-label' style={{ color: 'white' }}>
          Filter Orders
        </InputLabel>
        <Select
          labelId='order-filter-label'
          value={filterType}
          label='Filter Orders'
          style={{ color: 'white' }}
          onChange={(e) =>
            setFilterType(e.target.value as 'all' | 'draft' | 'accepted')
          }
        >
          <MenuItem value='all'>All Orders</MenuItem>
          <MenuItem value='draft'>Draft Orders</MenuItem>
          <MenuItem value='accepted'>Accepted Orders</MenuItem>
          <MenuItem value='declined'>Declined Orders</MenuItem>
          <MenuItem value='invoiced'>Invoiced Orders</MenuItem>
        </Select>
      </FormControl>

      <Button variant='contained' color='error' onClick={clearEmptyOrders}>
        Clear Empty Orders
      </Button>

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
          {filteredOrders.length > 0 ? (
            <List>
              {filteredOrders.map((order, index) => (
                <React.Fragment key={order._id}>
                  <ListItem
                    component='div'
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      textAlign: 'flex-start',
                      backgroundColor: 'white',
                      border: '2px solid #475569',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    <Box
                      onClick={() => handleOrderClick(order._id)}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        width: '100%',
                        maxWidth: '400px',
                        textAlign: 'flex-start',
                      }}
                    >
                      <Typography variant='h6' fontWeight='bold' color='black'>
                        Order #
                        {order.estimate_created
                          ? order.estimate_number
                          : order._id.slice(0, 6)}
                      </Typography>
                      <Typography variant='body2' color='black'>
                        Customer: {order.customer_name}
                      </Typography>
                      <Typography variant='body2' color='black'>
                        Date: {new Date(order.created_at).toLocaleDateString()}
                      </Typography>
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
                            order.status.toLowerCase() === 'draft' ||
                            order.status.toLowerCase() === 'sent'
                              ? 'default'
                              : order.status.toLowerCase() === 'accepted' ||
                                order.status.toLowerCase() === 'invoiced'
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
                          ₹{order.total_amount || 0}
                        </Typography>
                      </Box>
                    </Box>
                    {/* Conditionally render delete icon if order is NOT an estimate */}
                    {!order.estimate_created && (
                      <IconButton
                        onClick={() => deleteOrder(order._id)}
                        aria-label='delete order'
                        sx={{ ml: 2 }}
                        color='error'
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </ListItem>
                  {index < filteredOrders.length - 1 && <Divider />}
                </React.Fragment>
              ))}
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
