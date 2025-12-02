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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Close as CloseIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../util/axios';
import AuthContext from './Auth';

// Dropdown constants for form fields
const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const INDIAN_CITIES = [
  'Agra',
  'Ahmedabad',
  'Ajmer',
  'Aligarh',
  'Allahabad',
  'Amaravati',
  'Amravati',
  'Amritsar',
  'Asansol',
  'Aurangabad',
  'Bangalore',
  'Bareilly',
  'Belgaum',
  'Bhavnagar',
  'Bhilai',
  'Bhopal',
  'Bhubaneswar',
  'Bikaner',
  'Chandigarh',
  'Chennai',
  'Coimbatore',
  'Cuttack',
  'Dehradun',
  'Delhi',
  'Dhanbad',
  'Durgapur',
  'Erode',
  'Faridabad',
  'Ghaziabad',
  'Goa',
  'Gorakhpur',
  'Guntur',
  'Gurgaon',
  'Guwahati',
  'Gwalior',
  'Hubli',
  'Hyderabad',
  'Indore',
  'Jabalpur',
  'Jaipur',
  'Jalandhar',
  'Jammu',
  'Jamnagar',
  'Jamshedpur',
  'Jodhpur',
  'Kanpur',
  'Kochi',
  'Kolhapur',
  'Kolkata',
  'Kota',
  'Kozhikode',
  'Lucknow',
  'Ludhiana',
  'Madurai',
  'Mangalore',
  'Meerut',
  'Moradabad',
  'Mumbai',
  'Mysore',
  'Nagpur',
  'Nashik',
  'Navi Mumbai',
  'Noida',
  'Patna',
  'Pune',
  'Raipur',
  'Rajkot',
  'Ranchi',
  'Salem',
  'Siliguri',
  'Solapur',
  'Srinagar',
  'Surat',
  'Thane',
  'Thiruvananthapuram',
  'Tiruchirappalli',
  'Tiruppur',
  'Udaipur',
  'Vadodara',
  'Varanasi',
  'Vasai-Virar',
  'Vijayawada',
  'Visakhapatnam',
  'Warangal',
];

const PAYMENT_TERMS = [
  'Due On Receipt',
  'Upfront',
  'Immediate',
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
];

const MULTIPLE_BRANCHES_OPTIONS = [
  'Yes',
  'No',
];

interface CustomerCreationRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

