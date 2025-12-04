import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  TablePagination,
  IconButton,
  Tooltip,
  Grid,
  Divider,
} from '@mui/material';
import { Visibility, Check, Close } from '@mui/icons-material';
import CommentIcon from '@mui/icons-material/Comment';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import { format } from 'date-fns';

interface Comment {
  _id: string;
  admin_id: string;
  admin_name: string;
  text: string;
  created_at: string;
  updated_at?: string;
  reply?: {
    user_id: string;
    user_name: string;
    user_role: string;
    text: string;
    created_at: string;
    updated_at?: string;
  };
}

interface AddressData {
  attention?: string;
  address?: string;
  street2?: string;
  city?: string;
  state?: string;
  state_code?: string;
  zip?: string;
  country?: string;
  phone?: string;
  fax?: string;
}

interface CustomerRequest {
  _id: string;
  shop_name: string;
  customer_name: string;
  address: string;
  gst_no?: string;
  pan_card_no?: string;
  whatsapp_no: string;
  payment_terms: string;
  multiple_branches: string;
  tier_category: string;
  sales_person: string;
  margin_details?: string;
  billing_address?: AddressData | string; // Support both old and new formats
  shipping_address?: AddressData | string; // Support both old and new formats
  place_of_supply?: string;
  customer_mail_id?: string;
  gst_treatment?: string;
  pincode?: string;
  in_ex?: string;
  created_by_name: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'admin_commented' | 'salesperson_replied' | 'created_on_zoho';
  admin_comments?: Comment[];
  zoho_contact_id?: string;
}

// Helper function to format address for display
const formatAddress = (address: AddressData | string | undefined): string => {
  if (!address) return '';
  if (typeof address === 'string') return address;

  const parts = [];
  if (address.attention) parts.push(address.attention);
  if (address.address) parts.push(address.address);
  if (address.street2) parts.push(address.street2);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.zip) parts.push(address.zip);
  if (address.country && address.country !== 'India') parts.push(address.country);
  if (address.phone) parts.push(`Ph: ${address.phone}`);

  return parts.join(', ');
};

// Helper function to get address field value safely
const getAddressField = (address: AddressData | string | undefined, field: keyof AddressData): string => {
  if (!address) return '';
  if (typeof address === 'string') {
    // For legacy string addresses, show the whole string in the main address field
    return field === 'address' ? address : '';
  }
  return address[field] || '';
};

