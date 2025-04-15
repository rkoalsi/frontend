import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Phishing } from '@mui/icons-material';
import formatAddress from '../../util/formatAddress';
import { useEffect } from 'react';
import axios from 'axios';

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
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2.5,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant='h6' fontWeight='medium'>
          Shops
        </Typography>
        <Tooltip title='Edit Shops'>
          <IconButton onClick={onEditShops} size='small' color='primary'>
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {shops && shops.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
          }}
        >
          {shops.map((shop: any, idx: number) => (
            <Paper
              key={idx}
              elevation={2}
              sx={{
                p: 3,
                flex: '1 1 300px',
                maxWidth: '400px',
                minWidth: '280px',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                borderRadius: 1,
                '&:hover': {
                  boxShadow: 3,
                },
              }}
            >
              <Box
                display='flex'
                flexDirection='row'
                alignItems='center'
                justifyContent='space-between'
                width='100%'
                mb={1.5}
              >
                <Typography
                  variant='subtitle1'
                  fontWeight='bold'
                  sx={{ mr: 1 }}
                >
                  {idx + 1}.{' '}
                  {shop?.potential_customer
                    ? shop?.potential_customer_name
                    : shop?.customer_name
                    ? shop?.customer_name
                    : getCustomerName(shop.selectedCustomer)}
                </Typography>
                <Box display='flex' alignItems='center'>
                  {shop?.potential_customer ? (
                    <Chip
                      size='small'
                      label='Potential Customer'
                      color='primary'
                      variant='outlined'
                    />
                  ) : (
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
                </Box>
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  fontWeight='medium'
                >
                  Address:
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5, mb: 2 }}>
                  {shop?.potential_customer
                    ? shop?.potential_customer_address
                    : formatAddress(shop.address) || 'No address provided'}
                </Typography>
              </Box>

              {shop?.potential_customer && (
                <Box sx={{ mt: 0.5, mb: 1.5 }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    fontWeight='medium'
                  >
                    Tier:
                  </Typography>
                  <Typography variant='body2' sx={{ mt: 0.5, mb: 1 }}>
                    {shop?.potential_customer_tier}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 0.5 }}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  fontWeight='medium'
                >
                  Order Expected Soon:
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5, mb: 2 }}>
                  {shop?.order_expected ? 'Yes' : 'No'}
                </Typography>
              </Box>

              <Box sx={{ mt: 'auto', pt: 1 }}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  fontWeight='medium'
                >
                  Reason:
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {shop.reason || 'No reason provided'}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Alert severity='info' sx={{ mt: 2 }}>
          No shops available. Click the edit button to add shops.
        </Alert>
      )}
    </Box>
  );
};

export default ShopsSection;
