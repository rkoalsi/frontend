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
  Card,
  CardContent,
  alpha,
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
import { trackActivity } from '../../../src/util/trackActivity';

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

  useEffect(() => {
    if (user) {
      trackActivity({ action: 'view_orders_list', category: 'orders' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    <Container maxWidth='lg' sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: { xs: 2, md: 4 },
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
            padding: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                sx={{ fontWeight: 700, mb: 0.5 }}
              >
                My Orders (Estimates)
              </Typography>
              <Typography
                variant='body2'
                sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                View and track all your orders
              </Typography>
            </Box>

            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleNewOrder}
              size={isMobile ? 'medium' : 'large'}
              sx={{
                backgroundColor: '#38a169',
                '&:hover': { backgroundColor: '#2f855a' },
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Create New Order
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <TextField
              placeholder='Search orders...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size='small'
              sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: { sm: 220 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon color='action' />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl
              size='small'
              sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' }, minWidth: { sm: 150 } }}
            >
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

        {/* Orders List */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {filteredOrders.length > 0 ? (
            <>
              {/* Desktop Table */}
              <TableContainer sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Order Number</TableCell>
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
                        onClick={() => router.push(`/customer/orders/${order._id}`)}
                      >
                        <TableCell>
                          <Typography fontWeight={500}>
                            #{order.order_number || order._id.slice(-6)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {order.created_at
                            ? format(new Date(order.created_at), 'PP')
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
                        <TableCell>{order.products?.length || 0} items</TableCell>
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

              {/* Mobile Cards */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                {filteredOrders.map((order) => (
                  <Card
                    key={order._id}
                    elevation={0}
                    onClick={() => router.push(`/customer/orders/${order._id}`)}
                    sx={{
                      mb: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1.5,
                        }}
                      >
                        <Box>
                          <Typography fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                            #{order.order_number || order._id.slice(-6)}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {order.created_at
                              ? format(new Date(order.created_at), 'PP')
                              : 'N/A'}
                          </Typography>
                        </Box>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size='small'
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant='body2' color='text.secondary'>
                          {order.products?.length || 0} item
                          {(order.products?.length || 0) !== 1 ? 's' : ''}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: 'primary.main',
                          }}
                        >
                          <Visibility sx={{ fontSize: 14 }} />
                          <Typography variant='caption' fontWeight={500}>
                            View
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color='primary'
                    size={isMobile ? 'small' : 'medium'}
                  />
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ py: { xs: 6, sm: 8 }, textAlign: 'center' }}>
              <ShoppingCartOutlined
                sx={{ fontSize: { xs: 48, sm: 64 }, color: 'grey.300', mb: 2 }}
              />
              <Typography
                variant='h6'
                color='text.secondary'
                gutterBottom
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                No orders found
              </Typography>
              <Typography
                color='text.secondary'
                sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
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
