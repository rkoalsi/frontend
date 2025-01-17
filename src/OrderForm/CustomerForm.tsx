import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Checkbox,
  TextField,
  FormControlLabel,
  Paper,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import AddressForm from './CustomerAddress';
import CustomFields from './CustomFields';

const initialState = {
  company_name: '',
  gst_no: '',
  pan_no: '',
  place_of_contact: '',
  payment_terms: '',
  billing_address: {
    attention: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  },
  shipping_address: {
    attention: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  },
  custom_fields: {},
};

const CompanyForm: React.FC = () => {
  const [formData, setFormData] = useState(initialState);
  const [copyShipping, setCopyShipping] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    subField?: string
  ) => {
    const { name, value } = e.target;
    if (subField) {
      setFormData((prev: any) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === 'gst_no') {
      setFormData((prev) => ({
        ...prev,
        pan_no: value.slice(2, 12),
        place_of_contact: value.slice(0, 2),
      }));
    }
  };

  const handleCopyShipping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCopyShipping(e.target.checked);
    if (e.target.checked) {
      setFormData((prev) => ({
        ...prev,
        shipping_address: { ...prev.billing_address },
      }));
    }
  };

  const handleSubmit = () => {
    console.log(formData);
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 2 }}>
      <Typography variant='h5' fontWeight='bold' gutterBottom>
        Company Details
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Company Info */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <TextField
            label='Company Name'
            name='company_name'
            value={formData.company_name}
            onChange={(e: any) => handleInputChange(e, 'company_name')}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label='GST No'
            name='gst_no'
            value={formData.gst_no}
            onChange={(e: any) => handleInputChange(e, 'gst_no')}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label='PAN No'
            name='pan_no'
            value={formData.pan_no}
            disabled
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label='Place of Contact'
            name='place_of_contact'
            value={formData.place_of_contact}
            onChange={(e: any) => handleInputChange(e, 'place_of_contact')}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label='Payment Terms'
            name='payment_terms'
            value={formData.payment_terms}
            onChange={(e: any) => handleInputChange(e, 'payment_terms')}
            fullWidth
          />
        </Grid>
      </Grid>

      {/* Address Details */}
      <Typography variant='h6' fontWeight='bold' sx={{ mt: 4 }}>
        Address Details
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <Grid item width={'100%'}>
          <Card variant='outlined' sx={{ borderRadius: 2 }}>
            <CardContent>
              <AddressForm
                prefix='billing_address'
                addressData={formData.billing_address}
                onChange={handleInputChange}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item width={'100%'}>
          {/* Copy Address Checkbox */}
          <FormControlLabel
            control={
              <Checkbox checked={copyShipping} onChange={handleCopyShipping} />
            }
            label='Copy Billing Address to Shipping Address'
            sx={{ mt: 2 }}
          />
        </Grid>
        <Grid item width={'100%'}>
          <Card variant='outlined' sx={{ borderRadius: 2 }}>
            <CardContent>
              <AddressForm
                prefix='shipping_address'
                addressData={formData.shipping_address}
                onChange={handleInputChange}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Custom Fields */}
      <Typography variant='h6' fontWeight='bold' sx={{ mt: 4 }}>
        Custom Fields
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <CustomFields
          fields={[
            {
              customfield_id: 'field1',
              name: 'Custom Field 1',
              data_type: 'text',
            },
            {
              customfield_id: 'field2',
              name: 'Custom Field 2',
              data_type: 'date',
            },
          ]}
          onChange={handleInputChange}
        />
      </Grid>

      {/* Submit Button */}
      <Box display='flex' justifyContent='center' mt={4}>
        <Button variant='contained' color='primary' onClick={handleSubmit}>
          Submit
        </Button>
      </Box>
    </Paper>
  );
};

export default CompanyForm;
