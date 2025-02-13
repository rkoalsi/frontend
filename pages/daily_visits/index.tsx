import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { Fragment, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import AuthContext from '../../src/components/Auth';
import { useRouter } from 'next/router';

function DailyVisits() {
  const [dailyVisits, setDailyVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user }: any = useContext(AuthContext);
  const router = useRouter();
  // State for handling the creation dialog and form fields
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState('');
  const [selfie, setSelfie]: any = useState(null);

  // Fetch daily visits from the API
  const getData = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${process.env.api_url}/daily_visits`, {
        params: { created_by: user?.data?._id },
      });
      setDailyVisits(resp.data);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching daily visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // Function to create a new daily visit entry
  const createDailyVisit = async (formData: any) => {
    setLoading(true);
    try {
      await axios.post(`${process.env.api_url}/daily_visits`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Daily visit created successfully!');
      // Refresh the list after creation
      getData();
      // Reset form and close dialog
      setPlan('');
      setSelfie(null);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error creating daily visit');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for creating a daily visit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    // Create FormData to send both text and file data
    const formData = new FormData();
    formData.append('plan', plan);
    if (selfie) {
      formData.append('selfie', selfie);
    }
    formData.append('created_by', user?.data?._id);
    // Optionally, you can add a date here (or let the backend generate it)
    // formData.append('date', new Date().toISOString());
    await createDailyVisit(formData);
  };

  // Handle file input change
  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelfie(e.target.files[0]);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h4' align='center' gutterBottom color='white'>
        Daily Visits
      </Typography>

      {/* Create Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Button
          variant='contained'
          color='primary'
          onClick={() => setOpen(true)}
        >
          Create Daily Visit
        </Button>
      </Box>

      {/* List of Daily Visits */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : dailyVisits.length === 0 ? (
        <Typography align='center' variant='h6' color='white'>
          No Daily Visits Available.
        </Typography>
      ) : (
        <Box sx={{ background: 'none', borderRadius: '8px' }}>
          <List>
            {dailyVisits.map((visit: any, index) => (
              <Fragment key={visit._id}>
                <ListItem
                  onClick={() => router.push(`/daily_visits/${visit._id}`)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '16px',
                    backgroundColor: 'white',
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    cursor: 'pointer',
                  }}
                >
                  {/* Display the date as the main highlight */}
                  <Typography variant='h6' fontWeight='bold' color='black'>
                    {new Date(visit.created_at).toLocaleDateString()}
                  </Typography>
                  {/* Display the plan */}
                  <Typography variant='body1' fontWeight='bold' color='black'>
                    Plan: {visit.plan}
                  </Typography>
                  {/* If available, display the selfie */}
                  {visit.selfie && (
                    <Box sx={{ mt: 1 }}>
                      <img
                        src={visit.selfie}
                        alt='Selfie'
                        style={{ maxWidth: '200px', borderRadius: '8px' }}
                      />
                    </Box>
                  )}
                </ListItem>
                {index < dailyVisits.length - 1 && <Divider />}
              </Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* Dialog for Creating a Daily Visit */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Create Daily Visit</DialogTitle>
        <DialogContent>
          <Box component='form' onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              label='Plan for the day'
              fullWidth
              multiline
              rows={4}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              margin='normal'
              required
            />
            <Button variant='outlined' component='label'>
              Upload Selfie
              <input
                type='file'
                hidden
                accept='image/*'
                onChange={handleFileChange}
              />
            </Button>
            {selfie && (
              <Typography variant='body2' sx={{ mt: 1 }}>
                Selected file: {selfie.name}
              </Typography>
            )}
            <DialogActions sx={{ mt: 2 }}>
              <Button onClick={() => setOpen(false)} color='secondary'>
                Cancel
              </Button>
              <Button type='submit' variant='contained' color='primary'>
                Submit
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default DailyVisits;
