import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Phishing } from '@mui/icons-material';
import formatAddress from '../../util/formatAddress';

interface ShopsSectionProps {
  shops: any[];
  onEditShops: () => void;
  onHookUpdate: any;
}

// Helper to get customer name from object or string (used for display in view mode)
const getCustomerName = (customer: any) => {
  if (!customer) return 'Unknown';
  if (typeof customer === 'object') {
    return customer.contact_name || customer.name || 'Unknown';
  }
  return customer;
};

const ShopsSection = ({
  shops,
  onEditShops,
  onHookUpdate,
}: ShopsSectionProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant='h6'>Shops</Typography>
        <Tooltip title='Edit Shops'>
          <IconButton
            onClick={onEditShops}
            size='small'
            sx={{ ml: 1 }}
            color='primary'
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>
      {shops && shops.length > 0 ? (
        <Grid container spacing={2}>
          {shops.map((shop: any, idx: number) => (
            <Grid item xs={12} sm={12} md={12} key={idx}>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                }}
              >
                <Box
                  display={'flex'}
                  flexDirection={'row'}
                  justifyContent={'space-between'}
                  width={'100%'}
                >
                  <Typography
                    variant='subtitle1'
                    fontWeight='bold'
                    gutterBottom
                  >
                    {idx + 1}.{' '}
                    {shop?.potential_customer
                      ? shop?.potential_customer_name
                      : shop?.customer_name
                      ? shop?.customer_name
                      : getCustomerName(shop.selectedCustomer)}
                  </Typography>
                  {!shop.potential_customer && (
                    <Tooltip title='Set Hook'>
                      <IconButton
                        onClick={() => onHookUpdate(shop)}
                        size='small'
                        color='primary'
                      >
                        <Phishing />
                      </IconButton>
                    </Tooltip>
                  )}
                  {shop?.potential_customer && (
                    <Chip
                      size='small'
                      label={`Potential Customer`}
                      color='primary'
                      variant='outlined'
                    />
                  )}
                </Box>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  <strong>Address:</strong>
                </Typography>
                <Typography variant='body2' paragraph>
                  {shop?.potential_customer
                    ? shop?.potential_customer_address
                    : formatAddress(shop.address) || 'No address provided'}
                </Typography>
                {shop?.potential_customer && (
                  <>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      <strong>Tier:</strong>
                    </Typography>
                    <Typography variant='body2' paragraph>
                      {shop?.potential_customer_tier}
                    </Typography>
                  </>
                )}
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  <strong>Reason:</strong>
                </Typography>
                <Typography variant='body2' sx={{ flex: 1 }}>
                  {shop.reason || 'No reason provided'}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity='info'>
          No shops available. Click the edit button to add shops.
        </Alert>
      )}
    </Box>
  );
};

export default ShopsSection;
