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
  TablePagination,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Card,
  CardContent,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { toast } from 'react-toastify';
import {
  Delete,
  Edit,
  Visibility,
  LocationOn,
  CalendarToday,
  Person,
  ShoppingCart,
  Download,
  Sync,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../src/util/axios';

const ReturnOrders = () => {
  const router = useRouter();

  // State for return orders data and pagination
  const [returnOrders, setReturnOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [zohoLoading, setZohoLoading] = useState(false);
  // Dialog state for viewing details
  const [selectedOrder, setSelectedOrder]: any = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<string>('registered');

  // Fetch return orders from the server
  const fetchReturnOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get('/admin/return_orders', {
        params,
      });

      const { return_orders, total_count, total_pages } = response.data;
      setReturnOrders(return_orders || []);
      setTotalCount(total_count || 0);
      setTotalPageCount(total_pages || 0);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching return orders.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch return orders when page or rowsPerPage changes
  useEffect(() => {
    fetchReturnOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, !setActionLoading]);

  // Pagination handlers
  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
    setSkipPage('');
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  const handleSkipPage = () => {
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    setPage(requestedPage - 1);
    setSkipPage('');
  };

  // Handle view details
  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    // Set default invoice type based on customer's gst_treatment
    const gstTreatment = order.customer?.gst_treatment || order.gst_treatment;
    if (gstTreatment === 'consumer') {
      setInvoiceType('b2c_others');
    } else {
      setInvoiceType('registered');
    }
    setDetailDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (order: any) => {
    if (!window.confirm('Are you sure you want to delete this return order?')) {
      return;
    }

    setActionLoading(true);
    try {
      await axiosInstance.delete(`/admin/return_orders/${order._id}`);
      toast.success('Return order deleted successfully');
      fetchReturnOrders();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting return order');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle download report
  const handleDownloadReport = async () => {
    setDownloadLoading(true);
    try {
      toast.info('Preparing report for download...');

      const response = await axiosInstance.get(
        '/admin/return_orders/download_report',
        {
          responseType: 'blob', // Important for file downloads
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'return_orders_report.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Error downloading report. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };
  const handleStatusUpdate = async (order: any, newStatus: any) => {
    setActionLoading(true);
    try {
      const response = await axiosInstance.put(`/admin/return_orders/${order._id}/status`, {
        status: newStatus,
      });

      const updatedOrder = response.data.return_order;

      // Update the selectedOrder state to reflect the new status and Zoho data
      setSelectedOrder(updatedOrder);

      // Update the corresponding order in the returnOrders array
      setReturnOrders((prevOrders: any) =>
        prevOrders.map((returnOrder: any) =>
          returnOrder._id === order._id ? updatedOrder : returnOrder
        )
      );

      toast.success(`Return order status updated to ${newStatus}`);

      // Show Zoho credit note result if applicable
      if (response.data.zoho_creditnote) {
        if (response.data.zoho_creditnote.created) {
          toast.success(`Credit Note created: ${response.data.zoho_creditnote.creditnote_number}`);
        } else if (response.data.zoho_creditnote.error) {
          toast.warning(`Credit Note creation failed: ${response.data.zoho_creditnote.error}`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Error updating return order status');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Zoho Credit Note manually
  const handleCreateCreditNote = async (orderId: string) => {
    setZohoLoading(true);
    try {
      const response = await axiosInstance.post(`/admin/return_orders/${orderId}/create-zoho-creditnote`, {
        reference_invoice_type: invoiceType,
      });

      // Update the selectedOrder state with Zoho data
      setSelectedOrder((prev: any) => ({
        ...prev,
        zoho_creditnote_id: response.data.zoho_creditnote?.creditnote_id,
        zoho_creditnote_number: response.data.zoho_creditnote?.creditnote_number,
        zoho_creditnote_status: response.data.zoho_creditnote?.status,
      }));

      // Update the corresponding order in the returnOrders array
      setReturnOrders((prevOrders: any) =>
        prevOrders.map((returnOrder: any) =>
          returnOrder._id === orderId
            ? {
                ...returnOrder,
                zoho_creditnote_id: response.data.zoho_creditnote?.creditnote_id,
                zoho_creditnote_number: response.data.zoho_creditnote?.creditnote_number,
              }
            : returnOrder
        )
      );

      toast.success(`Credit Note created: ${response.data.zoho_creditnote?.creditnote_number}`);
    } catch (error: any) {
      console.error(error);
      const errorDetail = error.response?.data?.detail;
      if (typeof errorDetail === 'object') {
        toast.error(errorDetail.message || 'Error creating Credit Note');
        console.log('Zoho Error Details:', errorDetail);
      } else {
        toast.error(errorDetail || 'Error creating Credit Note');
      }
    } finally {
      setZohoLoading(false);
    }
  };

  // Update Zoho Credit Note (redo)
  const handleUpdateCreditNote = async (orderId: string) => {
    setZohoLoading(true);
    try {
      const response = await axiosInstance.put(`/admin/return_orders/${orderId}/update-zoho-creditnote`);

      setSelectedOrder((prev: any) => ({
        ...prev,
        zoho_creditnote_id: response.data.zoho_creditnote?.creditnote_id,
        zoho_creditnote_number: response.data.zoho_creditnote?.creditnote_number,
        zoho_creditnote_status: response.data.zoho_creditnote?.status,
      }));

      toast.success('Credit Note updated successfully');
    } catch (error: any) {
      console.error(error);
      const errorDetail = error.response?.data?.detail;
      toast.error(typeof errorDetail === 'string' ? errorDetail : 'Error updating Credit Note');
    } finally {
      setZohoLoading(false);
    }
  };

  // Download Credit Note PDF
  const handleDownloadCreditNotePdf = async (orderId: string) => {
    setZohoLoading(true);
    try {
      const response = await axiosInstance.get(
        `/admin/return_orders/${orderId}/download-creditnote-pdf`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `credit_note_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Credit Note PDF downloaded');
    } catch (error: any) {
      console.error(error);
      toast.error('Error downloading Credit Note PDF');
    } finally {
      setZohoLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: any) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status: any) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'default';
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'picked_up':
        return 'info';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Calculate total items
  const getTotalItems = (items: any) => {
    return (
      items?.reduce(
        (total: any, item: any) => total + (item.quantity || 0),
        0
      ) || 0
    );
  };

  return (
    <Box sx={{ padding: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={3}
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
          borderRadius: 4,
          backgroundColor: 'white',
        }}
      >
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={{ xs: 2, sm: 0 }}
          mb={2}
        >
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Return Orders Management
          </Typography>

          <Button
            variant='contained'
            startIcon={<Download />}
            onClick={handleDownloadReport}
            disabled={downloadLoading || loading}
            sx={{
              backgroundColor: '#2E7D32',
              '&:hover': {
                backgroundColor: '#1B5E20',
              },
            }}
          >
            {downloadLoading ? 'Preparing...' : 'Download Report'}
          </Button>
        </Box>

        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all return orders from customers below.
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
            {returnOrders.length > 0 ? (
              <>
                {/* Return Orders Table */}
                <TableContainer component={Paper} elevation={1}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Customer
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Created At
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Items</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Reason
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Status
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Created by
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {returnOrders.map((order: any) => (
                        <TableRow key={order._id} hover>
                          <TableCell>
                            <Box display='flex' alignItems='center' gap={1}>
                              <Person color='action' />
                              <Box>
                                <Typography variant='body2' fontWeight='medium'>
                                  {order.customer_name}
                                </Typography>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  ID: {order.customer_id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box display='flex' alignItems='center' gap={1}>
                              <CalendarToday color='action' fontSize='small' />
                              <Typography variant='body2'>
                                {formatDate(order.return_date)}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box display='flex' alignItems='center' gap={1}>
                              <ShoppingCart color='action' fontSize='small' />
                              <Typography variant='body2'>
                                {getTotalItems(order.items)} items
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Typography
                              variant='body2'
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {order.return_reason}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={order.status?.toUpperCase() || 'UNKNOWN'}
                              color={getStatusColor(order.status)}
                              size='small'
                              variant='outlined'
                            />
                          </TableCell>

                          <TableCell>
                            <Typography
                              variant='body2'
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {order?.created_by_user?.name || 'Unknown User'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Box display='flex' gap={1}>
                              <IconButton
                                onClick={() => handleViewDetails(order)}
                                color='primary'
                                size='small'
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDelete(order)}
                                color='error'
                                size='small'
                                disabled={actionLoading}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                <Box
                  display='flex'
                  flexDirection='row'
                  alignItems='center'
                  justifyContent='space-between'
                  mt={2}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TablePagination
                      rowsPerPageOptions={[25, 50, 100, 200]}
                      component='div'
                      count={totalCount}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />

                    {/* Go to page */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        label='Go to page'
                        type='number'
                        variant='outlined'
                        size='small'
                        sx={{ width: 120 }}
                        value={skipPage !== '' ? skipPage : page + 1}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value <= totalPagesCount) {
                            setSkipPage(e.target.value);
                          } else {
                            toast.error('Invalid Page Number');
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSkipPage();
                          }
                        }}
                      />
                      <Button
                        variant='contained'
                        onClick={handleSkipPage}
                        size='small'
                      >
                        Go
                      </Button>
                    </Box>
                  </Box>

                  <Typography variant='subtitle1' color='text.secondary'>
                    Total Pages: {totalPagesCount}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box
                display='flex'
                justifyContent='center'
                alignItems='center'
                minHeight='200px'
              >
                <Typography variant='h6' color='text.secondary'>
                  No Return Orders Found
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' fontWeight='bold'>
            Return Order Details
          </Typography>
        </DialogTitle>

        <DialogContent>
          {selectedOrder && (
            <Box gap={3}>
              {/* Customer Information */}
              <Box>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='h6' gutterBottom color='primary'>
                      Customer Information
                    </Typography>
                    <Typography variant='body2' gutterBottom>
                      <strong>Name:</strong> {selectedOrder.customer_name}
                    </Typography>
                    <Typography variant='body2' gutterBottom>
                      <strong>Customer ID:</strong> {selectedOrder.customer_id}
                    </Typography>
                    <Typography variant='body2' gutterBottom>
                      <strong>Created By:</strong>{' '}
                      {selectedOrder?.created_by_user?.name || 'Unknown User'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Order Information */}
              <Box>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='h6' gutterBottom color='primary'>
                      Order Information
                    </Typography>
                    {selectedOrder.return_form_date && (
                      <Typography variant='body2' gutterBottom>
                        <strong>Return Form Date:</strong>{' '}
                        {formatDate(selectedOrder.return_form_date)}
                      </Typography>
                    )}
                    <Typography variant='body2' gutterBottom>
                      <strong>Return Date:</strong>{' '}
                      {formatDate(selectedOrder.return_date)}
                    </Typography>
                    {selectedOrder.contact_no && (
                      <Typography variant='body2' gutterBottom>
                        <strong>Contact Number:</strong> {selectedOrder.contact_no}
                      </Typography>
                    )}
                    {selectedOrder.box_count && (
                      <Typography variant='body2' gutterBottom>
                        <strong>Box Count:</strong> {selectedOrder.box_count}
                      </Typography>
                    )}
                    <Typography variant='body2' gutterBottom>
                      <strong>Status:</strong>{' '}
                      <Chip
                        label={selectedOrder.status?.toUpperCase()}
                        color={getStatusColor(selectedOrder.status)}
                        size='small'
                      />
                    </Typography>
                    <Typography variant='body2' gutterBottom>
                      <strong>Reason:</strong> {selectedOrder.return_reason}
                    </Typography>
                    {(() => {
                      const docs = selectedOrder.debit_note_documents?.length
                        ? selectedOrder.debit_note_documents
                        : selectedOrder.debit_note_document
                        ? [selectedOrder.debit_note_document]
                        : [];
                      return docs.length > 0 ? (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant='body2' gutterBottom>
                            <strong>Debit Note Documents ({docs.length}):</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
                            {docs.map((doc: string, idx: number) => (
                              <Typography key={idx} variant='body2'>
                                <a
                                  href={doc}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  style={{
                                    color: '#1976d2',
                                    textDecoration: 'underline',
                                  }}
                                >
                                  Document {idx + 1}
                                </a>
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              </Box>

              {/* Pickup Address */}
              <Box>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='h6' gutterBottom color='primary'>
                      <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Pickup Address
                    </Typography>
                    {selectedOrder.pickup_address && (
                      <Box>
                        <Typography variant='body2' gutterBottom>
                          <strong>Attention:</strong>{' '}
                          {selectedOrder.pickup_address.attention}
                        </Typography>
                        <Typography variant='body2' gutterBottom>
                          <strong>Address:</strong>{' '}
                          {selectedOrder.pickup_address.address}
                        </Typography>
                        <Typography variant='body2' gutterBottom>
                          <strong>City:</strong>{' '}
                          {selectedOrder.pickup_address.city},{' '}
                          {selectedOrder.pickup_address.state}
                        </Typography>
                        <Typography variant='body2' gutterBottom>
                          <strong>ZIP:</strong>{' '}
                          {selectedOrder.pickup_address.zip}
                        </Typography>
                        <Typography variant='body2' gutterBottom>
                          <strong>Phone:</strong>{' '}
                          {selectedOrder.pickup_address.phone}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Items */}
              <Box>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='h6' gutterBottom color='primary'>
                      Return Items
                    </Typography>
                    {selectedOrder.items?.map((item: any, index: any) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box display='flex' alignItems='center' gap={2}>
                          <Avatar
                            src={item.image_url}
                            alt={item.product_name}
                            variant='rounded'
                            sx={{ width: 60, height: 60 }}
                          />
                          <Box flex={1}>
                            <Typography variant='body1' fontWeight='medium'>
                              {item.product_name}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              SKU: {item.sku}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Quantity: {item.quantity}
                            </Typography>
                          </Box>
                        </Box>
                        {index < selectedOrder.items.length - 1 && (
                          <Divider sx={{ mt: 2 }} />
                        )}
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Box>

              {/* Status Update Actions */}
              <Box>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='h6' gutterBottom color='primary'>
                      Update Status
                    </Typography>
                    <Box display='flex' gap={1} flexWrap='wrap'>
                      {['draft', 'approved', 'picked_up', 'rejected', 'completed'].map(
                        (status) => (
                          <Button
                            key={status}
                            variant={
                              selectedOrder.status === status
                                ? 'contained'
                                : 'outlined'
                            }
                            color={getStatusColor(status) as any}
                            size='small'
                            onClick={() =>
                              handleStatusUpdate(selectedOrder, status)
                            }
                            disabled={
                              actionLoading || selectedOrder.status === status
                            }
                          >
                            {status.toUpperCase()}
                          </Button>
                        )
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Zoho Credit Note Info */}
              <Box>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='h6' gutterBottom color='primary'>
                      Zoho Credit Note
                    </Typography>
                    {selectedOrder.zoho_creditnote_id ? (
                      <Box>
                        <Box display='flex' alignItems='center' gap={1} mb={1}>
                          <CheckCircle color='success' fontSize='small' />
                          <Typography variant='body2' color='success.main'>
                            Credit Note Created
                          </Typography>
                        </Box>
                        <Typography variant='body2' gutterBottom>
                          <strong>Credit Note Number:</strong>{' '}
                          {selectedOrder.zoho_creditnote_number || 'N/A'}
                        </Typography>
                        <Typography variant='body2' gutterBottom>
                          <strong>Credit Note ID:</strong>{' '}
                          {selectedOrder.zoho_creditnote_id}
                        </Typography>
                        {selectedOrder.zoho_creditnote_status && (
                          <Typography variant='body2' gutterBottom>
                            <strong>Status:</strong>{' '}
                            <Chip
                              label={selectedOrder.zoho_creditnote_status.toUpperCase()}
                              size='small'
                              color='info'
                            />
                          </Typography>
                        )}
                        <Box display='flex' gap={1} mt={2} flexWrap='wrap'>
                          <Button
                            variant='outlined'
                            color='primary'
                            size='small'
                            startIcon={zohoLoading ? <CircularProgress size={16} color='inherit' /> : <Sync />}
                            onClick={() => handleUpdateCreditNote(selectedOrder._id)}
                            disabled={zohoLoading}
                          >
                            {zohoLoading ? 'Updating...' : 'Update Credit Note'}
                          </Button>
                          <Button
                            variant='outlined'
                            color='secondary'
                            size='small'
                            startIcon={zohoLoading ? <CircularProgress size={16} color='inherit' /> : <Download />}
                            onClick={() => handleDownloadCreditNotePdf(selectedOrder._id)}
                            disabled={zohoLoading}
                          >
                            Download PDF
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <Box display='flex' alignItems='center' gap={1} mb={2}>
                          <ErrorIcon color='warning' fontSize='small' />
                          <Typography variant='body2' color='text.secondary'>
                            No Credit Note created yet
                          </Typography>
                        </Box>
                        <TextField
                          size='small'
                          label='Invoice Type'
                          value={invoiceType === 'registered' ? 'Registered Business' : 'B2C Others'}
                          disabled
                          sx={{ minWidth: 200, mb: 2 }}
                        />
                        <Box>
                          <Button
                            variant='contained'
                            color='primary'
                            size='small'
                            startIcon={zohoLoading ? <CircularProgress size={16} color='inherit' /> : <Sync />}
                            onClick={() => handleCreateCreditNote(selectedOrder._id)}
                            disabled={zohoLoading || selectedOrder.status === 'draft'}
                          >
                            {zohoLoading ? 'Creating...' : 'Create Credit Note'}
                          </Button>
                        </Box>
                        {selectedOrder.status === 'draft' && (
                          <Typography variant='caption' display='block' color='text.secondary' mt={1}>
                            Change status to create credit note
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReturnOrders;
