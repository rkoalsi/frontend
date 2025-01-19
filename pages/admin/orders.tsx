import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Drawer,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder]: any = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const baseApiUrl = process.env.api_url;
      const response = await axios.get(`${baseApiUrl}/orders?role=admin`);
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching orders.');
      setLoading(false);
    }
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <Box sx={{ padding: 3 }}>
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
          All Orders
        </Typography>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all orders below.
        </Typography>

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order._id}>
                    <TableCell>{order._id}</TableCell>
                    <TableCell>
                      {order.created_by_info?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>₹{order.total_amount || 0}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='outlined'
                        onClick={() => handleViewDetails(order)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Drawer for Order Details */}
        <Drawer
          anchor='right'
          open={drawerOpen}
          onClose={handleCloseDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: 400,
              padding: 3,
            },
          }}
        >
          <Box>
            <Typography
              variant='h5'
              gutterBottom
              sx={{
                fontWeight: 'bold',
                marginBottom: 2,
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              Order Details
            </Typography>
            {selectedOrder && (
              <>
                {/* Order Info */}
                <Box sx={{ marginBottom: 3 }}>
                  <Typography>
                    <strong>Order ID:</strong> {selectedOrder._id}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {selectedOrder.status}
                  </Typography>
                  <Typography>
                    <strong>Created By:</strong>{' '}
                    {selectedOrder.created_by_info?.name || 'Unknown'}
                  </Typography>
                  <Typography>
                    <strong>Total Amount:</strong> ₹
                    {selectedOrder.total_amount?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography>
                    <strong>Total GST:</strong> ₹
                    {selectedOrder.total_gst?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography>
                    <strong>Created At:</strong>{' '}
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </Typography>
                </Box>

                {/* Products Section */}
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 'bold',
                    marginBottom: 2,
                    fontFamily: 'Roboto, sans-serif',
                  }}
                >
                  Products
                </Typography>
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderRadius: 2,
                  }}
                >
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Image</TableCell>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.products.map((product: any) => (
                        <TableRow key={product.product_id.$oid}>
                          <TableCell>
                            <img
                              src={product.image_url || '/placeholder.png'}
                              alt={product.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                              }}
                            />
                          </TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>₹{product.price.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </Drawer>
      </Paper>
    </Box>
  );
};

export default Orders;
