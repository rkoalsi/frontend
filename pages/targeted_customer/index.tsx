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
import Header from '../../src/components/common/Header';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';
import formatAddress from '../../src/util/formatAddress';

const ShopHookCard = ({ hookData }: any) => {
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
          <div>
            <Typography variant='body2' color='textSecondary'>
              Created At
            </Typography>
            <Typography variant='subtitle1' fontWeight='bold'>
              {new Date(hookData.created_at).toDateString()}
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- TargetedCustomer Component ----------

function TargetedCustomer() {
  const { user }: any = useContext(AuthContext);
  const [customersReorder, setTargetedCustomer] = useState<any[]>([]);
  const [formData, setFormData]: any = useState({
    customer: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query

  const fetchTargetedCustomer = async () => {
    try {
      const resp = await axios.get(
        `${process.env.api_url}/targeted_customers`,
        {
          params: { user: user?.data?._id },
        }
      );
      setTargetedCustomer(resp.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch expected reorders');
    }
  };

  // Fetch hook categories and potential_customers on mount.
  useEffect(() => {
    fetchTargetedCustomer();
  }, []);

  // Compute filtered potential_customers based on search query.
  const filteredTargetedCustomer = customersReorder.filter(
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
          <Header title='Targeted Customers' showBackButton />
          <Alert color='info'>
            This is for existing customers that need to be targeted.
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

        {filteredTargetedCustomer.length === 0 ? (
          <Alert
            severity='info'
            variant='outlined'
            sx={{
              color: 'white',
              justifyContent: 'center',
              borderRadius: 3,
            }}
          >
            {filteredTargetedCustomer.length === 0
              ? 'No Targeted Customers found.'
              : 'No Targeted Customers match your search.'}
          </Alert>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 3,
            }}
          >
            {filteredTargetedCustomer.map((h: any) => (
              <ShopHookCard key={h._id} hookData={h} />
            ))}
          </Box>
        )}
      </Container>
    </Container>
  );
}

export default TargetedCustomer;
