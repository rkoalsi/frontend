'use client';
import { useContext, useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Container,
  useTheme,
  useMediaQuery,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import AuthContext from '../../../src/components/Auth';
import {
  Search as SearchIcon,
  ShoppingCartOutlined,
  Add,
  Visibility,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../../src/util/axios';
import { format } from 'date-fns';
import axios from 'axios';

interface Order {
  _id: string;
  order_number?: string;
  status: string;
  total?: number;
  created_at: string;
  products?: any[];
  customer?: any;
}

const CustomerOrders = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/orders`, {
        params: {
          created_by: user?.data?._id,
          page,
          limit: itemsPerPage,
          ...(statusFilter !== 'all' && { status: statusFilter }),
        },
      });

      const orderList = data.orders || data || [];
      setOrders(orderList);
      setTotalPages(Math.ceil((data.total || orderList.length) / itemsPerPage));
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [user, page, statusFilter]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  // Create new order
  const handleNewOrder = async () => {
    try {
      const resp = await axios.post(`${process.env.api_url}/orders/`, {
        created_by: user?.data?._id,
        status: 'draft',
      });
      const { data = {} } = resp;
      const { _id = '' } = data;
      router.push(`/orders/new/${_id}`);
    } catch (error) {
      console.error('Error creating new order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'accepted':
        return 'primary';
      case 'invoiced':
        return 'success';
      case 'declined':
        return 'error';
      case 'delivered':
        return 'success';
      default:
        return 'default';
    }
  };

  // Filter orders by search term
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    const orderNumber = order.order_number || order._id.slice(-6);
    return (
      orderNumber.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower)
    );
  });

  if (loading && orders.length === 0) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <CircularProgress sx={{ color: '#38a169' }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth='lg' sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 4,
          overflow: 'hidden',
          minHeight: '80vh',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%)',
            color: 'white',
            padding: { xs: 3, md: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                sx={{ fontWeight: 700, mb: 1 }}
              >
                My Orders (Estimates)
              </Typography>
              <Typography variant='body1' sx={{ opacity: 0.9 }}>
                View and track all your orders
              </Typography>
            </Box>

            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleNewOrder}
              sx={{
                backgroundColor: '#38a169',
                '&:hover': { backgroundColor: '#2f855a' },
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5,
              }}
            >
              Create New Order
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <TextField
              placeholder='Search orders...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size='small'
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon color='action' />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label='Status'
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value='all'>All Status</MenuItem>
                <MenuItem value='draft'>Draft</MenuItem>
                <MenuItem value='accepted'>Accepted</MenuItem>
                <MenuItem value='invoiced'>Invoiced</MenuItem>
                <MenuItem value='declined'>Declined</MenuItem>
                <MenuItem value='delivered'>Delivered</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Orders Table */}
        <Box sx={{ p: 3 }}>
          {filteredOrders.length > 0 ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Order Number
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Items</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order._id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() =>
                          router.push(`/customer/orders/${order._id}`)
                        }
                      >
                        <TableCell>
                          <Typography fontWeight={500}>
                            #{order.order_number || order._id.slice(-6)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {order.created_at
                            ? format(new Date(order.created_at), 'PPp')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            color={getStatusColor(order.status) as any}
                            size='small'
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          {order.products?.length || 0} items
                        </TableCell>
                        <TableCell>
                          <Button
                            size='small'
                            startIcon={<Visibility />}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/customer/orders/${order._id}`);
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box
                  sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
                >
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color='primary'
                  />
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <ShoppingCartOutlined
                sx={{ fontSize: 64, color: 'grey.300', mb: 2 }}
              />
              <Typography variant='h6' color='text.secondary' gutterBottom>
                No orders found
              </Typography>
              <Typography color='text.secondary' sx={{ mb: 3 }}>
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first order to get started'}
              </Typography>
              {!searchTerm && statusFilter === 'all' && (
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={handleNewOrder}
                  sx={{
                    backgroundColor: '#38a169',
                    '&:hover': { backgroundColor: '#2f855a' },
                    textTransform: 'none',
                  }}
                >
                  Create Order
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerOrders;
