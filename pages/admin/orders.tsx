import React, { useCallback, useEffect, useState } from 'react';
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
  IconButton,
  useTheme,
} from '@mui/material';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import {
  Delete,
  Download,
  Edit,
  FilterAlt,
  Visibility,
} from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';
import axios from 'axios';

const Orders = () => {
  const router = useRouter();
  const theme: any = useTheme();
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
  const [orderLoading, setOrderLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSalesPerson, setFilterSalesPerson] = useState<string>('');
  const [filterEstimatesCreated, setFilterEstimatesCreated] =
    useState<boolean>(false);
  const [filterEstimatesGreaterThanZero, setFilterEstimatesGreaterThanZero] =
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
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  const [searchEstimateNumber, setSearchEstimateNumber] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  useEffect(() => {
    const fetchSalesPeople = async () => {
      try {
        const response = await axiosInstance.get(`/admin/sales-people`);
        setSalesPeople(response.data.sales_people);
      } catch (error) {
        console.error(error);
        toast.error('Error fetching sales people.');
      }
    };

    fetchSalesPeople();
  }, []);
  const handleImageClick = useCallback((src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);
  const handleDownloadXLSX = async () => {
    try {
      const params: any = {
        ...(filterStartDate && { start_date: filterStartDate }),
        ...(filterEndDate && { end_date: filterEndDate }),
        ...(searchEstimateNumber && { estimate_number: searchEstimateNumber }),
      };

      if (filterStatus) params.status = filterStatus;
      if (filterSalesPerson) params.sales_person = filterSalesPerson;
      if (filterEstimatesCreated)
        params.estimate_created = filterEstimatesCreated;
      if (filterEstimatesGreaterThanZero) params.amount = true;
      console.log(params);
      const response = await axiosInstance.get('/admin/orders/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading XLSX:', error);
      toast.error('Failed to download XLSX file.');
    }
  };
  const handleClosePopup = useCallback(() => {
    setOpenImagePopup(false);
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
      // Build query parameters based on filters
      const params: any = {
        page,
        limit: rowsPerPage,
        ...(filterStartDate && { start_date: filterStartDate }),
        ...(filterEndDate && { end_date: filterEndDate }),
        ...(searchEstimateNumber && { estimate_number: searchEstimateNumber }),
      };

      if (filterStatus) params.status = filterStatus;
      if (filterSalesPerson) params.sales_person = filterSalesPerson;
      if (filterEstimatesCreated)
        params.estimate_created = filterEstimatesCreated;
      if (filterEstimatesGreaterThanZero) params.amount = true;
      const response = await axiosInstance.get(`/admin/orders`, {
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
  }, [page, rowsPerPage, !orderLoading]);

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

  const handleDownload = async (order: any) => {
    try {
      const resp = await axios.get(
        `${process.env.api_url}/orders/download_pdf/${order._id}`,
        {
          responseType: 'blob', // Receive the response as binary data
        }
      );

      // Check if the blob is an actual PDF or an error message
      if (resp.data.type !== 'application/pdf') {
        // Convert to text to read the error response
        toast.error('Draft Estimate Not Created');
        return;
      }

      // Extract filename from headers or set default
      const contentDisposition = resp.headers['content-disposition'];
      let fileName = `${order.estimate_number}.pdf`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // Create and trigger download
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF');
    }
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
  const handleDelete = async (order: any) => {
    setOrderLoading(true);
    try {
      const resp = await axiosInstance.delete(`/orders/${order._id}`);
      console.log(resp.data);
      if (resp.status === 200) {
        toast.success('Order Deleted Successfully');
      }
    } catch (error: any) {
      toast.error(error.response.data.detail || 'Error Deleting Order');
    } finally {
      setOrderLoading(false);
    }
  };
  const handleEnd = async (order: any, status = 'draft') => {
    const base = `${process.env.api_url}`;
    setOrderLoading(true);
    try {
      const resp = await axiosInstance.post(`${base}/orders/finalise`, {
        order_id: order._id,
        status,
      });
      console.log(resp.data);
      if (resp.status === 200) {
        if (resp.data.status == 'success') {
          toast.success(resp.data.message);
        } else {
          toast.error(resp.data.message);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setOrderLoading(false);
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
          <Box display='flex' alignItems='center' gap={2}>
            <TextField
              label='Search Estimate Number'
              variant='outlined'
              size='small'
              value={searchEstimateNumber}
              onChange={(e) => setSearchEstimateNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            />
            <Button
              variant='contained'
              startIcon={<Download />}
              onClick={handleDownloadXLSX}
            >
              Export
            </Button>
            <IconButton onClick={() => setOpenFilterModal(true)}>
              <FilterAlt />
            </IconButton>
          </Box>
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
                        <TableCell>Spreadsheet Created</TableCell>
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
                            <Checkbox
                              disabled
                              checked={order?.spreadsheet_created}
                            />
                          </TableCell>
                          <TableCell>
                            {order?.estimate_created
                              ? order?.estimate_number
                              : order._id.slice(-6)}
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
                                color={'warning'}
                                disabled={
                                  (order?.status?.toLowerCase() === 'draft'
                                    ? !!order?.estimate_created
                                    : !['deleted', 'sent'].includes(
                                        order?.status?.toLowerCase()
                                      )) || !order?.total_amount
                                }
                                onClick={() => handleEnd(order)}
                              >
                                Save As Draft
                              </Button>
                              <Button
                                variant='outlined'
                                color={'success'}
                                disabled={
                                  !order?.estimate_created ||
                                  ['deleted'].includes(
                                    order?.status?.toLowerCase()
                                  ) ||
                                  !['draft', 'sent', 'declined'].includes(
                                    order?.status?.toLowerCase()
                                  )
                                }
                                onClick={() => handleEnd(order, 'accepted')}
                              >
                                Accept
                              </Button>
                              <Button
                                variant='outlined'
                                color={'error'}
                                onClick={() => handleEnd(order, 'declined')}
                                disabled={
                                  !order?.estimate_created ||
                                  ['deleted'].includes(
                                    order?.status?.toLowerCase()
                                  ) ||
                                  !['draft', 'sent', 'accepted'].includes(
                                    order?.status?.toLowerCase()
                                  )
                                }
                              >
                                Decline
                              </Button>
                              <IconButton
                                color={'error'}
                                disabled={
                                  ['deleted'].includes(
                                    order?.status?.toLowerCase()
                                  ) || order?.estimate_created
                                }
                                onClick={() => handleDelete(order)}
                              >
                                <Delete />
                              </IconButton>
                              <IconButton
                                onClick={() =>
                                  router.push(`/orders/new/${order._id}`)
                                }
                                disabled={['invoiced'].includes(
                                  order?.status?.toLowerCase()
                                )}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                onClick={() => handleViewDetails(order)}
                              >
                                <Visibility />
                              </IconButton>
                              {order?.estimate_created && (
                                <IconButton
                                  onClick={() => handleDownload(order)}
                                >
                                  <Download />
                                </IconButton>
                              )}
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
                  {selectedOrder?.spreadsheet_created && (
                    <Typography>
                      <strong>Spreadsheet Created:</strong>{' '}
                      <Button
                        variant={'text'}
                        // variant='outlined'
                        sx={{
                          textTransform: 'none',
                          fontWeight: 'bold',
                          flex: 1,
                          color: theme.palette.primary.main,
                        }}
                        onClick={() =>
                          window.open(selectedOrder?.spreadsheet_url, '_blank')
                        }
                      >
                        Visit Link
                      </Button>
                    </Typography>
                  )}
                  {selectedOrder?.estimate_created && (
                    <Typography>
                      <strong>Estimate Number:</strong>{' '}
                      {selectedOrder?.estimate_number}
                    </Typography>
                  )}
                  {selectedOrder?.reference_number && (
                    <Typography>
                      <strong>Reference Number:</strong>{' '}
                      {selectedOrder?.reference_number}
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
                              onClick={() =>
                                handleImageClick(
                                  product.image_url || '/placeholder.png'
                                )
                              }
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
            <TextField
              label='Start Date'
              type='date'
              fullWidth
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />

            {/* End Date Picker */}
            <TextField
              label='End Date'
              type='date'
              fullWidth
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />
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

            <FormControlLabel
              control={
                <Checkbox
                  checked={filterEstimatesGreaterThanZero}
                  onChange={(e) =>
                    setFilterEstimatesGreaterThanZero(e.target.checked)
                  }
                />
              }
              label='Amount > 0'
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
                variant='contained'
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
      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default Orders;
