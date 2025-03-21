import { useState, useEffect, memo, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  Container,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Header from '../../src/components/common/Header';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';
import EditIcon from '@mui/icons-material/Edit';
import PotentialCustomerDialog from '../../src/components/daily_visits/PotentialCustomerDialog';
// ---------- ShopHookCard Component ----------

interface Address {
  address_id: string;
  attention: string;
  address: string;
  street2: string;
  city: string;
  state_code: string;
  state: string;
  zip: string;
  country: string;
  county: string;
  country_code: string;
  phone: string;
  fax: string;
}

interface HookEntry {
  entryId: string;
  potential_customersAvailable: number;
  totalHooks: number;
  editing: boolean;
  category_name: string;
  // We'll use category_id as string for simplicity.
  category_id: string;
}

interface ShopHook {
  _id: string;
  customer_id: string;
  customer_name: string;
  customer_address: Address;
  potential_customers: HookEntry[];
  created_by: string;
  created_at: string;
}

const ShopHookCard = ({ hookData, onEdit }: any) => {
  return (
    <Card
      sx={{
        width: '100%',
        maxWidth: 600,
        margin: 'auto',
        borderRadius: 2,
        boxShadow: 3,
        transition: 'transform 0.2s ease-in-out',
      }}
    >
      {/* Header Section */}
      <div
        style={{
          backgroundColor: '#1976d2', // Primary color
          color: 'white',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        <Typography variant='h6' color='inherit'>
          {hookData.name}
        </Typography>
      </div>

      <CardContent>
        {/* Address Section */}
        <div
          style={{
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'start',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div>
            <Typography variant='body2' color='textSecondary'>
              Potential Customer Name
            </Typography>
            <Typography variant='subtitle1' fontWeight='bold'>
              {hookData.name}
            </Typography>
          </div>
          <div>
            <Typography variant='body2' color='textSecondary'>
              Shop Address
            </Typography>
            <Typography variant='subtitle1' fontWeight='bold'>
              {hookData.address}
            </Typography>
          </div>
          <div>
            <Typography variant='body2' color='textSecondary'>
              Tier
            </Typography>
            <Typography variant='subtitle1' fontWeight='bold'>
              {hookData.tier}
            </Typography>
          </div>
          {hookData?.mobile && (
            <div>
              <Typography variant='body2' color='textSecondary'>
                Mobile
              </Typography>
              <Typography variant='subtitle1' fontWeight='bold'>
                {hookData.mobile}
              </Typography>
            </div>
          )}
        </div>

        {/* Edit Button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 16,
          }}
        >
          <Button
            variant='contained'
            color='primary'
            startIcon={<EditIcon />}
            onClick={() => onEdit(hookData)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              py: 1,
            }}
          >
            Edit Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- PotentialCustomers Component ----------

function PotentialCustomers() {
  const { user }: any = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [potentialCustomers, setPotentialCustomers] = useState<ShopHook[]>([]);
  const [formData, setFormData]: any = useState({
    mobile: '',
    name: null as any,
    address: '',
    tier: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query

  const fetchPotentialCustomers = async () => {
    try {
      const resp = await axios.get(
        `${process.env.api_url}/potential_customers`,
        {
          params: { created_by: user?.data?._id },
        }
      );
      setPotentialCustomers(resp.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch potential customers');
    }
  };

  // Fetch hook categories and potential_customers on mount.
  useEffect(() => {
    fetchPotentialCustomers();
  }, []);

  // Compute filtered potential_customers based on search query.
  const filteredPotentialCustomers = potentialCustomers.filter(
    (potentialCustomer: any) =>
      potentialCustomer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChange = (key: string, value: any) => {
    if (value) {
      setFormData((prev: any) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  const handleEditHook = async (hookData: any) => {
    setFormData({
      _id: hookData._id,
      name: hookData.name,
      address: hookData.address,
      tier: hookData.tier,
      mobile: hookData.mobile,
    });
    setEditingId(hookData._id);
    setIsEditing(true);
    setOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    console.log(editingId);
    if (!formData.name) {
      toast.error('Please enter a customer name');
      return;
    }
    if (!formData.address) {
      toast.error('Please enter an address address');
      return;
    }
    if (!formData.tier) {
      toast.error('Please enter a tier');
      return;
    }
    const payload = {
      _id: formData._id,
      name: formData.name,
      address: formData.address,
      tier: formData.tier,
      mobile: formData.mobile,
    };

    try {
      if (isEditing && editingId) {
        await axios.put(
          `${process.env.api_url}/potential_customers/${editingId}`,
          payload
        );
        toast.success('Hook details updated successfully');
      } else {
        await axios.post(`${process.env.api_url}/potential_customers`, {
          ...payload,
          created_by: user?.data?._id,
        });
        toast.success('Hook details submitted successfully');
      }
      setFormData({
        name: null,
        address: '',
        tier: [],
      });
      setOpen(false);
      setIsEditing(false);
      setEditingId(null);
      await fetchPotentialCustomers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit hook details');
    }
  };

  return (
    <Container maxWidth='lg'>
      <Container sx={{ py: 4, display: 'flex', flexDirection: 'column' }}>
        <Header title='Potential Customers' showBackButton />

        {/* Search Field */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 4,
          }}
        >
          <TextField
            label='Search by Potential Customer Name'
            variant='outlined'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: '100%',
              maxWidth: 400,
              // Style for the input text
              '& .MuiInputBase-input': {
                color: 'white',
              },
              // Style for the label
              '& .MuiInputLabel-root': {
                color: 'white',
              },
              // Style for the outline
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                {
                  borderColor: 'white',
                },
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 4,
          }}
        >
          <Button
            variant='contained'
            color='primary'
            size='large'
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
            }}
            onClick={() => {
              setFormData({
                selectedCustomer: null,
                customerAddress: '',
                hookEntries: [],
              });
              setIsEditing(false);
              setEditingId(null);
              setOpen(true);
            }}
          >
            Create Potential Customer
          </Button>
        </Box>

        {filteredPotentialCustomers.length === 0 ? (
          <Alert
            severity='info'
            variant='outlined'
            sx={{
              color: 'white',
              justifyContent: 'center',
              borderRadius: 3,
            }}
          >
            {potentialCustomers.length === 0
              ? 'No Potential Customers found. Create your Potential Customer!'
              : 'No Potential Customers match your search.'}
          </Alert>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 3,
            }}
          >
            {filteredPotentialCustomers.map((h: any) => (
              <ShopHookCard key={h._id} hookData={h} onEdit={handleEditHook} />
            ))}
          </Box>
        )}
        <PotentialCustomerDialog
          open={open}
          setOpen={setOpen}
          isEditing={isEditing}
          formData={formData}
          handleSubmit={handleSubmit}
          handleChange={handleChange}
        />
      </Container>
    </Container>
  );
}

export default PotentialCustomers;
