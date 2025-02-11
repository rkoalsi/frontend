import { TextField, Grid, Paper, Typography, Box, Button } from '@mui/material';

interface Props {
  handleCancel: any;
  newAddress: any;
  type: any;
  handleInputChange: any;
  handleSave: any;
}

function NewAddress(props: Props) {
  const { handleCancel, newAddress, type, handleInputChange, handleSave } =
    props;

  return (
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
            onChange={(e) => handleInputChange('state_code', e.target.value)}
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
            onChange={(e) => handleInputChange('country_code', e.target.value)}
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
        <Button variant='contained' color='secondary' onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant='contained' color='primary' onClick={handleSave}>
          Save
        </Button>
      </Box>
    </Paper>
  );
}

export default NewAddress;
