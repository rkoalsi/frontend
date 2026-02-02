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
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';

// Import your custom components (adjust paths as necessary)

interface PotentialCustomerDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isEditing: boolean;
  formData: any; // Replace with more specific types as needed
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleChange: any;
}

const PotentialCustomerDialog: React.FC<PotentialCustomerDialogProps> = ({
  open,
  setOpen,
  isEditing,
  formData,
  handleSubmit,
  handleChange,
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
        {isEditing ? 'Edit Potential Customer' : 'Create Potential Customer'}
      </DialogTitle>
      <DialogContent dividers>
        <Box component='form' onSubmit={handleSubmit}>
          <Typography variant='h6' gutterBottom>
            Potential Customer Details
          </Typography>
          <Grid container spacing={2} direction='column'>
            <Grid>
              <TextField
                label='Store Name'
                fullWidth
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Grid>
            <Grid>
              <TextField
                label='Address'
                fullWidth
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </Grid>
            <Grid>
              <TextField
                label='State/City'
                fullWidth
                value={formData.state_city || ''}
                onChange={(e) => handleChange('state_city', e.target.value)}
              />
            </Grid>
            <Grid>
              <FormControl fullWidth>
                <InputLabel>Tier</InputLabel>
                <Select
                  value={formData.tier || ''}
                  onChange={(e: any) => handleChange('tier', e.target.value)}
                >
                  <MenuItem value='A'>A</MenuItem>
                  <MenuItem value='B'>B</MenuItem>
                  <MenuItem value='C'>C</MenuItem>
                  <MenuItem value='D'>D</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid>
              <TextField
                label='Customer Name'
                fullWidth
                value={formData.customer_name || ''}
                onChange={(e) => handleChange('customer_name', e.target.value)}
              />
            </Grid>
            <Grid>
              <TextField
                label='Mobile'
                fullWidth
                value={formData.mobile || ''}
                onChange={(e) => handleChange('mobile', e.target.value)}
              />
            </Grid>
            <Grid>
              <TextField
                label='Follow Up Date'
                type='date'
                fullWidth
                value={formData.follow_up_date || ''}
                onChange={(e) => handleChange('follow_up_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid>
              <TextField
                label='Comments'
                fullWidth
                multiline
                rows={3}
                value={formData.comments || ''}
                onChange={(e) => handleChange('comments', e.target.value)}
              />
            </Grid>
            <Grid>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status || ''}
                  onChange={(e: any) => handleChange('status', e.target.value)}
                >
                  <MenuItem value='Onboard'>Onboard</MenuItem>
                  <MenuItem value='Decline'>Decline</MenuItem>
                  <MenuItem value='Intalks'>Intalks</MenuItem>
                  <MenuItem value='Issue'>Issue</MenuItem>
                </Select>
              </FormControl>
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
                ? 'Update Potential Customer Details'
                : 'Submit Potential Customer Details'}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PotentialCustomerDialog;
