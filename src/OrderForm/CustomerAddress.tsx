// components/AddressForm.tsx
import React from 'react';
import { Box, Grid, TextField, Typography } from '@mui/material';

interface AddressFormProps {
  prefix: string;
  addressData: any;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    subField: string
  ) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({
  prefix,
  addressData,
  onChange,
}) => {
  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: '16px',
      }}
    >
      <Typography fontWeight={'bold'} fontSize={'18px'}>
        {prefix.charAt(0).toUpperCase() +
          prefix.split('_')[0].slice(1, prefix.length)}{' '}
        Address
      </Typography>
      <Grid item>
        <TextField
          label='Attention'
          name={`${prefix}.attention`}
          value={addressData.attention}
          onChange={(e: any) => onChange(e, prefix, 'attention')}
          fullWidth
        />
      </Grid>
      <Grid item>
        <TextField
          label='Address'
          name={`${prefix}.address`}
          value={addressData.address}
          onChange={(e: any) => onChange(e, prefix, 'address')}
          fullWidth
        />
      </Grid>
      <Grid item>
        <TextField
          label='City'
          name={`${prefix}.city`}
          value={addressData.city}
          onChange={(e: any) => onChange(e, prefix, 'city')}
          fullWidth
        />
      </Grid>
      <Grid item>
        <TextField
          label='State'
          name={`${prefix}.state`}
          value={addressData.state}
          onChange={(e: any) => onChange(e, prefix, 'state')}
          fullWidth
        />
      </Grid>
      <Grid item>
        <TextField
          label='Pincode'
          name={`${prefix}.zip`}
          value={addressData.zip}
          onChange={(e: any) => onChange(e, prefix, 'zip')}
          fullWidth
        />
      </Grid>
      <Grid item>
        <TextField
          label='Phone'
          name={`${prefix}.phone`}
          value={addressData.phone}
          onChange={(e: any) => onChange(e, prefix, 'phone')}
          fullWidth
        />
      </Grid>
    </Box>
  );
};

export default AddressForm;
