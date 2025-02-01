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
  capitalize,
  TablePagination,
  TextField,
  Checkbox,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { FilterAlt } from '@mui/icons-material';

const Orders = () => {
  const router = useRouter();
  // Orders data
  const [orders, setOrders] = useState([]);

  // Pagination states
  const [page, setPage] = useState(0); // 0-based current page
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0); // total number of orders from backend
  const [totalPagesCount, setTotalPageCount] = useState(0); // total number of orders from backend

  // "Go to page" input
  const [skipPage, setSkipPage] = useState('');

  // Loading and selected order
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSalesPerson, setFilterSalesPerson] = useState<string>('');
  const [filterEstimatesCreated, setFilterEstimatesCreated] =
    useState<boolean>(false);
  const [salesPeople, setSalesPeople] = useState<string[]>([
    'SP1',
    'SP2',
    'SP3',
    'SP4',
    'SP5',
    'SP6',
    'SP7',
    'SP8',
    'SP9',
    'SP10',
    'SP11',
    'SP12',
    'SP13',
    'SP14',
    'SP15',
    'SP16',
    'SP17',
    'SP18',
    'SP19',
    'SP20',
    'SP21',
  ]);
  useEffect(() => {
    const fetchSalesPeople = async () => {
      try {
        const baseApiUrl = process.env.api_url;
        const response = await axios.get(`${baseApiUrl}/admin/sales-people`);
        setSalesPeople(response.data.sales_people);
      } catch (error) {
        console.error(error);
        toast.error('Error fetching sales people.');
      }
    };

    fetchSalesPeople();
  }, []);
  const applyFilters = () => {
    setPage(0); // reset page
    setOpenFilterModal(false);
    fetchOrders(); // fetch with new filters
  };
  // Fetch orders from the server
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const baseApiUrl = process.env.api_url;
      // Build query parameters based on filters
      const params: any = {
        page,
        limit: rowsPerPage,
      };

      if (filterStatus) params.status = filterStatus;
      if (filterSalesPerson) params.sales_person = filterSalesPerson;
      if (filterEstimatesCreated)
        params.estimate_created = filterEstimatesCreated;

      const response = await axios.get(`${baseApiUrl}/admin/orders`, {
        params,
      });

      // The backend returns { orders, total_count, total_pages }
      const { orders, total_count, total_pages } = response.data;

      setOrders(orders);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch orders whenever page or rowsPerPage changes
  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage]);

  // MUI Pagination: next/previous
  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
    setSkipPage(''); // reset skipPage so text field shows the new page
  };

  // MUI Pagination: rows per page
  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  // "Go to page" button or Enter
  const handleSkipPage = () => {
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    // Our internal page is 0-based; user typed 1-based
    setPage(requestedPage - 1);
    setSkipPage(''); // clear input so it displays the new page on next render
  };

  // Drawer logic
  const handleViewDetails = (order: any) => {
    console.log(order);
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };
  const getColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'invoiced':
        return 'green';
      case 'declined':
        return 'red';
      case 'deleted':
        return 'red';
      case 'accepted':
        return 'green';
      default:
        return 'black';
    }
  };
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
        <Box
          display={'flex'}
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            All Orders
          </Typography>
          <FilterAlt onClick={() => setOpenFilterModal(true)} />
        </Box>
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
          <>
            {orders.length > 0 ? (
              <>
                {/* Orders Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Created At</TableCell>
                        <TableCell>Estimate Created</TableCell>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Customer Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order: any) => (
                        <TableRow key={order._id}>
                          <TableCell>
                            {new Date(order.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              disabled
                              checked={order?.estimate_created}
                            />
                          </TableCell>
                          <TableCell>
                            {order?.estimate_created
                              ? order?.estimate_number
                              : order._id.slice(0, 6)}
                          </TableCell>
                          <TableCell>{order.customer_name}</TableCell>
                          <TableCell style={{ color: getColor(order.status) }}>
                            {capitalize(order.status)}
                          </TableCell>
                          <TableCell>
                            {order.created_by_info?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>₹{order.total_amount || 0}</TableCell>
                          <TableCell>
                            <Box
                              display={'flex'}
                              flexDirection={'row'}
                              gap={'8px'}
                            >
                              <Button
                                variant='outlined'
                                onClick={() => handleViewDetails(order)}
                              >
                                View Details
                              </Button>
                              <Button
                                variant='contained'
                                disabled={
                                  !order.status.toLowerCase().includes('draft')
                                }
                                onClick={() =>
                                  router.push(`/orders/new/${order._id}`)
                                }
                              >
                                Edit Order
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination + "Go to page" */}
                <Box
                  display={'flex'}
                  flexDirection={'row'}
                  alignItems={'end'}
                  justifyContent={'space-between'}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 2,
                      gap: '8px',
                    }}
                  >
                    <TablePagination
                      rowsPerPageOptions={[25, 50, 100, 200]}
                      component='div'
                      // totalCount from server
                      count={totalCount}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />

                    {/* "Go to page" UI */}
                    <Box
                      sx={{
                        ml: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <TextField
                        label='Go to page'
                        type='number'
                        variant='outlined'
                        size='small'
                        sx={{ width: 100, mr: 1 }}
                        // If user typed something, show that; otherwise, current page + 1
                        value={skipPage !== '' ? skipPage : page + 1}
                        onChange={(e) =>
                          parseInt(e.target.value) <= totalPagesCount
                            ? setSkipPage(e.target.value)
                            : toast.error('Invalid Page Number')
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSkipPage();
                          }
                        }}
                      />
                      <Button variant='contained' onClick={handleSkipPage}>
                        Go
                      </Button>
                    </Box>
                  </Box>
                  <Typography variant='subtitle1'>
                    Total Pages: {totalPagesCount}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box
                display={'flex'}
                justifyContent={'center'}
                alignItems={'center'}
              >
                <Typography variant='h5' fontWeight={'bold'}>
                  No Orders
                </Typography>
              </Box>
            )}
          </>
        )}
        {/* Drawer for Order Details */}
        <Drawer
          anchor='right'
          open={drawerOpen}
          onClose={handleCloseDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: 500,
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
                  {selectedOrder?.estimate_created && (
                    <Typography>
                      <strong>Estimate Number:</strong>{' '}
                      {selectedOrder?.estimate_number}
                    </Typography>
                  )}
                  <Typography>
                    <strong>Status:</strong>
                    {selectedOrder.status
                      ? capitalize(selectedOrder.status)
                      : ''}
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
                  <Typography>
                    <strong>Updated At:</strong>{' '}
                    {new Date(selectedOrder.updated_at).toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ marginBottom: 3 }}>
                  <Typography>
                    <strong>Billing Address</strong>
                  </Typography>
                  <Typography>
                    <strong>Attention:</strong>{' '}
                    {selectedOrder?.billing_address?.attention
                      ? selectedOrder?.billing_address?.attention
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Address:</strong>{' '}
                    {selectedOrder?.billing_address?.address
                      ? selectedOrder?.billing_address?.address
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Street:</strong>{' '}
                    {selectedOrder?.billing_address?.street2
                      ? selectedOrder?.billing_address?.street2
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>City:</strong>{' '}
                    {selectedOrder?.billing_address?.city
                      ? selectedOrder?.billing_address?.city
                      : ''}
                  </Typography>

                  <Typography>
                    <strong>State:</strong>{' '}
                    {selectedOrder?.billing_address?.state
                      ? selectedOrder?.billing_address?.state
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Zip:</strong>{' '}
                    {selectedOrder?.billing_address?.zip
                      ? selectedOrder?.billing_address?.zip
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Phone:</strong>{' '}
                    {selectedOrder?.billing_address?.phone
                      ? selectedOrder?.billing_address?.phone
                      : ''}
                  </Typography>
                </Box>
                <Box sx={{ marginBottom: 3 }}>
                  <Typography>
                    <strong>Shipping Address</strong>
                  </Typography>
                  <Typography>
                    <strong>Attention:</strong>{' '}
                    {selectedOrder?.shipping_address?.attention
                      ? selectedOrder?.shipping_address?.attention
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Address:</strong>{' '}
                    {selectedOrder?.shipping_address?.address
                      ? selectedOrder?.shipping_address?.address
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Street:</strong>{' '}
                    {selectedOrder?.shipping_address?.street2
                      ? selectedOrder?.shipping_address?.street2
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>City:</strong>{' '}
                    {selectedOrder?.shipping_address?.city
                      ? selectedOrder?.shipping_address?.city
                      : ''}
                  </Typography>

                  <Typography>
                    <strong>State:</strong>{' '}
                    {selectedOrder?.shipping_address?.state
                      ? selectedOrder?.shipping_address?.state
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Zip:</strong>{' '}
                    {selectedOrder?.shipping_address?.zip
                      ? selectedOrder?.shipping_address?.zip
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Phone:</strong>{' '}
                    {selectedOrder?.shipping_address?.phone
                      ? selectedOrder?.shipping_address?.phone
                      : ''}
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
                        <TableCell>Added By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {console.log(selectedOrder)}
                      {selectedOrder.products?.map((product: any) => (
                        <TableRow key={product.product_id}>
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
                          <TableCell>₹{product.price?.toFixed(2)}</TableCell>
                          <TableCell>
                            {capitalize(
                              product?.added_by?.split('_')?.join(' ')
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </Drawer>
        <Drawer
          anchor='right'
          open={openFilterModal}
          onClose={() => setOpenFilterModal(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 300,
              padding: 3,
            },
          }}
        >
          <Box>
            <Typography variant='h6' gutterBottom>
              Filter Orders
            </Typography>

            {/* Status Filter */}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id='status-filter-label'>Status</InputLabel>
              <Select
                labelId='status-filter-label'
                id='status-filter'
                value={filterStatus}
                label='Status'
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='draft'>Draft</MenuItem>
                <MenuItem value='sent'>Sent</MenuItem>
                <MenuItem value='declined'>Declined</MenuItem>
                <MenuItem value='accepted'>Accepted</MenuItem>
                <MenuItem value='invoiced'>Invoiced</MenuItem>
              </Select>
            </FormControl>

            {/* Sales Person Filter */}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id='sales-person-filter-label'>
                Sales Person
              </InputLabel>
              <Select
                labelId='sales-person-filter-label'
                id='sales-person-filter'
                value={filterSalesPerson}
                label='Sales Person'
                onChange={(e) => setFilterSalesPerson(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                {salesPeople.map((person) => (
                  <MenuItem key={person} value={person}>
                    {person}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Estimates Created Filter */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={filterEstimatesCreated}
                  onChange={(e) => setFilterEstimatesCreated(e.target.checked)}
                />
              }
              label='Estimates Created'
              sx={{ mt: 2 }}
            />

            {/* Apply Filters Button */}
            <Box sx={{ mt: 3 }}>
              <Button variant='contained' fullWidth onClick={applyFilters}>
                Apply Filters
              </Button>
            </Box>

            {/* Reset Filters Button */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant='outlined'
                fullWidth
                onClick={() => {
                  setFilterStatus('');
                  setFilterSalesPerson('');
                  setFilterEstimatesCreated(false);
                }}
              >
                Reset Filters
              </Button>
            </Box>
          </Box>
        </Drawer>
      </Paper>
    </Box>
  );
};

export default Orders;
