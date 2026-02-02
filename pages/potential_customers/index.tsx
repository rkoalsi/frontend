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
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Header from '../../src/components/common/Header';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';
import EditIcon from '@mui/icons-material/Edit';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CommentIcon from '@mui/icons-material/Comment';
import PotentialCustomerDialog from '../../src/components/daily_visits/PotentialCustomerDialog';

const statusColor: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
  Onboard: 'success',
  Decline: 'error',
  Intalks: 'info',
  Issue: 'warning',
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
    <Box sx={{ color: 'text.secondary', mt: 0.2, flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Typography
        variant='body2'
        fontWeight={500}
        sx={{ wordBreak: 'break-word' }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

const PotentialCustomerCard = ({
  data,
  onEdit,
}: {
  data: any;
  onEdit: (d: any) => void;
}) => {
  return (
    <Card
      sx={{
        width: '100%',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2, #1565c0)',
          color: 'white',
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            minWidth: 0,
          }}
        >
          <StorefrontIcon fontSize='small' />
          <Typography variant='subtitle1' fontWeight={700} noWrap>
            {data.name}
          </Typography>
        </Box>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
        >
          {data.status && (
            <Chip
              label={data.status}
              size='small'
              color={statusColor[data.status] || 'default'}
              sx={{ fontWeight: 600, color: 'white', height: 24 }}
            />
          )}
          <Chip
            label={`Tier ${data.tier}`}
            size='small'
            sx={{
              fontWeight: 600,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              height: 24,
            }}
          />
        </Box>
      </Box>

      <CardContent sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.5}>
          <InfoRow
            icon={<PlaceIcon fontSize='small' />}
            label='Address'
            value={`${data.address}${data.state_city ? `, ${data.state_city}` : ''}`}
          />

          {data.customer_name && (
            <InfoRow
              icon={<PersonIcon fontSize='small' />}
              label='Customer Name'
              value={data.customer_name}
            />
          )}

          {data.mobile && (
            <InfoRow
              icon={<PhoneIcon fontSize='small' />}
              label='Mobile'
              value={data.mobile}
            />
          )}

          {data.follow_up_date && (
            <InfoRow
              icon={<CalendarTodayIcon fontSize='small' />}
              label='Follow Up Date'
              value={data.follow_up_date}
            />
          )}

          {data.comments && (
            <InfoRow
              icon={<CommentIcon fontSize='small' />}
              label='Comments'
              value={data.comments}
            />
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant='outlined'
            size='small'
            startIcon={<EditIcon />}
            onClick={() => onEdit(data)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Edit
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

function PotentialCustomers() {
  const { user }: any = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [potentialCustomers, setPotentialCustomers] = useState<any[]>([]);
  const [formData, setFormData]: any = useState({
    name: '',
    address: '',
    state_city: '',
    tier: '',
    customer_name: '',
    mobile: '',
    follow_up_date: '',
    comments: '',
    status: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    fetchPotentialCustomers();
  }, []);

  const filteredPotentialCustomers = potentialCustomers.filter(
    (potentialCustomer: any) =>
      potentialCustomer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChange = (key: string, value: any) => {
    if (value) {
      setFormData((prev: any) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  const handleEdit = async (data: any) => {
    setFormData({
      _id: data._id,
      name: data.name,
      address: data.address,
      state_city: data.state_city || '',
      tier: data.tier,
      customer_name: data.customer_name || '',
      mobile: data.mobile || '',
      follow_up_date: data.follow_up_date || '',
      comments: data.comments || '',
      status: data.status || '',
    });
    setEditingId(data._id);
    setIsEditing(true);
    setOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter a store name');
      return;
    }
    if (!formData.address) {
      toast.error('Please enter an address');
      return;
    }
    if (!formData.tier) {
      toast.error('Please select a tier');
      return;
    }
    const payload = {
      _id: formData._id,
      name: formData.name,
      address: formData.address,
      state_city: formData.state_city,
      tier: formData.tier,
      customer_name: formData.customer_name,
      mobile: formData.mobile,
      follow_up_date: formData.follow_up_date,
      comments: formData.comments,
      status: formData.status,
    };

    try {
      if (isEditing && editingId) {
        await axios.put(
          `${process.env.api_url}/potential_customers/${editingId}`,
          payload
        );
        toast.success('Potential customer updated successfully');
      } else {
        await axios.post(`${process.env.api_url}/potential_customers`, {
          ...payload,
          created_by: user?.data?._id,
        });
        toast.success('Potential customer created successfully');
      }
      setFormData({
        name: '',
        address: '',
        state_city: '',
        tier: '',
        customer_name: '',
        mobile: '',
        follow_up_date: '',
        comments: '',
        status: '',
      });
      setOpen(false);
      setIsEditing(false);
      setEditingId(null);
      await fetchPotentialCustomers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit potential customer details');
    }
  };

  return (
    <Container maxWidth='lg'>
      <Container sx={{ py: 4, display: 'flex', flexDirection: 'column' }}>
        <Container
          sx={{
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Header title='Potential Customers' showBackButton />
          <Alert color='info'>
            This page is for creation of NEW customers that do not exist on zoho
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
            label='Search by Store Name'
            variant='outlined'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: '100%',
              maxWidth: 400,
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '& .MuiInputLabel-root': {
                color: 'white',
              },
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
                name: '',
                address: '',
                state_city: '',
                tier: '',
                customer_name: '',
                mobile: '',
                follow_up_date: '',
                comments: '',
                status: '',
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
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(auto-fill, minmax(300px, 1fr))',
              },
              gap: 3,
            }}
          >
            {filteredPotentialCustomers.map((pc: any) => (
              <PotentialCustomerCard
                key={pc._id}
                data={pc}
                onEdit={handleEdit}
              />
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
