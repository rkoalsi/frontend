import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CheckList from '../CheckList';
import axios from 'axios';

interface Props {
  address: any;
  customer: any;
  setAddress: (address: any) => void;
  type: string;
  selectedAddress: any;
  id: any;
  setLoading: any;
}

function Address(props: Props) {
  const {
    address,
    customer,
    setAddress,
    type,
    selectedAddress,
    id,
    setLoading,
  } = props;
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type,
    attention: '',
    address: '',
    street2: '',
    city: '',
    state: '',
    state_code: '',
    zip: '',
    country: '',
    country_code: '',
    phone: '',
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  useEffect(() => {
    if (customer && customer.addresses.length > 0 && !address) {
      setAddress(customer.addresses[0]); // Auto-select the first address if none selected
    }
  }, [customer, setAddress, address]);

  const handleInputChange = (field: string, value: string) => {
    setNewAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true); // Go back to the original component
    // Save new address to state or backend
    console.log('Saved Address:', newAddress);
    const resp = await axios.post(`${process.env.api_url}/customers/address`, {
      order_id: id,
      address: newAddress,
    });
    console.log(resp.data);
    setAddress(newAddress); // Optionally select the new address
    setNewAddress({
      type,
      attention: '',
      address: '',
      street2: '',
      city: '',
      state: '',
      state_code: '',
      zip: '',
      country: '',
      country_code: '',
      phone: '',
    });
    setIsAddingNew(false); // Go back to the original component
    setLoading(false); // Go back to the original component
  };

  const handleCancel = () => {
    setNewAddress({
      type,
      attention: '',
      address: '',
      street2: '',
      city: '',
      state: '',
      state_code: '',
      zip: '',
      country: '',
      country_code: '',
      phone: '',
    });
    setIsAddingNew(false);
  };

  return (
    <>
      {isAddingNew ? (
        <Paper
          sx={{
            padding: 2,
            borderRadius: 2,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            margin: '0 auto',
            mt: 2,
          }}
        >
          <Typography variant='h6' sx={{ mb: 2 }}>
            Add New {type} Address
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label='Attention'
                fullWidth
                value={newAddress.attention}
                onChange={(e) => handleInputChange('attention', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Address'
                fullWidth
                value={newAddress.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Street 2'
                fullWidth
                value={newAddress.street2}
                onChange={(e) => handleInputChange('street2', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='City'
                fullWidth
                value={newAddress.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='State'
                fullWidth
                value={newAddress.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='State Code'
                fullWidth
                value={newAddress.state_code}
                onChange={(e) =>
                  handleInputChange('state_code', e.target.value)
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Zip'
                fullWidth
                value={newAddress.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Country'
                fullWidth
                value={newAddress.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Country Code'
                fullWidth
                value={newAddress.country_code}
                onChange={(e) =>
                  handleInputChange('country_code', e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Phone'
                fullWidth
                value={newAddress.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button variant='outlined' color='secondary' onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant='contained' color='primary' onClick={handleSave}>
              Save
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant='h6'>Select {type} Address</Typography>
            <Button variant='contained' onClick={() => setIsAddingNew(true)}>
              Add New Address
            </Button>
          </Box>
          <Box
            sx={{
              maxHeight: isMobile ? null : '380px',
              overflowY: 'auto',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}
          >
            {customer && customer.addresses && customer.addresses.length > 0 ? (
              <CheckList
                values={customer.addresses}
                selectedValue={selectedAddress}
                setSelectedValue={setAddress}
              />
            ) : (
              <Typography fontWeight='bold'>
                {customer.company_name} has no saved addresses
              </Typography>
            )}
          </Box>
        </>
      )}
    </>
  );
}

export default Address;
