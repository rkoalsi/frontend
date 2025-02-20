import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  CircularProgress,
  List,
  ListItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../../src/components/common/Header';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme: any = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Fetch training videos from the API
  const getData = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${process.env.api_url}/announcements`);
      setAnnouncements(resp.data);
    } catch (error: any) {
      console.error(error);
      toast.error('Error fetching training videos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      justifyContent='flex-start'
      sx={{
        width: '100%',
        gap: '16px',
        padding: isMobile ? '16px' : '16px',
      }}
    >
      <Header title={'Announcements'} showBackButton />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : announcements.length === 0 ? (
        <Typography align='center' variant='h6' color='white'>
          No Announcements available.
        </Typography>
      ) : (
        <Box
          sx={{
            background: 'none',
            borderRadius: '8px',
          }}
        >
          <List>
            {announcements.map((announcement: any, index) => (
              <Fragment key={announcement._id}>
                <ListItem
                  component='div'
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    textAlign: 'flex-start',
                    backgroundColor: 'white',
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    cursor: 'pointer',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      width: '100%',
                      maxWidth: '400px',
                      textAlign: 'flex-start',
                    }}
                  >
                    <Typography variant='h6' fontWeight='bold' color='black'>
                      {announcement.title}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='black'
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {announcement.description}
                    </Typography>
                    <br />
                    <Typography variant='body2' color='black'>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </ListItem>
                {index < announcements.length - 1 && <Divider />}
              </Fragment>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}

export default Announcements;
