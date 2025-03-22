import { useState, useEffect, useContext } from 'react';
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
import ExpectedReorderDialog from '../../src/components/daily_visits/ExpectedReorderDialog';
import formatAddress from '../../src/util/formatAddress';

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
          {hookData.customer_name}
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
              Customer Name
            </Typography>
            <Typography variant='subtitle1' fontWeight='bold'>
              {hookData.customer_name}
            </Typography>
          </div>
          <div>
            <Typography variant='body2' color='textSecondary'>
              Shop Address
            </Typography>
            <Typography variant='subtitle1' fontWeight='bold'>
              {formatAddress(hookData.address)}
            </Typography>
          </div>
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

// ---------- ExpectedReorder Component ----------

function ExpectedReorder() {
  const { user }: any = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [customersReorder, setExpectedReorder] = useState<any[]>([]);
  const [formData, setFormData]: any = useState({
    customer: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query

  const fetchExpectedReorder = async () => {
    try {
      const resp = await axios.get(`${process.env.api_url}/expected_reorders`, {
        params: { created_by: user?.data?._id },
      });
      setExpectedReorder(resp.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch expected reorders');
    }
  };

  // Fetch hook categories and potential_customers on mount.
  useEffect(() => {
    fetchExpectedReorder();
  }, []);

  // Compute filtered potential_customers based on search query.
  const filteredExpectedReorder = customersReorder.filter(
    (potentialCustomer: any) =>
      potentialCustomer.customer_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
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
    const { data = {} } = await axios.get(
      `${process.env.api_url}/customers/${hookData.customer_id}`
    );
    const { customer = {} } = data;
    setFormData({
      _id: hookData._id,
      customer: customer,
      address: hookData.address,
    });
    setEditingId(hookData._id);
    setIsEditing(true);
    setOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    console.log(editingId);
    if (!formData.customer) {
      toast.error('Please enter a customer');
      return;
    }
    const payload = {
      _id: formData._id,
      customer_id: formData?.customer?._id,
      customer_name: formData?.customer?.contact_name,
      address: formData?.address,
    };

    try {
      if (isEditing && editingId) {
        await axios.put(
          `${process.env.api_url}/expected_reorders/${editingId}`,
          payload
        );
        toast.success('Hook details updated successfully');
      } else {
        await axios.post(`${process.env.api_url}/expected_reorders`, {
          ...payload,
          created_by: user?.data?._id,
        });
        toast.success('Hook details submitted successfully');
      }
      setFormData({
        customer: '',
      });
      setOpen(false);
      setIsEditing(false);
      setEditingId(null);
      await fetchExpectedReorder();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit hook details');
    }
  };

  return (
    <Container maxWidth='lg'>
      <Container
        sx={{
          py: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Container
          sx={{
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Header title='Customers Reorder' showBackButton />
          <Alert color='info'>
            This is for Existing Customers In Zoho that are expected to place
            orders soon
          </Alert>
        </Container>
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
            Create Expected Reorder
          </Button>
        </Box>

        {filteredExpectedReorder.length === 0 ? (
          <Alert
            severity='info'
            variant='outlined'
            sx={{
              color: 'white',
              justifyContent: 'center',
              borderRadius: 3,
            }}
          >
            {filteredExpectedReorder.length === 0
              ? 'No Expected Reorders found.'
              : 'No Expected Reorders match your search.'}
          </Alert>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 3,
            }}
          >
            {filteredExpectedReorder.map((h: any) => (
              <ShopHookCard key={h._id} hookData={h} onEdit={handleEditHook} />
            ))}
          </Box>
        )}
        <ExpectedReorderDialog
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

export default ExpectedReorder;
