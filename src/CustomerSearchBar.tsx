import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputAdornment,
  Snackbar,
  FormControl,
  FormLabel,
  Alert,
} from '@mui/material';

interface SearchResult {
  _id: { $oid: string };
  contact_name: string;
}

interface SearchBarProps {
  label: string;
  onChange: (value: SearchResult | null) => void;
  value?: SearchResult | null;
  initialValue?: SearchResult | null;
}

const CustomerSearchBar: React.FC<SearchBarProps> = ({
  label = 'Search',
  onChange,
  value,
  initialValue,
}) => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SearchResult | null>(
    initialValue || null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_type: 'Business',
    customer_name: '',
    customer_mobile: '',
    customer_email: '',
    customer_salutation: 'Mr.',
    company_name: '',
    agreed_margin: 40,
    gst_type: 'Exclusive',
    business_type: '',
    client_id: '',
    parent_company: '',
    whatsapp_group: 'No',
    multiple_branches: 'No',
    payment_terms: 'Net 15',
    gst_number: '',
  });
  const [gstValidation, setGstValidation] = useState({
    valid: false,
    pan: '',
    state_code: '',
  });
  const [gstError, setGstError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;

  useEffect(() => {
    if (initialValue) {
      setSelectedOption(initialValue);
      setOptions([initialValue]);
    }
  }, [initialValue]);

  const handleSearch = async (value: string) => {
    if (!value) return;

    setLoading(true);
    try {
      const base = `${process.env.api_url}`;
      const response = await axios.get(`${base}/customers?name=${value}`);
      setOptions(response.data.customers);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (event: any, value: SearchResult | null) => {
    setSelectedOption(value);
    onChange(value);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateGST = async (gst_number: string) => {
    if (!gstRegex.test(gst_number)) {
      setGstError('Invalid GST Number. Please enter a valid GST.');
      setGstValidation({ valid: false, pan: '', state_code: '' });
      return;
    }
    setGstError('');
    try {
      const response = await axios.get(
        `${process.env.api_url}/customers/validate_gst`,
        {
          params: { gst_in: gst_number },
        }
      );
      setGstValidation(response.data);
    } catch (error) {
      console.error('GST validation failed:', error);
      setGstError('Failed to validate GST. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!gstValidation.valid) {
      setSnackbar({
        open: true,
        message: 'GST is not Active. Cannot proceed.',
        severity: 'error',
      });
      return;
    }
    try {
      const base = `${process.env.api_url}`;
      await axios.post(`${base}/customers`, formData);
      setSnackbar({
        open: true,
        message: 'Customer created successfully!',
        severity: 'success',
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create customer.',
        severity: 'error',
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Autocomplete
        freeSolo
        options={options}
        getOptionLabel={(option: any) => option?.contact_name || 'Unknown Name'}
        isOptionEqualToValue={(option: SearchResult, value: SearchResult) =>
          option._id.$oid === value._id.$oid
        }
        value={selectedOption || null}
        onInputChange={(event, value) => {
          setQuery(value);
          handleSearch(value);
        }}
        onChange={(e, value: any) => handleOptionSelect(e, value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant='standard'
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color='inherit' size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      {!selectedOption && (
        <Button
          variant='outlined'
          color='primary'
          onClick={() => setShowCreateForm(true)}
          sx={{ mt: 2 }}
        >
          Create New Customer
        </Button>
      )}

      {/* Dialog for Creating New Customer */}
      <Dialog
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        fullWidth
      >
        <DialogTitle>Create New Customer</DialogTitle>
        <DialogContent>
          <Box display='flex' flexDirection='column' gap={2}>
            {/* Customer Type */}
            <FormControl>
              <FormLabel>Customer Type</FormLabel>
              <RadioGroup
                row
                name='customer_type'
                value={formData.customer_type}
                onChange={(e) =>
                  handleInputChange(e as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <FormControlLabel
                  value='Business'
                  control={<Radio />}
                  label='Business'
                />
                <FormControlLabel
                  value='Individual'
                  control={<Radio />}
                  label='Individual'
                />
              </RadioGroup>
            </FormControl>

            {/* Remaining Fields */}
            <TextField
              label='Customer Name'
              name='customer_name'
              value={formData.customer_name}
              onChange={handleInputChange}
            />
            <TextField
              label='Mobile Number'
              name='customer_mobile'
              value={formData.customer_mobile}
              onChange={handleInputChange}
            />
            <TextField
              label='Email Address'
              name='customer_email'
              value={formData.customer_email}
              onChange={handleInputChange}
            />
            <TextField
              label='Salutation'
              name='customer_salutation'
              value={formData.customer_salutation}
              onChange={handleInputChange}
            />
            <TextField
              label='Company Name'
              name='company_name'
              value={formData.company_name}
              onChange={handleInputChange}
            />

            <FormControl>
              <FormLabel>Agreed Margin</FormLabel>
              <TextField
                name='agreed_margin'
                type='number'
                value={formData.agreed_margin}
                onChange={handleInputChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>%</InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>GST Type</FormLabel>
              <RadioGroup
                row
                name='gst_type'
                value={formData.gst_type}
                onChange={(e) =>
                  handleInputChange(e as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <FormControlLabel
                  value='Inclusive'
                  control={<Radio />}
                  label='Inclusive'
                />
                <FormControlLabel
                  value='Exclusive'
                  control={<Radio />}
                  label='Exclusive'
                />
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Business Type</FormLabel>
              <Select
                name='business_type'
                value={formData.business_type}
                onChange={(e) =>
                  handleInputChange(e as React.ChangeEvent<HTMLInputElement>)
                }
                displayEmpty
              >
                <MenuItem value='' disabled>
                  Select Business Type
                </MenuItem>
                <MenuItem value='Vet'>Vet</MenuItem>
                <MenuItem value='Retail'>Retail</MenuItem>
                <MenuItem value='Online'>Online</MenuItem>
                <MenuItem value='Groomer'>Groomer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label='Client ID'
              name='client_id'
              value={formData.client_id}
              onChange={handleInputChange}
            />
            <TextField
              label='Parent Company'
              name='parent_company'
              value={formData.parent_company}
              onChange={handleInputChange}
            />

            <FormControl>
              <FormLabel>WhatsApp Group</FormLabel>
              <RadioGroup
                row
                name='whatsapp_group'
                value={formData.whatsapp_group}
                onChange={(e) =>
                  handleInputChange(e as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <FormControlLabel value='Yes' control={<Radio />} label='Yes' />
                <FormControlLabel value='No' control={<Radio />} label='No' />
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Multiple Branches</FormLabel>
              <RadioGroup
                row
                name='multiple_branches'
                value={formData.multiple_branches}
                onChange={(e) =>
                  handleInputChange(e as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <FormControlLabel value='Yes' control={<Radio />} label='Yes' />
                <FormControlLabel value='No' control={<Radio />} label='No' />
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Payment Terms</FormLabel>
              <Select
                name='payment_terms'
                value={formData.payment_terms}
                onChange={(e) =>
                  handleInputChange(e as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <MenuItem value='Net 15'>Net 15</MenuItem>
                <MenuItem value='Net 30'>Net 30</MenuItem>
                <MenuItem value='COD'>COD</MenuItem>
                <MenuItem value='Upfront'>Upfront</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label='GST Number'
              name='gst_number'
              value={formData.gst_number}
              onChange={(e) => {
                handleInputChange(e);
                validateGST(e.target.value);
              }}
              error={!!gstError}
              helperText={gstError || ''}
            />
            {gstValidation?.valid && (
              <Typography color='green'>GST Status: Valid</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateForm(false)} color='secondary'>
            Cancel
          </Button>
          <Button onClick={handleSubmit} color='primary'>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity as any}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CustomerSearchBar;
