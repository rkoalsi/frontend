import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import CustomerSearchBar from '../OrderForm/CustomerSearchBar';
import AddressSelection from '../common/AddressSelection';
import HookEntryCard from './HookEntryCard';

// Import your custom components (adjust paths as necessary)

interface HookDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isEditing: boolean;
  formData: any; // Replace with more specific types as needed
  addresses: any[]; // Replace with your address type
  hookCategories: any[]; // Replace with your hook category type
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleCustomerSelect: (customer: any) => void;
  handleAddressSelect: (addressId: any) => void;
  updateEntry: (entry: any, index: number) => void;
  removeEntry: (index: number) => void;
  toggleEditEntry: (index: number) => void;
  addHookEntry: () => void;
}

const HookDialog: React.FC<HookDialogProps> = ({
  open,
  setOpen,
  isEditing,
  formData,
  addresses,
  hookCategories,
  handleSubmit,
  handleCustomerSelect,
  handleAddressSelect,
  updateEntry,
  removeEntry,
  toggleEditEntry,
  addHookEntry,
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
        {isEditing ? 'Edit Hook Entry' : 'Create Hook Entry'}
      </DialogTitle>
      <DialogContent dividers>
        <Box component='form' onSubmit={handleSubmit}>
          <Typography variant='h6' gutterBottom>
            Customer Details
          </Typography>
          <Grid container spacing={2} direction='column'>
            <Grid item xs={12} sm={6}>
              <CustomerSearchBar
                ref_no={false}
                label='Select Customer'
                onChange={handleCustomerSelect}
                initialValue={formData?.selectedCustomer}
                value={formData.selectedCustomer}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {formData.selectedCustomer &&
                addresses &&
                addresses.length > 0 && (
                  <AddressSelection
                    shop={formData}
                    handleAddressChange={(e: any) =>
                      handleAddressSelect(e.target.value)
                    }
                    selectedAddressId={formData?.customerAddress?.address_id}
                  />
                )}
            </Grid>
          </Grid>
          <Box sx={{ mt: 4 }}>
            <Typography variant='h6' gutterBottom>
              Hook Categories
            </Typography>
            {formData.hookEntries.map((entry: any, index: number) => {
              const selectedCategoryIds = formData.hookEntries
                .filter((_: any, i: number) => i !== index)
                .map((entry: any) => entry.category_id);
              return (
                <HookEntryCard
                  key={entry.entryId}
                  entry={entry}
                  index={index}
                  updateEntry={updateEntry as any}
                  removeEntry={removeEntry}
                  hookCategories={hookCategories}
                  selectedCategoryIds={selectedCategoryIds}
                  toggleEditEntry={toggleEditEntry}
                />
              );
            })}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant='outlined'
                startIcon={<AddIcon />}
                onClick={addHookEntry}
              >
                Add Category
              </Button>
            </Box>
          </Box>
          <DialogActions sx={{ mt: 2 }}>
            <Button
              onClick={() => setOpen(false)}
              variant='outlined'
              color='secondary'
            >
              Cancel
            </Button>
            <Button type='submit' variant='contained' color='primary'>
              {isEditing ? 'Update Hook Details' : 'Submit Hook Details'}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default HookDialog;
