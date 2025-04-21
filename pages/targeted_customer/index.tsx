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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import Header from '../../src/components/common/Header';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';
import formatAddress from '../../src/util/formatAddress';

const ShopHookCard = ({ user, hookData, onAddNotes }: any) => {
  return (
    <Card
      sx={{
        width: '100%',
        maxWidth: 600,
        margin: 'auto',
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <div
        style={{
          backgroundColor: '#1976d2',
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
        <div
          style={{
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Typography variant='body2' color='textSecondary'>
            Customer Name
          </Typography>
          <Typography variant='subtitle1' fontWeight='bold'>
            {hookData.customer_name}
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Shop Address
          </Typography>
          <Typography variant='subtitle1' fontWeight='bold'>
            {formatAddress(hookData.address)}
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Created At
          </Typography>
          <Typography variant='subtitle1' fontWeight='bold'>
            {new Date(hookData.created_at).toDateString()}
          </Typography>
          {hookData.notes && hookData.notes.length > 0 && (
            <>
              <Typography variant='body2' color='textSecondary'>
                Notes
              </Typography>
              {hookData.notes
                .filter((h: any) => h.created_by.includes(user?.data?._id))
                .map((h: any, index: number) => (
                  <Typography variant='subtitle1' fontWeight='bold'>
                    {h.note || 'No notes added'}
                  </Typography>
                ))}
            </>
          )}
        </div>
        <Button
          variant='contained'
          color='primary'
          fullWidth
          onClick={() => onAddNotes(hookData)}
        >
          Add Notes
        </Button>
      </CardContent>
    </Card>
  );
};

function TargetedCustomer() {
  const { user }: any = useContext(AuthContext);
  const [customersReorder, setTargetedCustomer] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [note, setNote] = useState('');

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
      toast.error('Failed to fetch targeted customers');
    }
  };

  useEffect(() => {
    fetchTargetedCustomer();
  }, []);

  const filteredTargetedCustomer = customersReorder.filter((customer) =>
    customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNotes = (customer: any) => {
    setCurrentCustomer(customer);
    setNote(
      customer?.notes?.filter((n: any) =>
        n.created_by.includes(user?.data?._id)
      )[0]?.note || ''
    );
    setOpenDialog(true);
  };

  const handleSaveNotes = async () => {
    if (!currentCustomer) return;
    try {
      await axios.post(`${process.env.api_url}/targeted_customers/save_note`, {
        notes: note,
        _id: currentCustomer._id,
        created_by: user?.data?._id,
      });
      toast.success('Notes updated successfully');
      setOpenDialog(false);
      fetchTargetedCustomer();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update notes');
    }
  };

  return (
    <Container maxWidth='lg'>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          mb: 4,
          mt: 2,
        }}
      >
        <Header title='Targeted Customers' showBackButton />
        <Alert color='info'>
          This is for existing customers that need to be targeted.
        </Alert>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
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
        <Alert severity='info' variant='outlined' sx={{ color: 'white' }}>
          No Targeted Customers found.
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 3,
          }}
        >
          {filteredTargetedCustomer.map((h) => (
            <ShopHookCard
              user={user}
              key={h._id}
              hookData={h}
              onAddNotes={handleAddNotes}
            />
          ))}
        </Box>
      )}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Notes</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant='outlined'
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color='secondary'>
            Cancel
          </Button>
          <Button onClick={handleSaveNotes} color='primary'>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TargetedCustomer;
