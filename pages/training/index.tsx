import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../../src/components/common/Header';

function Training() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme: any = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Fetch training videos from the API
  const getData = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${process.env.api_url}/trainings`);
      setTrainings(resp.data);
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
      <Header title={'View Training Videos'} showBackButton />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : trainings.length === 0 ? (
        <Typography align='center' variant='h6' color='white'>
          No training videos available.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr',
            },
            gap: 2,
          }}
        >
          {trainings.map((video: any) => (
            <Card key={video._id} sx={{ maxWidth: '100%' }}>
              <CardHeader
                title={video.title}
                subheader={video.description || ''}
              />
              <CardContent>
                {/* Video container with a 16:9 aspect ratio */}
                <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                  <video
                    controls
                    src={video.video_url}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default Training;
