import React, { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  CircularProgress,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../util/axios';
import AuthContext from './Auth';

interface CustomerCreationRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CustomerCreationRequestForm: React.FC<CustomerCreationRequestFormProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { user }: any = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: '',
    customer_name: '',
    address: '',
    gst_no: '',
    pan_card_no: '',
    whatsapp_no: '',
    payment_terms: '',
    multiple_branches: '',
    tier_category: '',
    sales_person: '',
    margin_details: ''
  });

  // Auto-fill sales person when dialog opens
  useEffect(() => {
    if (open && user?.data) {
      const isSalesPerson = user.data.role === 'sales_person';
      const salesPersonValue = isSalesPerson
        ? user.data.code || user.data.first_name
        : `${user.data.first_name || ''} ${user.data.last_name || ''}`.trim();

      setFormData(prev => ({
        ...prev,
        sales_person: salesPersonValue
      }));
    }
  }, [open, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.shop_name || !formData.customer_name || !formData.address ||
        !formData.whatsapp_no || !formData.payment_terms || !formData.tier_category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.gst_no && !formData.pan_card_no) {
      toast.error('Please provide either GST No. or PAN Card No.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/customer_creation_requests/', formData);
      toast.success('Customer creation request submitted successfully!');

      // Reset form
      const isSalesPerson = user?.data?.role === 'sales_person';
      const salesPersonValue = isSalesPerson
        ? user?.data?.code || user?.data?.first_name
        : `${user?.data?.first_name || ''} ${user?.data?.last_name || ''}`.trim();

      setFormData({
        shop_name: '',
        customer_name: '',
        address: '',
        gst_no: '',
        pan_card_no: '',
        whatsapp_no: '',
        payment_terms: '',
        multiple_branches: '',
        tier_category: '',
        sales_person: salesPersonValue,
        margin_details: ''
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Error submitting customer creation request:', error);
      toast.error(error?.response?.data?.detail || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h5" component="div" fontWeight={600}>
                Request New Customer Creation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Fill in the details below to request admin approval for customer creation
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              disabled={loading}
              sx={{ mt: -1, mr: -1 }}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ mt: 1 }}>
            {/* Business Information Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                Business Information
              </Typography>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Shop Name (Billing Name)"
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleChange}
                    placeholder="Enter shop/business name"
                    size="medium"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Customer Name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    placeholder="Enter contact person name"
                    size="medium"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={3}
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter complete address with city, state, and pincode"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Tax & Contact Information Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                Tax & Contact Information
              </Typography>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="GST No. *"
                    name="gst_no"
                    value={formData.gst_no}
                    onChange={handleChange}
                    placeholder="e.g., 29ABCDE1234F1Z5"
                    helperText="GST No. or PAN Card No. is required"
                    size="medium"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="PAN Card No. *"
                    name="pan_card_no"
                    value={formData.pan_card_no}
                    onChange={handleChange}
                    placeholder="e.g., ABCDE1234F"
                    helperText="GST No. or PAN Card No. is required"
                    size="medium"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="WhatsApp No."
                    name="whatsapp_no"
                    value={formData.whatsapp_no}
                    onChange={handleChange}
                    placeholder="Enter 10-digit mobile number"
                    size="medium"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Multiple Branches"
                    name="multiple_branches"
                    value={formData.multiple_branches}
                    onChange={handleChange}
                    placeholder="e.g., Yes/No, or specify branch details"
                    size="medium"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Business Terms Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                Business Terms
              </Typography>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Payment Terms"
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleChange}
                    placeholder="e.g., Net 30, Immediate, COD, etc."
                    size="medium"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Tier / Category"
                    name="tier_category"
                    value={formData.tier_category}
                    onChange={handleChange}
                    placeholder="e.g., A, B, C, Premium, etc."
                    size="medium"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Sales Person"
                    name="sales_person"
                    value={formData.sales_person}
                    onChange={handleChange}
                    disabled
                    size="medium"
                    helperText="Auto-filled from your profile"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Additional Details Section */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                Additional Details
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Margin Details / Special Requests"
                name="margin_details"
                value={formData.margin_details}
                onChange={handleChange}
                placeholder="Enter any special margin requirements, pricing notes, or additional details for this customer"
              />
            </Paper>
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            size="large"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            size="large"
            sx={{ minWidth: 150 }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CustomerCreationRequestForm;