const emptyAddress: AddressData = {
  attention: '',
  address: '',
  street2: '',
  city: '',
  state: '',
  state_code: '',
  zip: '',
  country: 'India',
  phone: '',
  fax: ''
};

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
    margin_details: '',
    billing_address: { ...emptyAddress },
    shipping_address: { ...emptyAddress },
    place_of_supply: '',
    customer_mail_id: '',
    gst_treatment: '',
    pincode: ''
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

  const handleAddressChange = (
    addressType: 'billing_address' | 'shipping_address',
    field: keyof AddressData,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value
      }
    }));
  };

  const handleCopyBillingToShipping = () => {
    if (!formData.billing_address.address) {
      toast.warning('Please enter billing address first');
      return;
    }
    setFormData(prev => ({
      ...prev,
      shipping_address: { ...prev.billing_address }
    }));
    toast.success('Billing address copied to shipping address');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.shop_name || !formData.customer_name || !formData.address ||
        !formData.whatsapp_no || !formData.payment_terms || !formData.tier_category ||
        !formData.billing_address.address || !formData.billing_address.city || !formData.billing_address.state || !formData.billing_address.zip || !formData.billing_address.phone ||
        !formData.shipping_address.address || !formData.shipping_address.city || !formData.shipping_address.state || !formData.shipping_address.zip || !formData.shipping_address.phone ||
        !formData.place_of_supply || !formData.customer_mail_id || !formData.gst_treatment || !formData.pincode) {
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
        margin_details: '',
        billing_address: { ...emptyAddress },
        shipping_address: { ...emptyAddress },
        place_of_supply: '',
        customer_mail_id: '',
        gst_treatment: '',
        pincode: ''
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

            {/* Billing Address Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                Billing Address
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Street Address"
                    value={formData.billing_address.address}
                    onChange={(e) => handleAddressChange('billing_address', 'address', e.target.value)}
                    placeholder="Enter street address"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Street 2 (Optional)"
                    value={formData.billing_address.street2}
                    onChange={(e) => handleAddressChange('billing_address', 'street2', e.target.value)}
                    placeholder="Enter apartment, suite, etc."
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>City</InputLabel>
                    <Select
                      label="City"
                      value={formData.billing_address.city}
                      onChange={(e) => handleAddressChange('billing_address', 'city', e.target.value)}
                    >
                      {INDIAN_CITIES.map((city) => (
                        <MenuItem key={city} value={city}>
                          {city}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>State</InputLabel>
                    <Select
                      label="State"
                      value={formData.billing_address.state}
                      onChange={(e) => handleAddressChange('billing_address', 'state', e.target.value)}
                    >
                      {INDIAN_STATES.map((state) => (
                        <MenuItem key={state} value={state}>
                          {state}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    required
                    label="Pincode / ZIP"
                    value={formData.billing_address.zip}
                    onChange={(e) => handleAddressChange('billing_address', 'zip', e.target.value)}
                    placeholder="Enter pincode"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Phone"
                    value={formData.billing_address.phone}
                    onChange={(e) => handleAddressChange('billing_address', 'phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Attention"
                    value={formData.billing_address.attention}
                    onChange={(e) => handleAddressChange('billing_address', 'attention', e.target.value)}
                    placeholder="Contact person name"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Shipping Address Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                  Shipping Address
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={handleCopyBillingToShipping}
                  sx={{ textTransform: 'none' }}
                >
                  Copy from Billing
                </Button>
              </Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Street Address"
                    value={formData.shipping_address.address}
                    onChange={(e) => handleAddressChange('shipping_address', 'address', e.target.value)}
                    placeholder="Enter street address"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Street 2 (Optional)"
                    value={formData.shipping_address.street2}
                    onChange={(e) => handleAddressChange('shipping_address', 'street2', e.target.value)}
                    placeholder="Enter apartment, suite, etc."
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>City</InputLabel>
                    <Select
                      label="City"
                      value={formData.shipping_address.city}
                      onChange={(e) => handleAddressChange('shipping_address', 'city', e.target.value)}
                    >
                      {INDIAN_CITIES.map((city) => (
                        <MenuItem key={city} value={city}>
                          {city}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>State</InputLabel>
                    <Select
                      label="State"
                      value={formData.shipping_address.state}
                      onChange={(e) => handleAddressChange('shipping_address', 'state', e.target.value)}
                    >
                      {INDIAN_STATES.map((state) => (
                        <MenuItem key={state} value={state}>
                          {state}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    required
                    label="Pincode / ZIP"
                    value={formData.shipping_address.zip}
                    onChange={(e) => handleAddressChange('shipping_address', 'zip', e.target.value)}
                    placeholder="Enter pincode"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Phone"
                    value={formData.shipping_address.phone}
                    onChange={(e) => handleAddressChange('shipping_address', 'phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Attention"
                    value={formData.shipping_address.attention}
                    onChange={(e) => handleAddressChange('shipping_address', 'attention', e.target.value)}
                    placeholder="Contact person name"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Other Address Fields Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                Additional Information
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Place Of Supply</InputLabel>
                    <Select
                      label="Place Of Supply"
                      name="place_of_supply"
                      value={formData.place_of_supply}
                      onChange={(e) => handleChange(e as any)}
                    >
                      {INDIAN_STATES.map((state) => (
                        <MenuItem key={state} value={state}>
                          {state}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Enter pincode"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Customer Mail Id"
                    name="customer_mail_id"
                    value={formData.customer_mail_id}
                    onChange={handleChange}
                    placeholder="Enter customer email address"
                    type="email"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>GST Treatment</InputLabel>
                    <Select
                      label="GST Treatment"
                      name="gst_treatment"
                      value={formData.gst_treatment}
                      onChange={(e) => handleChange(e as any)}
                    >
                      <MenuItem value="Business GST">Business GST</MenuItem>
                      <MenuItem value="Unregistered Business">Unregistered Business</MenuItem>
                      <MenuItem value="Consumer">Consumer</MenuItem>
                    </Select>
                  </FormControl>
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
                  <FormControl fullWidth>
                    <InputLabel>Multiple Branches</InputLabel>
                    <Select
                      label="Multiple Branches"
                      name="multiple_branches"
                      value={formData.multiple_branches}
                      onChange={(e) => handleChange(e as any)}
                      size="medium"
                    >
                      {MULTIPLE_BRANCHES_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                  <FormControl fullWidth required>
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      label="Payment Terms"
                      name="payment_terms"
                      value={formData.payment_terms}
                      onChange={(e) => handleChange(e as any)}
                      size="medium"
                    >
                      {PAYMENT_TERMS.map((term) => (
                        <MenuItem key={term} value={term}>
                          {term}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
