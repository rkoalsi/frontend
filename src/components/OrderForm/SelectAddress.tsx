import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Paper,
  styled,
  Divider,
} from '@mui/material';
import CheckList from './CheckList';
import axios from 'axios';
import { toast } from 'react-toastify';
import NewAddress from './NewAddress';
import { LocationOn, Add, ArrowBack } from '@mui/icons-material';

interface Props {
  address: any;
  customer: any;
  setAddress: (address: any) => void;
  type: string;
  selectedAddress: any;
  id: any;
  addNewAddress?: boolean;
  setLoading: any;
  addressDetails?: Record<string, any>;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 4px 20px rgba(0,0,0,0.3)'
      : '0 2px 12px rgba(0,0,0,0.08)',
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    borderRadius: 12,
  },
}));

function Address(props: Props) {
  const {
    address,
    customer,
    setAddress,
    type,
    selectedAddress,
    id,
    addNewAddress = true,
    setLoading,
    addressDetails = {},
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
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const hasSetInitialAddress = useRef(false);

  useEffect(() => {
    if (
      customer &&
      customer.addresses &&
      customer.addresses.length > 0 &&
      !hasSetInitialAddress.current &&
      !address
    ) {
      setAddress(customer.addresses[0]);
      hasSetInitialAddress.current = true;
    }
    if (!customer) hasSetInitialAddress.current = false;
  }, [customer, setAddress, address]);

  const handleInputChange = (field: string, value: string) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.post(`${process.env.api_url}/customers/address`, {
        order_id: id,
        address: newAddress,
      });
      setAddress(newAddress);
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
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
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

  // Dark mode: billing = blue, shipping = indigo/primary. Light mode: billing = primary, shipping = secondary.
  const accentColor =
    type === 'Shipping'
      ? isDark ? theme.palette.primary.main : theme.palette.secondary.main
      : isDark ? '#42a5f5' : theme.palette.primary.main;

  return (
    <>
      {isAddingNew ? (
        <NewAddress
          handleCancel={handleCancel}
          handleInputChange={handleInputChange}
          newAddress={newAddress}
          type={type}
          handleSave={handleSave}
        />
      ) : (
        <StyledPaper>
          {/* ── Header ── */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: { xs: 2, sm: 2.5 },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 1 },
            }}
          >
            <Box display='flex' alignItems='center' gap={1}>
              <LocationOn
                sx={{
                  color: accentColor,
                  fontSize: { xs: 24, sm: 28 },
                }}
              />
              <Box>
                <Typography
                  variant='h6'
                  fontWeight={600}
                  color='text.primary'
                  sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, lineHeight: 1.2 }}
                >
                  {type} Address
                </Typography>
                {customer?.company_name && (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ fontSize: { xs: '0.72rem', sm: '0.75rem' } }}
                  >
                    for {customer.company_name || customer.contact_name}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Add New Address button */}
            {addNewAddress && (
              <Button
                size={isMobile ? 'medium' : 'small'}
                variant='outlined'
                startIcon={<Add />}
                onClick={() => setIsAddingNew(true)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 24,
                  alignSelf: { xs: 'stretch', sm: 'auto' },
                  borderColor: accentColor,
                  color: accentColor,
                  '&:hover': {
                    borderColor: accentColor,
                    bgcolor: isDark
                      ? 'rgba(124,111,205,0.08)'
                      : 'rgba(42,74,107,0.06)',
                  },
                }}
              >
                Add New Address
              </Button>
            )}
          </Box>

          <Divider sx={{ mb: { xs: 2, sm: 2.5 } }} />

          {/* ── Address list ── */}
          <Box
            sx={{
              // On desktop scroll within the container; on mobile let the page scroll
              maxHeight: { xs: 'none', md: '420px' },
              overflowY: { xs: 'visible', md: 'auto' },
              px: { xs: 0.5, sm: 1 },
              borderRadius: 2,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-thumb': {
                borderRadius: 10,
                bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
              },
            }}
          >
            {customer && customer.addresses && customer.addresses.length > 0 ? (
              <CheckList
                values={Array.from(
                  new Map(
                    customer.addresses.map((addr: any) => [addr.address_id, addr])
                  ).values()
                ).filter(
                  (addr: any) =>
                    addressDetails[addr.address_id]?.status !== 'closed'
                )}
                selectedValue={selectedAddress}
                setSelectedValue={setAddress}
                addressDetails={addressDetails}
                addressType={type}
              />
            ) : (
              <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='center'
                py={{ xs: 5, sm: 6 }}
                gap={1.5}
              >
                <LocationOn
                  sx={{ fontSize: { xs: 48, sm: 56 }, color: 'text.disabled' }}
                />
                <Typography
                  fontWeight={600}
                  color='text.secondary'
                  textAlign='center'
                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  {customer?.company_name || 'This customer'} has no saved addresses
                </Typography>
                {addNewAddress && (
                  <Button
                    variant='contained'
                    size='small'
                    startIcon={<Add />}
                    onClick={() => setIsAddingNew(true)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 24,
                      mt: 1,
                    }}
                  >
                    Add First Address
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </StyledPaper>
      )}
    </>
  );
}

export default Address;
