'use client';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Container,
  useTheme,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import {
  LocationOn,
  Home,
  Business,
  LocalShipping,
} from '@mui/icons-material';
import AuthContext from '../../../src/components/Auth';
import axiosInstance from '../../../src/util/axios';

interface Address {
  address_id?: string;
  attention?: string;
  address?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  is_shipping?: boolean;
  is_billing?: boolean;
  [key: string]: any;
}

interface AddressesResponse {
  addresses: Address[];
  billing_address?: Address | null;
  shipping_address?: Address | null;
}

const formatAddress = (addr: Address | null | undefined): string => {
  if (!addr) return '';
  return [
    addr.attention,
    addr.address,
    addr.street2,
    addr.city,
    addr.state && addr.zip ? `${addr.state} - ${addr.zip}` : addr.state || addr.zip,
    addr.country,
  ]
    .filter(Boolean)
    .join(', ');
};

const AddressCard = ({
  address,
  label,
  icon,
  chipColor,
}: {
  address: Address;
  label?: string;
  icon?: React.ReactNode;
  chipColor?: 'primary' | 'success' | 'default';
}) => {
  const theme = useTheme();
  const formatted = formatAddress(address);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {icon || <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />}
        {label && (
          <Chip
            label={label}
            size='small'
            color={chipColor || 'default'}
            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
          />
        )}
        {address.attention && (
          <Typography variant='subtitle2' fontWeight={700} sx={{ ml: label ? 0 : 0 }}>
            {address.attention}
          </Typography>
        )}
      </Box>

      {formatted ? (
        <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.7 }}>
          {[
            address.address,
            address.street2,
            address.city,
            address.state && address.zip
              ? `${address.state} - ${address.zip}`
              : address.state || address.zip,
            address.country,
          ]
            .filter(Boolean)
            .map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
        </Typography>
      ) : (
        <Typography variant='body2' color='text.disabled'>
          No address details available
        </Typography>
      )}

      {address.phone && (
        <Typography variant='caption' color='text.secondary'>
          Phone: {address.phone}
        </Typography>
      )}
    </Paper>
  );
};

const CustomerAddressesPage = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const [data, setData] = useState<AddressesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!user?.customer_id) return;
    try {
      const { data: res } = await axiosInstance.get('/customer_portal/addresses', {
        params: { customer_id: user.customer_id },
      });
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user, fetchAddresses]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth='md' sx={{ py: 4 }}>
        <Alert severity='error'>{error}</Alert>
      </Container>
    );
  }

  const addresses: Address[] = data?.addresses || [];
  const billing = data?.billing_address;
  const shipping = data?.shipping_address;

  const hasPrimary = billing || shipping;
  const hasAddresses = addresses.length > 0;

  return (
    <Container maxWidth='md' sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #221E48 0%, #37279C 100%)',
            color: 'white',
            p: { xs: 3, md: 4 },
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <LocationOn sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant='h5' fontWeight={700}>
              My Addresses
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.85, mt: 0.5 }}>
              Your saved billing and delivery addresses
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Primary Addresses */}
          {hasPrimary && (
            <>
              <Typography variant='h6' fontWeight={700} sx={{ mb: 2 }}>
                Primary Addresses
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  mb: 3,
                }}
              >
                {billing && (
                  <AddressCard
                    address={billing}
                    label='Billing'
                    icon={<Business sx={{ fontSize: 18, color: 'primary.main' }} />}
                    chipColor='primary'
                  />
                )}
                {shipping && (
                  <AddressCard
                    address={shipping}
                    label='Shipping'
                    icon={<LocalShipping sx={{ fontSize: 18, color: 'success.main' }} />}
                    chipColor='success'
                  />
                )}
              </Box>
            </>
          )}

          {hasPrimary && hasAddresses && <Divider sx={{ my: 3 }} />}

          {/* All Saved Addresses */}
          {hasAddresses && (
            <>
              <Typography variant='h6' fontWeight={700} sx={{ mb: 2 }}>
                All Saved Addresses
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                {addresses.map((addr, i) => (
                  <AddressCard
                    key={addr.address_id || i}
                    address={addr}
                    label={addr.is_billing ? 'Billing' : addr.is_shipping ? 'Shipping' : undefined}
                    icon={<Home sx={{ fontSize: 18, color: 'text.secondary' }} />}
                  />
                ))}
              </Box>
            </>
          )}

          {!hasPrimary && !hasAddresses && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <LocationOn sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography color='text.secondary'>No addresses found on your account.</Typography>
              <Typography variant='caption' color='text.disabled'>
                Contact support to update your address details.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerAddressesPage;
