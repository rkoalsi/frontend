import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import CustomerSearchBar from '../OrderForm/CustomerSearchBar';
import AddressSelection from '../common/AddressSelection';

// Import your custom components (adjust paths as necessary)

interface ExpectedReorderDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isEditing: boolean;
  formData: any; // Replace with more specific types as needed
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleChange: any;
  handleExpectedAmountChange: any;
}

const ExpectedReorderDialog: React.FC<ExpectedReorderDialogProps> = ({
  open,
  setOpen,
  isEditing,
  formData,
  handleSubmit,
  handleChange,
  handleExpectedAmountChange,
}) => {
  console.log(formData);
  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth='md'
      PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
    >
      <DialogTitle
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          textAlign: 'center',
          py: 2,
        }}
      >
        {isEditing ? 'Edit Expected Reorder' : 'Create Expected Reorder'}
      </DialogTitle>
      <DialogContent dividers>
        <Box component='form' onSubmit={handleSubmit}>
          <Typography variant='h6' gutterBottom>
            Expected Reorder Details
          </Typography>
          <Grid container spacing={2} direction='column'>
            <Grid>
              <CustomerSearchBar
                ref_no={false}
                label='Select Customer'
                onChange={(value) => {
                  handleChange('customer', value);
                }}
                initialValue={formData.customer}
                value={formData.customer}
              />
            </Grid>
            <Grid>
              {formData.customer && (
                <AddressSelection
                  shop={{ selectedCustomer: formData.customer }}
                  selectedAddressId={formData?.address?.address_id}
                  handleAddressChange={(e: any) => {
                    const address_id = e.target.value;
                    const selectedAddress = formData.customer.addresses.find(
                      (a: any) => a.address_id === address_id
                    );
                    if (selectedAddress) {
                      handleChange('address', selectedAddress);
                    }
                  }}
                />
              )}
            </Grid>
            <Grid>
              <TextField
                fullWidth
                label='Expected Amount'
                value={formData.expected_amount || ''}
                onChange={handleExpectedAmountChange}
                type='text'
                placeholder='0.00'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>₹</InputAdornment>
                  ),
                }}
                helperText='Enter the expected reorder amount'
                required
              />
            </Grid>
          </Grid>
          <DialogActions sx={{ mt: 2 }}>
            <Button
              onClick={() => setOpen(false)}
              variant='outlined'
              color='secondary'
            >
              Cancel
            </Button>
            <Button type='submit' variant='contained' color='primary'>
              {isEditing
                ? 'Update Expected Reorder Details'
                : 'Submit Expected Reorder Details'}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ExpectedReorderDialog;
