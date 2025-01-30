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
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

const PaymentsDue = () => {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0); // 0-based current page
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0); // total number of data from backend
  const [totalPagesCount, setTotalPagesCount] = useState(0); // total number of data from backend
  const [skipPage, setSkipPage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch data from the server
  const fetchData = async () => {
    setLoading(true);
    try {
      const baseApiUrl = process.env.api_url;
      // Pass page & limit for server-side pagination
      const response = await axios.get(
        `${baseApiUrl}/admin/payments_due?page=${page}&limit=${rowsPerPage}`
      );

      // The backend returns { data, total_count }
      const { invoices, total_count, total_pages } = response.data;

      setData(invoices);
      setTotalCount(total_count);
      setTotalPagesCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data whenever page or rowsPerPage changes
  useEffect(() => {
    fetchData();
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
          All Payments Due
        </Typography>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all due payments below.
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
            {data.length > 0 ? (
              <>
                {/* data Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Created At</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Invoice Number</TableCell>
                        <TableCell>Customer Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Sales Person</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.map((invoice: any) => {
                        const {
                          _id = '',
                          created_at = new Date(),
                          due_date = new Date(),
                          invoice_number = '',
                          customer_name = '',
                          status = '',
                          cf_sales_person = '',
                          salesperson_name = '',
                          created_by_name = '',
                          total = 0,
                          balance = 0,
                        } = invoice;
                        const invoiceDueDate = new Date(due_date);
                        invoiceDueDate.setHours(0, 0, 0, 0);

                        return (
                          <TableRow key={_id}>
                            <TableCell>
                              {new Date(created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {invoiceDueDate.toLocaleDateString()}
                            </TableCell>
                            <TableCell>{invoice_number}</TableCell>
                            <TableCell>{customer_name}</TableCell>
                            <TableCell>{capitalize(status)}</TableCell>
                            <TableCell>
                              {cf_sales_person || salesperson_name || '-'}
                            </TableCell>
                            <TableCell>{created_by_name}</TableCell>
                            <TableCell>₹{total || 0}</TableCell>
                            <TableCell>₹{balance || 0}</TableCell>
                            <TableCell>
                              <Box
                                display={'flex'}
                                flexDirection={'row'}
                                gap={'8px'}
                              >
                                <Button
                                  variant='outlined'
                                  onClick={() => handleViewDetails(invoice)}
                                >
                                  View Details
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                            : toast.error('Page is out of index')
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
                  No data Created
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
                  <Typography>
                    <strong>Status:</strong>{' '}
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
                <Box
                  display={'flex'}
                  justifyContent={'center'}
                  alignItems={'center'}
                  marginTop={'16px'}
                >
                  <Button
                    variant='contained'
                    onClick={() =>
                      router.push(`/data/new/${selectedOrder._id}`)
                    }
                  >
                    Edit Order
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Drawer>
      </Paper>
    </Box>
  );
};

export default PaymentsDue;
