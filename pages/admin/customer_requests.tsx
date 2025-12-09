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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Visibility, Check, Close, Edit as EditIcon } from '@mui/icons-material';
import CommentIcon from '@mui/icons-material/Comment';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';


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

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<CustomerRequest>>({});

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
    setEditFormData(request);
    setIsEditMode(false);
    setDetailsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedRequest(null);
    setIsEditMode(false);
    setEditFormData({});
  };

  const handleEnterEditMode = () => {
    if (selectedRequest) {
      setEditFormData(selectedRequest);
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    if (selectedRequest) {
      setEditFormData(selectedRequest);
    }
    setIsEditMode(false);
  };

  const handleEditFormChange = (field: keyof CustomerRequest, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (
    addressType: 'billing_address' | 'shipping_address',
    field: string,
    value: string
  ) => {
    setEditFormData(prev => {
      const currentAddress = prev[addressType];
      const updatedAddress = typeof currentAddress === 'object' && currentAddress !== null
        ? { ...currentAddress, [field]: value }
        : { [field]: value };

      return {
        ...prev,
        [addressType]: updatedAddress
      };
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;

    // Validation
    if (!editFormData.shop_name || !editFormData.customer_name ||
        !editFormData.whatsapp_no || !editFormData.payment_terms || !editFormData.tier_category ||
        !editFormData.billing_address || !editFormData.shipping_address || !editFormData.place_of_supply ||
        !editFormData.customer_mail_id || !editFormData.gst_treatment || !editFormData.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editFormData.gst_no && !editFormData.pan_card_no) {
      toast.error('Please provide either GST No. or PAN Card No.');
      return;
    }

    try {
      await axiosInstance.put(`/customer_creation_requests/${selectedRequest._id}`, {
        shop_name: editFormData.shop_name,
        customer_name: editFormData.customer_name,
        gst_no: editFormData.gst_no,
        pan_card_no: editFormData.pan_card_no,
        whatsapp_no: editFormData.whatsapp_no,
        payment_terms: editFormData.payment_terms,
        multiple_branches: editFormData.multiple_branches,
        tier_category: editFormData.tier_category,
        sales_person: editFormData.sales_person,
        margin_details: editFormData.margin_details,
        billing_address: editFormData.billing_address,
        shipping_address: editFormData.shipping_address,
        place_of_supply: editFormData.place_of_supply,
        customer_mail_id: editFormData.customer_mail_id,
        gst_treatment: editFormData.gst_treatment,
        pincode: editFormData.pincode,
        in_ex: editFormData.in_ex,
      });
      toast.success('Request updated successfully');

      // Refresh data
      fetchRequests();

      // Update selected request
      const response = await axiosInstance.get('/customer_creation_requests/', {
        params: { page: 1, limit: 1000 },
      });
      const updatedRequest = response.data.requests.find(
        (req: CustomerRequest) => req._id === selectedRequest._id
      );
      if (updatedRequest) {
        setSelectedRequest(updatedRequest);
        setEditFormData(updatedRequest);
      }

      setIsEditMode(false);
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast.error(error?.response?.data?.detail || 'Failed to update request');
    }
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

      // Extract detailed error message from response
      let errorMessage = 'Failed to update request status';

      if (error.response?.data?.detail) {
        // FastAPI returns error details in the 'detail' field
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Display the detailed error message
      toast.error(errorMessage, {
        autoClose: 10000, // Show for 10 seconds to give user time to read
        style: { whiteSpace: 'pre-wrap' } // Preserve line breaks
      });
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
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: 'white' }}>
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
              requests.map((request) => {
                return (<TableRow key={request._id} hover>
                  <TableCell>{request.shop_name}</TableCell>
                  <TableCell>{request.customer_name}</TableCell>
                  <TableCell>{request.sales_person}</TableCell>
                  <TableCell>{request.created_by_name || 'N/A'}</TableCell>
                  <TableCell>{request.tier_category}</TableCell>
                  <TableCell>{getStatusChip(request.status)}</TableCell>
                  <TableCell>
                    {request.created_at
                      ? format(
                        toZonedTime(new Date(request.created_at), 'Asia/Kolkata'),
                        'MMM dd, yyyy HH:mm'
                      )
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
                )
              })
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
                <Typography variant="h6">
                  {isEditMode ? 'Edit Customer Request' : 'Customer Request Details'}
                </Typography>
                {getStatusChip(selectedRequest.status)}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={4} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Shop Name"
                    value={isEditMode ? editFormData.shop_name || '' : selectedRequest.shop_name}
                    onChange={(e) => handleEditFormChange('shop_name', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Customer Name"
                    value={isEditMode ? editFormData.customer_name || '' : selectedRequest.customer_name}
                    onChange={(e) => handleEditFormChange('customer_name', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
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
                    value={isEditMode ? getAddressField(editFormData.billing_address, 'address') : (getAddressField(selectedRequest.billing_address, 'address') || 'N/A')}
                    onChange={(e) => handleAddressChange('billing_address', 'address', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Street 2"
                    value={isEditMode ? getAddressField(editFormData.billing_address, 'street2') : (getAddressField(selectedRequest.billing_address, 'street2') || 'N/A')}
                    onChange={(e) => handleAddressChange('billing_address', 'street2', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={isEditMode ? getAddressField(editFormData.billing_address, 'city') : (getAddressField(selectedRequest.billing_address, 'city') || 'N/A')}
                    onChange={(e) => handleAddressChange('billing_address', 'city', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="State"
                    value={isEditMode ? getAddressField(editFormData.billing_address, 'state') : (getAddressField(selectedRequest.billing_address, 'state') || 'N/A')}
                    onChange={(e) => handleAddressChange('billing_address', 'state', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Pincode / ZIP"
                    value={isEditMode ? getAddressField(editFormData.billing_address, 'zip') : (getAddressField(selectedRequest.billing_address, 'zip') || 'N/A')}
                    onChange={(e) => handleAddressChange('billing_address', 'zip', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={isEditMode ? getAddressField(editFormData.billing_address, 'phone') : (getAddressField(selectedRequest.billing_address, 'phone') || 'N/A')}
                    onChange={(e) => handleAddressChange('billing_address', 'phone', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Attention"
                    value={isEditMode ? getAddressField(editFormData.billing_address, 'attention') : (getAddressField(selectedRequest.billing_address, 'attention') || 'N/A')}
                    onChange={(e) => handleAddressChange('billing_address', 'attention', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
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
                    value={isEditMode ? getAddressField(editFormData.shipping_address, 'address') : (getAddressField(selectedRequest.shipping_address, 'address') || 'N/A')}
                    onChange={(e) => handleAddressChange('shipping_address', 'address', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Street 2"
                    value={isEditMode ? getAddressField(editFormData.shipping_address, 'street2') : (getAddressField(selectedRequest.shipping_address, 'street2') || 'N/A')}
                    onChange={(e) => handleAddressChange('shipping_address', 'street2', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={isEditMode ? getAddressField(editFormData.shipping_address, 'city') : (getAddressField(selectedRequest.shipping_address, 'city') || 'N/A')}
                    onChange={(e) => handleAddressChange('shipping_address', 'city', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="State"
                    value={isEditMode ? getAddressField(editFormData.shipping_address, 'state') : (getAddressField(selectedRequest.shipping_address, 'state') || 'N/A')}
                    onChange={(e) => handleAddressChange('shipping_address', 'state', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Pincode / ZIP"
                    value={isEditMode ? getAddressField(editFormData.shipping_address, 'zip') : (getAddressField(selectedRequest.shipping_address, 'zip') || 'N/A')}
                    onChange={(e) => handleAddressChange('shipping_address', 'zip', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={isEditMode ? getAddressField(editFormData.shipping_address, 'phone') : (getAddressField(selectedRequest.shipping_address, 'phone') || 'N/A')}
                    onChange={(e) => handleAddressChange('shipping_address', 'phone', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Attention"
                    value={isEditMode ? getAddressField(editFormData.shipping_address, 'attention') : (getAddressField(selectedRequest.shipping_address, 'attention') || 'N/A')}
                    onChange={(e) => handleAddressChange('shipping_address', 'attention', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Place Of Supply"
                    value={isEditMode ? editFormData.place_of_supply || '' : (selectedRequest.place_of_supply || '')}
                    onChange={(e) => handleEditFormChange('place_of_supply', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Pincode"
                    value={isEditMode ? editFormData.pincode || '' : (selectedRequest.pincode || '')}
                    onChange={(e) => handleEditFormChange('pincode', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Customer Mail Id"
                    value={isEditMode ? editFormData.customer_mail_id || '' : (selectedRequest.customer_mail_id || '')}
                    onChange={(e) => handleEditFormChange('customer_mail_id', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                    type="email"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="GST Treatment"
                    value={isEditMode ? editFormData.gst_treatment || '' : (selectedRequest.gst_treatment || '')}
                    onChange={(e) => handleEditFormChange('gst_treatment', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="GST No."
                    value={isEditMode ? editFormData.gst_no || '' : (selectedRequest.gst_no || 'N/A')}
                    onChange={(e) => handleEditFormChange('gst_no', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                    helperText={isEditMode ? "GST No. or PAN Card No. is required" : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="PAN Card No."
                    value={isEditMode ? editFormData.pan_card_no || '' : (selectedRequest.pan_card_no || 'N/A')}
                    onChange={(e) => handleEditFormChange('pan_card_no', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                    helperText={isEditMode ? "GST No. or PAN Card No. is required" : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="WhatsApp No."
                    value={isEditMode ? editFormData.whatsapp_no || '' : selectedRequest.whatsapp_no}
                    onChange={(e) => handleEditFormChange('whatsapp_no', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Payment Terms"
                    value={isEditMode ? editFormData.payment_terms || '' : selectedRequest.payment_terms}
                    onChange={(e) => handleEditFormChange('payment_terms', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Multiple Branches"
                    value={isEditMode ? editFormData.multiple_branches || '' : (selectedRequest.multiple_branches || 'N/A')}
                    onChange={(e) => handleEditFormChange('multiple_branches', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditMode ? (
                    <FormControl fullWidth required>
                      <InputLabel>Tier/Category</InputLabel>
                      <Select
                        label="Tier/Category"
                        value={editFormData.tier_category || ''}
                        onChange={(e) => handleEditFormChange('tier_category', e.target.value)}
                      >
                        <MenuItem value="A+">A+</MenuItem>
                        <MenuItem value="A">A</MenuItem>
                        <MenuItem value="B">B</MenuItem>
                        <MenuItem value="C">C</MenuItem>
                        <MenuItem value="D">D</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      label="Tier/Category"
                      value={selectedRequest.tier_category}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                    />
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Sales Person"
                    value={isEditMode ? editFormData.sales_person || '' : selectedRequest.sales_person}
                    onChange={(e) => handleEditFormChange('sales_person', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditMode ? (
                    <FormControl fullWidth>
                      <InputLabel>Tax Treatment</InputLabel>
                      <Select
                        label="Tax Treatment"
                        value={editFormData.in_ex || ''}
                        onChange={(e) => handleEditFormChange('in_ex', e.target.value)}
                      >
                        <MenuItem value="Inclusive">Inclusive</MenuItem>
                        <MenuItem value="Exclusive">Exclusive</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      label="Tax Treatment"
                      value={selectedRequest.in_ex || 'N/A'}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                    />
                  )}
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
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Margin Details / Special Requests"
                    value={isEditMode ? editFormData.margin_details || '' : (selectedRequest.margin_details || '')}
                    onChange={(e) => handleEditFormChange('margin_details', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                    multiline
                    rows={3}
                  />
                </Grid>
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
                            {format(
                              toZonedTime(new Date(comment.created_at), 'Asia/Kolkata'),
                              'MMM dd, yyyy HH:mm'
                            )}
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
                              {format(
                                toZonedTime(new Date(comment.reply.created_at), 'Asia/Kolkata'),
                                'MMM dd, yyyy HH:mm'
                              )}
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
              {isEditMode ? (
                <>
                  <Button onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} variant="contained" color="primary">
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleCloseDialog}>Close</Button>
                  {selectedRequest.status !== 'created_on_zoho' &&
                    selectedRequest.status !== 'rejected' && (
                      <Button
                        onClick={handleEnterEditMode}
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                      >
                        Edit Request
                      </Button>
                    )}
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
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CustomerRequests;
