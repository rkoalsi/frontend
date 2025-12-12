import React, { useState, useEffect, useContext } from 'react';
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
  Grid,
  TextField,
  TablePagination,
  IconButton,
  Tooltip,
  Divider,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme,
  MenuItem,
} from '@mui/material';
import { Visibility, Reply as ReplyIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import CommentIcon from '@mui/icons-material/Comment';
import { InputAdornment } from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../src/util/axios';
import { format } from 'date-fns';
import AuthContext from '../src/components/Auth';
import { useRouter } from 'next/router';

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
  const { user }: any = useContext(AuthContext);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Reply dialog states
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyDialogMode, setReplyDialogMode] = useState<'reply' | 'editReply'>('reply');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<CustomerRequest>>({});

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      router.push('/login');
      return;
    }
    fetchRequests();
  }, [page, rowsPerPage, user]);

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

  const handleOpenReplyDialog = (commentId: string) => {
    setSelectedCommentId(commentId);
    setReplyText('');
    setReplyDialogMode('reply');
    setReplyDialogOpen(true);
  };

  const handleOpenEditReplyDialog = (commentId: string, currentText: string) => {
    setSelectedCommentId(commentId);
    setReplyText(currentText);
    setReplyDialogMode('editReply');
    setReplyDialogOpen(true);
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !selectedRequest || !selectedCommentId) {
      toast.error('Please enter a reply');
      return;
    }

    setReplyLoading(true);
    try {
      if (replyDialogMode === 'reply') {
        await axiosInstance.post(
          `/customer_creation_requests/${selectedRequest._id}/comments/${selectedCommentId}/reply`,
          {
            reply: replyText,
            user_id: user?.data?._id,
            user_name: `${user?.data?.first_name || ''} ${user?.data?.last_name || ''}`.trim() || 'Salesperson',
            user_role: user?.data?.role || 'sales_person',
          }
        );
        toast.success('Reply added successfully');
      } else {
        await axiosInstance.put(
          `/customer_creation_requests/${selectedRequest._id}/comments/${selectedCommentId}/reply`,
          {
            reply: replyText,
            user_id: user?.data?._id,
            user_name: `${user?.data?.first_name || ''} ${user?.data?.last_name || ''}`.trim() || 'Salesperson',
            user_role: user?.data?.role || 'sales_person',
          }
        );
        toast.success('Reply updated successfully');
      }

      setReplyDialogOpen(false);
      setReplyText('');
      setSelectedCommentId(null);

      // Refresh the selected request
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
    } catch (error) {
      console.error(error);
      toast.error('Error processing request');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteReply = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this reply?') || !selectedRequest) return;

    setReplyLoading(true);
    try {
      await axiosInstance.delete(
        `/customer_creation_requests/${selectedRequest._id}/comments/${commentId}/reply`
      );
      toast.success('Reply deleted successfully');

      // Refresh the selected request
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
    } catch (error) {
      console.error(error);
      toast.error('Error deleting reply');
    } finally {
      setReplyLoading(false);
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

  // Filter requests based on search query
  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.shop_name?.toLowerCase().includes(query) ||
      request.customer_name?.toLowerCase().includes(query) ||
      request.created_by_name?.toLowerCase().includes(query) ||
      request.tier_category?.toLowerCase().includes(query) ||
      request.status?.toLowerCase().includes(query)
    );
  });

  if (loading && requests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #5A7CA4, #2B4864, #172335)',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600, color: '#ffffff' }}>
          My Customer Requests
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
          View the status of your customer creation requests below
        </Typography>

        {/* Search Bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by shop name, customer name, created by, tier/category, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.7)',
              },
            },
            '& .MuiOutlinedInput-input::placeholder': {
              color: 'rgba(255, 255, 255, 0.5)',
              opacity: 1,
            },
          }}
        />
      </Box>

      {/* Mobile Card View */}
      {isMobile ? (
        <>
          {filteredRequests.length === 0 ? (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                {searchQuery ? 'No customer requests found matching your search' : "You haven't submitted any customer requests yet"}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredRequests.map((request) => (
                <Card key={request._id} elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {request.shop_name}
                      </Typography>
                      {getStatusChip(request.status)}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Customer Name
                        </Typography>
                        <Typography variant="body2">{request.customer_name}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Created By
                        </Typography>
                        <Typography variant="body2">{request.created_by_name || 'N/A'}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Tier/Category
                        </Typography>
                        <Typography variant="body2">{request.tier_category}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Submitted Date
                        </Typography>
                        <Typography variant="body2">
                          {request.created_at
                            ? format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')
                            : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(request)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}

          <Paper
            elevation={3}
            sx={{
              mt: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 2,
            }}
          >
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={searchQuery ? filteredRequests.length : totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                '.MuiTablePagination-toolbar': {
                  flexWrap: 'wrap',
                  minHeight: 'auto',
                  paddingY: 1.5,
                  paddingX: 2,
                },
                '.MuiTablePagination-selectLabel': {
                  margin: 0,
                  marginBottom: { xs: 1, sm: 0 },
                  fontWeight: 500,
                },
                '.MuiTablePagination-displayedRows': {
                  margin: 0,
                  marginBottom: { xs: 1, sm: 0 },
                  fontWeight: 500,
                },
                '.MuiTablePagination-select': {
                  marginRight: { xs: 1, sm: 2 },
                },
                '.MuiTablePagination-actions': {
                  marginLeft: { xs: 0, sm: 2 },
                },
              }}
            />
          </Paper>
        </>
      ) : (
        /* Desktop Table View */
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Shop Name</strong></TableCell>
                <TableCell><strong>Customer Name</strong></TableCell>
                <TableCell><strong>Created By</strong></TableCell>
                <TableCell><strong>Tier/Category</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Submitted Date</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                      {searchQuery ? 'No customer requests found matching your search' : "You haven't submitted any customer requests yet"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request._id} hover>
                    <TableCell>{request.shop_name}</TableCell>
                    <TableCell>{request.customer_name}</TableCell>
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
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={searchQuery ? filteredRequests.length : totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              '.MuiTablePagination-toolbar': {
                flexWrap: 'wrap',
                minHeight: 'auto',
                paddingY: 1.5,
                paddingX: 2,
              },
              '.MuiTablePagination-selectLabel': {
                fontWeight: 500,
              },
              '.MuiTablePagination-displayedRows': {
                fontWeight: 500,
              },
            }}
          />
        </TableContainer>
      )}

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
                    value={getAddressField(selectedRequest.billing_address, 'address')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Street 2"
                    value={getAddressField(selectedRequest.billing_address, 'street2')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={getAddressField(selectedRequest.billing_address, 'city')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="State"
                    value={getAddressField(selectedRequest.billing_address, 'state')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Pincode / ZIP"
                    value={getAddressField(selectedRequest.billing_address, 'zip')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={getAddressField(selectedRequest.billing_address, 'phone')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Attention"
                    value={getAddressField(selectedRequest.billing_address, 'attention')}
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
                    value={getAddressField(selectedRequest.shipping_address, 'address')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Street 2"
                    value={getAddressField(selectedRequest.shipping_address, 'street2')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={getAddressField(selectedRequest.shipping_address, 'city')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="State"
                    value={getAddressField(selectedRequest.shipping_address, 'state')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Pincode / ZIP"
                    value={getAddressField(selectedRequest.shipping_address, 'zip')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={getAddressField(selectedRequest.shipping_address, 'phone')}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Attention"
                    value={getAddressField(selectedRequest.shipping_address, 'attention')}
                    InputProps={{ readOnly: true }}
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
                    select={isEditMode}
                  >
                    {isEditMode && [
                      <MenuItem key="business" value="Business GST">Business GST</MenuItem>,
                      <MenuItem key="unregistered" value="Unregistered Business">Unregistered Business</MenuItem>,
                      <MenuItem key="consumer" value="Consumer">Consumer</MenuItem>
                    ]}
                  </TextField>
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
                  <TextField
                    fullWidth
                    required
                    label="Tier/Category"
                    value={isEditMode ? editFormData.tier_category || '' : selectedRequest.tier_category}
                    onChange={(e) => handleEditFormChange('tier_category', e.target.value)}
                    InputProps={{ readOnly: !isEditMode }}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Sales Person"
                    value={isEditMode ? editFormData.sales_person || '' : selectedRequest.sales_person}
                    onChange={(e) => handleEditFormChange('sales_person', e.target.value)}
                    InputProps={{ readOnly: true }}
                    disabled
                    variant="outlined"
                    helperText={isEditMode ? "Auto-filled from your profile" : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditMode ? (
                    <TextField
                      fullWidth
                      label="Tax Treatment"
                      value={editFormData.in_ex || ''}
                      onChange={(e) => handleEditFormChange('in_ex', e.target.value)}
                      variant="outlined"
                      select
                    >
                      <MenuItem value="Inclusive">Inclusive</MenuItem>
                      <MenuItem value="Exclusive">Exclusive</MenuItem>
                    </TextField>
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
                    label="Submitted By"
                    value={selectedRequest.created_by_name || 'N/A'}
                    InputProps={{ readOnly: true }}
                    disabled
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Margin Details / Special Requests (DO NOT enter percentage symbol)"
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
              {selectedRequest.admin_comments && selectedRequest.admin_comments.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                  >
                    <CommentIcon /> Admin Comments
                  </Typography>

                  {selectedRequest.admin_comments.map((comment) => (
                    <Paper
                      key={comment._id}
                      sx={{ p: 1.5, my: 1, backgroundColor: '#fff3e0' }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {comment.admin_name}
                          </Typography>
                          <Typography variant="body2">{comment.text}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                            {comment.updated_at && ' (edited)'}
                          </Typography>
                        </Box>
                        {!comment.reply && (
                          <IconButton
                            size="small"
                            onClick={() => handleOpenReplyDialog(comment._id)}
                            disabled={replyLoading}
                            title="Reply"
                          >
                            <ReplyIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>

                      {/* Reply display */}
                      {comment.reply && (
                        <Paper sx={{ p: 1, mt: 1, ml: 2, backgroundColor: '#e8f5e9' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                {comment.reply.user_name} ({comment.reply.user_role})
                              </Typography>
                              <Typography variant="body2">{comment.reply.text}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(comment.reply.created_at), 'MMM dd, yyyy HH:mm')}
                                {comment.reply.updated_at && ' (edited)'}
                              </Typography>
                            </Box>
                            {comment.reply.user_id === user?.data?._id && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditReplyDialog(comment._id, comment.reply!.text)}
                                  disabled={replyLoading}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteReply(comment._id)}
                                  disabled={replyLoading}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
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
                  <Button onClick={handleCloseDialog}>
                    Close
                  </Button>
                  {selectedRequest.status !== 'created_on_zoho' &&
                    selectedRequest.status !== 'rejected' &&
                    selectedRequest.status !== 'approved' && (
                    <Button
                      onClick={handleEnterEditMode}
                      variant="contained"
                      color="primary"
                      startIcon={<EditIcon />}
                    >
                      Edit Request
                    </Button>
                  )}
                  {selectedRequest.status === 'created_on_zoho' && selectedRequest.zoho_contact_id && (
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500, mr: 2 }}>
                      Zoho Contact ID: {selectedRequest.zoho_contact_id}
                    </Typography>
                  )}
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {replyDialogMode === 'reply' ? 'Add Reply' : 'Edit Reply'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            multiline
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Enter your reply..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReplySubmit}
            variant="contained"
            disabled={replyLoading || !replyText.trim()}
          >
            {replyDialogMode === 'reply' ? 'Reply' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerRequests;