const CustomerRequests = () => {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [page, rowsPerPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/customer_creation_requests/', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setRequests(response.data.requests);
      setTotalCount(response.data.total_count);
    } catch (error: any) {
      console.error('Error fetching customer requests:', error);
      toast.error('Failed to fetch customer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: CustomerRequest) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleUpdateStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await axiosInstance.put(`/customer_creation_requests/${requestId}/status`, null, {
        params: { status },
      });
      toast.success(`Request ${status} successfully`);
      fetchRequests();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedRequest) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await axiosInstance.post(`/customer_creation_requests/${selectedRequest._id}/comments`, {
        text: commentText,
      });
      toast.success('Comment added successfully');
      setCommentText('');

      // Refresh the selected request to show the new comment
      const response = await axiosInstance.get('/customer_creation_requests/', {
        params: { page: 1, limit: 1000 },
      });
      const updatedRequest = response.data.requests.find(
        (req: CustomerRequest) => req._id === selectedRequest._id
      );
      if (updatedRequest) {
        setSelectedRequest(updatedRequest);
      }
      fetchRequests();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning' as const, label: 'Pending' },
      approved: { color: 'success' as const, label: 'Approved' },
      rejected: { color: 'error' as const, label: 'Rejected' },
      admin_commented: { color: 'info' as const, label: 'Admin Commented' },
      salesperson_replied: { color: 'primary' as const, label: 'Salesperson Replied' },
      created_on_zoho: { color: 'success' as const, label: 'Created on Zoho' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  if (loading && requests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color:'white'}}>
        Customer Creation Requests
      </Typography>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Shop Name</strong></TableCell>
              <TableCell><strong>Customer Name</strong></TableCell>
              <TableCell><strong>Sales Person</strong></TableCell>
              <TableCell><strong>Created By</strong></TableCell>
              <TableCell><strong>Tier/Category</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Created Date</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                    No customer requests found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request._id} hover>
                  <TableCell>{request.shop_name}</TableCell>
                  <TableCell>{request.customer_name}</TableCell>
                  <TableCell>{request.sales_person}</TableCell>
                  <TableCell>{request.created_by_name || 'N/A'}</TableCell>
                  <TableCell>{request.tier_category}</TableCell>
                  <TableCell>{getStatusChip(request.status)}</TableCell>
                  <TableCell>
                    {request.created_at
                      ? format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Customer Request Details</Typography>
                {getStatusChip(selectedRequest.status)}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={4} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Shop Name"
                    value={selectedRequest.shop_name}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={selectedRequest.customer_name}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={selectedRequest.address}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    multiline
                    rows={2}
                  />
                </Grid>
                {/* Billing Address Section */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, mt: 2, color: 'primary.main' }}>
                    Billing Address
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={getAddressField(selectedRequest.billing_address, 'address') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Street 2"
                    value={getAddressField(selectedRequest.billing_address, 'street2') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={getAddressField(selectedRequest.billing_address, 'city') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="State"
                    value={getAddressField(selectedRequest.billing_address, 'state') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Pincode / ZIP"
                    value={getAddressField(selectedRequest.billing_address, 'zip') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={getAddressField(selectedRequest.billing_address, 'phone') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Attention"
                    value={getAddressField(selectedRequest.billing_address, 'attention') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>

                {/* Shipping Address Section */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, mt: 2, color: 'primary.main' }}>
                    Shipping Address
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={getAddressField(selectedRequest.shipping_address, 'address') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Street 2"
                    value={getAddressField(selectedRequest.shipping_address, 'street2') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={getAddressField(selectedRequest.shipping_address, 'city') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="State"
                    value={getAddressField(selectedRequest.shipping_address, 'state') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Pincode / ZIP"
                    value={getAddressField(selectedRequest.shipping_address, 'zip') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={getAddressField(selectedRequest.shipping_address, 'phone') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Attention"
                    value={getAddressField(selectedRequest.shipping_address, 'attention') || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Place Of Supply"
                    value={selectedRequest.place_of_supply || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    value={selectedRequest.pincode || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Customer Mail Id"
                    value={selectedRequest.customer_mail_id || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    type="email"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="GST Treatment"
                    value={selectedRequest.gst_treatment || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="GST No."
                    value={selectedRequest.gst_no || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="PAN Card No."
                    value={selectedRequest.pan_card_no || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="WhatsApp No."
                    value={selectedRequest.whatsapp_no}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Payment Terms"
                    value={selectedRequest.payment_terms}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Multiple Branches"
                    value={selectedRequest.multiple_branches || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Tier/Category"
                    value={selectedRequest.tier_category}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Sales Person"
                    value={selectedRequest.sales_person}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Tax Treatment"
                    value={selectedRequest.in_ex || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Created By"
                    value={selectedRequest.created_by_name || 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                {selectedRequest.margin_details && (
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Margin Details / Special Requests"
                      value={selectedRequest.margin_details}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      multiline
                      rows={3}
                    />
                  </Grid>
                )}
              </Grid>

              {/* Admin Comments Section */}
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography
                  variant="h6"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                >
                  <CommentIcon /> Comments
                </Typography>

                {/* Add Comment Field */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment for the sales person..."
                    variant="outlined"
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    sx={{ mt: 1 }}
                    disabled={!commentText.trim()}
                  >
                    Add Comment
                  </Button>
                </Box>

                {/* Existing Comments */}
                {selectedRequest.admin_comments && selectedRequest.admin_comments.length > 0 && (
                  <Box>
                    {selectedRequest.admin_comments.map((comment) => (
                      <Paper
                        key={comment._id}
                        sx={{ p: 1.5, my: 1, backgroundColor: '#fff3e0' }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {comment.admin_name}
                          </Typography>
                          <Typography variant="body2">{comment.text}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                            {comment.updated_at && ' (edited)'}
                          </Typography>
                        </Box>

                        {/* Reply display */}
                        {comment.reply && (
                          <Paper sx={{ p: 1, mt: 1, ml: 2, backgroundColor: '#e8f5e9' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                              {comment.reply.user_name} ({comment.reply.user_role})
                            </Typography>
                            <Typography variant="body2">{comment.reply.text}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(comment.reply.created_at), 'MMM dd, yyyy HH:mm')}
                              {comment.reply.updated_at && ' (edited)'}
                            </Typography>
                          </Paper>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseDialog}>Close</Button>
              {selectedRequest.status !== 'created_on_zoho' &&
                selectedRequest.status !== 'rejected' &&
                selectedRequest.status !== 'approved' && (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Close />}
                    onClick={() => handleUpdateStatus(selectedRequest._id, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Check />}
                    onClick={() => handleUpdateStatus(selectedRequest._id, 'approved')}
                  >
                    Approve & Create in Zoho
                  </Button>
                </>
              )}
              {selectedRequest.status === 'created_on_zoho' && selectedRequest.zoho_contact_id && (
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                  Zoho Contact ID: {selectedRequest.zoho_contact_id}
                </Typography>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CustomerRequests;
