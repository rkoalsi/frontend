import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CheckList from './CheckList';
import axios from 'axios';
import NewAddress from './NewAddress';

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
  useEffect(() => {
    if (customer && customer.addresses.length > 0 && !address) {
      setAddress(customer.addresses[0]); // Auto-select the first address if none selected
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
        <>
          {addNewAddress ?? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant='h6'>Select {type} Address</Typography>
              <Button variant='contained' onClick={() => setIsAddingNew(true)}>
                Add New Address
              </Button>
            </Box>
          )}
          <Box
            sx={{
              maxHeight: isMobile ? null : '380px',
              overflowY: 'auto',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #ddd',
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
              <Typography fontWeight='bold'>
                {customer.company_name} has no saved addresses
              </Typography>
            )}
          </Box>
        </>
      )}
    </>
  );
}

export default Address;
