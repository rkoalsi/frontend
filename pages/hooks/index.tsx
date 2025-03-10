import { useState, useEffect, memo, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Stack,
  Tooltip,
  Card,
  CardHeader,
  CardContent,
  Divider,
  LinearProgress,
  Alert,
  Container,
  Chip,
  Collapse,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CustomerSearchBar from '../../src/components/OrderForm/CustomerSearchBar';
import AddressSelection from '../../src/components/common/AddressSelection';
import Header from '../../src/components/common/Header';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import HookDialog from '../../src/components/daily_visits/HookDialog';
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
  hooksAvailable: number;
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
  hooks: HookEntry[];
  created_by: string;
  created_at: string;
}

const ShopHookCard = ({ hookData, onEdit }: any) => {
  const [isHookEntriesOpen, setIsHookEntriesOpen] = useState(false);

  const createdDate = new Date(hookData.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const { address, street2, city, state, zip, country } =
    hookData.customer_address;
  const formattedAddress = `${address}${
    street2 ? `, ${street2}` : ''
  }, ${city}, ${state} ${zip}, ${country}`;

  const toggleHookEntries = () => {
    setIsHookEntriesOpen(!isHookEntriesOpen);
  };

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
          {hookData.customer_name}
        </Typography>
        <Typography variant='body2' color='inherit'>
          Created on: {createdDate}
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
            alignItems: 'center',
            gap: 12,
          }}
        >
          <LocationOnIcon color='primary' />
          <div>
            <Typography variant='subtitle1' fontWeight='bold'>
              Shop Address
            </Typography>
            <Typography variant='body2' color='textSecondary'>
              {formattedAddress}
            </Typography>
          </div>
        </div>

        {/* Divider with Collapsible Toggle */}
        <Divider textAlign='center' sx={{ mb: 2 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Chip label='Hook Entries' size='small' color='primary' />
            <IconButton onClick={toggleHookEntries} size='small'>
              {isHookEntriesOpen ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </div>
        </Divider>

        {/* Collapsible Hook Entries */}
        <Collapse in={isHookEntriesOpen}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {hookData.hooks.map((entry: any) => (
              <div
                key={entry.entryId}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Typography variant='subtitle1' fontWeight='bold'>
                    {entry.category_name}
                  </Typography>
                  <Typography variant='body2' color='primary'>
                    {entry.hooksAvailable}/{entry.totalHooks}
                  </Typography>
                </div>
                <LinearProgress
                  variant='determinate'
                  value={(entry.hooksAvailable / entry.totalHooks) * 100}
                  color='primary'
                  sx={{
                    height: 8,
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </div>
        </Collapse>

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

// ---------- CustomerHooks Component ----------

function CustomerHooks() {
  const { user }: any = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [hooks, setHooks] = useState<ShopHook[]>([]);
  const [hookCategories, setHookCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [formData, setFormData]: any = useState({
    selectedCustomer: null as any,
    customerAddress: '',
    hookEntries: [] as any[],
  });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHookId, setEditingHookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchHooks = async () => {
    try {
      const resp = await axios.get(`${process.env.api_url}/hooks`, {
        params: { created_by: user?.data?._id },
      });
      setHooks(resp.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch hooks');
    }
  };

  const fetchCategories = async () => {
    try {
      const resp = await axios.get(`${process.env.api_url}/hooks/categories`);
      const cats = resp.data.map((cat: any) => ({
        id: cat._id,
        name: cat.name,
      }));
      setHookCategories(cats);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch hook categories');
    }
  };

  // Fetch hook categories and hooks on mount.
  useEffect(() => {
    fetchHooks();
    fetchCategories();
  }, []);

  // Compute filtered hooks based on search query.
  const filteredHooks = hooks.filter((hook) =>
    hook.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomerSelect = (customer: any) => {
    if (customer) {
      setFormData((prev: any) => ({
        ...prev,
        selectedCustomer: customer,
      }));
      setAddresses(Array.isArray(customer.addresses) ? customer.addresses : []);
    }
  };

  const handleAddressSelect = (address: string) => {
    setFormData((prev: any) => ({
      ...prev,
      customerAddress: addresses.find((adr) => adr.address_id == address),
    }));
  };

  const addHookEntry = () => {
    const newEntry = {
      entryId: Date.now().toString(),
      category_id: '',
      hooksAvailable: '',
      totalHooks: '',
      editing: true,
    };
    setFormData((prev: any) => ({
      ...prev,
      hookEntries: [...prev.hookEntries, newEntry],
    }));
  };

  const updateEntry = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const updatedEntries = [...prev.hookEntries];
      if (field === 'hooksAvailable' || field === 'totalHooks') {
        updatedEntries[index][field] = value === '' ? '' : parseInt(value, 10);
      } else {
        updatedEntries[index][field] = value;
      }
      return { ...prev, hookEntries: updatedEntries };
    });
  };

  const toggleEditEntry = (index: number) => {
    setFormData((prev: any) => {
      const updatedEntries = prev.hookEntries.map((entry: any, i: any) =>
        i === index ? { ...entry, editing: !entry.editing } : entry
      );
      return { ...prev, hookEntries: updatedEntries };
    });
  };

  const removeEntry = (index: number) => {
    setFormData((prev: any) => {
      const updatedEntries = prev.hookEntries.filter(
        (_: any, i: any) => i !== index
      );
      return { ...prev, hookEntries: updatedEntries };
    });
  };

  const handleEditHook = async (hookData: any) => {
    const { data = {} } = await axios.get(
      `${process.env.api_url}/customers/${hookData.customer_id}`
    );
    const { customer = {} } = data;
    setFormData({
      selectedCustomer: customer,
      customerAddress: hookData.customer_address,
      hookEntries: hookData.hooks.map((entry: any) => ({
        entryId: entry.entryId,
        category_id:
          typeof entry.category_id === 'object'
            ? entry.category_id.$oid
            : entry.category_id,
        hooksAvailable: entry.hooksAvailable,
        totalHooks: entry.totalHooks,
        editing: false,
        category_name: entry.category_name,
      })),
    });
    setAddresses(customer.addresses);
    setEditingHookId(hookData._id);
    setIsEditing(true);
    setOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    if (!formData.customerAddress) {
      toast.error('Please select an address');
      return;
    }
    if (formData.hookEntries.length === 0) {
      toast.error('Please add at least one hook entry');
      return;
    }
    for (let entry of formData.hookEntries) {
      if (entry.editing) {
        toast.error(
          'Please complete editing all hook entries before submitting'
        );
        return;
      }
    }
    const hooksWithCategoryName = formData.hookEntries.map((entry: any) => {
      const category = hookCategories.find(
        (cat: any) => cat.id === entry.category_id
      );
      return {
        ...entry,
        category_name: category ? category.name : '',
      };
    });

    const payload = {
      customer_id: formData.selectedCustomer._id,
      customer_name: formData.selectedCustomer.contact_name,
      customer_address: formData.customerAddress,
      hooks: hooksWithCategoryName,
      created_by: user?.data?._id,
    };

    try {
      if (isEditing && editingHookId) {
        await axios.put(
          `${process.env.api_url}/hooks/${editingHookId}`,
          payload
        );
        toast.success('Hook details updated successfully');
      } else {
        await axios.post(`${process.env.api_url}/hooks`, payload);
        toast.success('Hook details submitted successfully');
      }
      setFormData({
        selectedCustomer: null,
        customerAddress: '',
        hookEntries: [],
      });
      setAddresses([]);
      setOpen(false);
      setIsEditing(false);
      setEditingHookId(null);
      await fetchHooks();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit hook details');
    }
  };

  return (
    <Container maxWidth='lg'>
      <Container sx={{ py: 4, display: 'flex', flexDirection: 'column' }}>
        <Header title='Customer Hook Management' showBackButton />

        {/* Search Field */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 4,
          }}
        >
          <TextField
            label='Search by Customer Name'
            variant='outlined'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: '100%',
              maxWidth: 400,
              color: 'white !important',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
                color: 'white',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
                color: 'white',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
                color: 'white',
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
              setAddresses([]);
              setIsEditing(false);
              setEditingHookId(null);
              setOpen(true);
            }}
          >
            Create Hook Entry
          </Button>
        </Box>

        {filteredHooks.length === 0 ? (
          <Alert
            severity='info'
            variant='outlined'
            sx={{
              justifyContent: 'center',
              borderRadius: 3,
            }}
          >
            {hooks.length === 0
              ? 'No hook entries found. Create your first entry!'
              : 'No hook entries match your search.'}
          </Alert>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 3,
            }}
          >
            {filteredHooks.map((h: any) => (
              <ShopHookCard key={h._id} hookData={h} onEdit={handleEditHook} />
            ))}
          </Box>
        )}
        <HookDialog
          open={open}
          setOpen={setOpen}
          isEditing={isEditing}
          formData={formData}
          addresses={addresses}
          hooks={hooks}
          hookCategories={hookCategories}
          handleSubmit={handleSubmit}
          handleCustomerSelect={handleCustomerSelect}
          handleAddressSelect={handleAddressSelect}
          updateEntry={updateEntry as any}
          removeEntry={removeEntry}
          toggleEditEntry={toggleEditEntry}
          addHookEntry={addHookEntry}
        />
      </Container>
    </Container>
  );
}

export default CustomerHooks;
