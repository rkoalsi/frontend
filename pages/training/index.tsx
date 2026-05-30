import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Pagination,
  Button,
  TextField,
} from '@mui/material';

const PAGE_SIZE = 12;
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../../src/components/common/Header';

function Training() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
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
        <Typography align='center' variant='h6'>
          No training videos available.
        </Typography>
      ) : (() => {
        const totalPages = Math.ceil(trainings.length / PAGE_SIZE);
        const paged: any[] = trainings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        return (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 2,
              }}
            >
              {paged.map((video: any) => (
                <Card key={video._id} sx={{ maxWidth: '100%' }}>
                  <CardHeader title={video.title} subheader={video.description || ''} />
                  <CardContent>
                    <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                      <video
                        controls
                        src={video.video_url}
                        style={{
                          position: 'absolute', top: 0, left: 0,
                          width: '100%', height: '100%', objectFit: 'cover',
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, val) => { setPage(val); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  color='primary'
                  shape='rounded'
                  siblingCount={1}
                  boundaryCount={1}
                />
                <Box
                  component='form'
                  onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    const input = (e.currentTarget.elements.namedItem('jumpPage') as HTMLInputElement).value;
                    const num = parseInt(input, 10);
                    if (num >= 1 && num <= totalPages) {
                      setPage(num);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      (e.currentTarget.elements.namedItem('jumpPage') as HTMLInputElement).value = '';
                    }
                  }}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Typography variant='body2' color='text.secondary'>Go to page</Typography>
                  <TextField name='jumpPage' size='small' type='number' slotProps={{ htmlInput: { min: 1, max: totalPages } }} sx={{ width: 72 }} />
                  <Button type='submit' size='small' variant='outlined' sx={{ borderRadius: 2 }}>Go</Button>
                </Box>
              </Box>
            )}
          </>
        );
      })()}
    </Box>
  );
}

export default Training;
