import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Paper,
  styled,
} from '@mui/material';
import CheckList from './CheckList';
import axios from 'axios';
import NewAddress from './NewAddress';
import { LocationOn, Add } from '@mui/icons-material';

interface Props {
  address: any;
  customer: any;
  setAddress: (address: any) => void;
  type: string;
  selectedAddress: any;
  id: any;
  addNewAddress?: boolean;
  setLoading: any;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  backgroundColor: '#ffffff',
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
  // Using useRef to track if we've already set initial address
  const hasSetInitialAddress = useRef(false);

  useEffect(() => {
    if (customer && customer.addresses && customer.addresses.length > 0 && !hasSetInitialAddress.current && !address) {
      setAddress(customer.addresses[0]);
      hasSetInitialAddress.current = true;
    }

    // Reset the flag when customer changes
    if (!customer) {
      hasSetInitialAddress.current = false;
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
        <NewAddress
          handleCancel={handleCancel}
          handleInputChange={handleInputChange}
          newAddress={newAddress}
          type={type}
          handleSave={handleSave}
        />
      ) : (
        <StyledPaper>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Box display='flex' alignItems='center'>
              <LocationOn sx={{ mr: 1, color: type === 'Billing' ? 'primary.main' : 'secondary.main', fontSize: 28 }} />
              <Typography variant='h6' fontWeight={600} color='text.primary'>
                Select {type} Address
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              maxHeight: { xs: 'none', md: '400px' },
              overflowY: { xs: 'visible', md: 'auto' },
              padding: { xs: 1, sm: 2 },
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              backgroundColor: '#fafafa',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#cbd5e1',
                borderRadius: '10px',
                '&:hover': {
                  backgroundColor: '#94a3b8',
                },
              },
            }}
          >
            {customer && customer.addresses && customer.addresses.length > 0 ? (
              <CheckList
                values={Array.from(
                  new Map(
                    customer.addresses.map((addr: any) => [
                      addr.address_id,
                      addr,
                    ])
                  ).values()
                )}
                selectedValue={selectedAddress}
                setSelectedValue={setAddress}
              />
            ) : (
              <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='center'
                py={4}
              >
                <LocationOn sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography fontWeight='bold' color='text.secondary'>
                  {customer?.company_name || 'Customer'} has no saved addresses
                </Typography>
              </Box>
            )}
          </Box>
        </StyledPaper>
      )}
    </>
  );
}

export default Address;
