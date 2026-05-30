import { useContext, useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Pagination,
  Button,
} from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';
import AuthContext from '../../src/components/Auth';
import { useRouter } from 'next/router';
import Header from '../../src/components/common/Header';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
];

function Shipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const { user }: any = useContext(AuthContext);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getData = async (searchTerm = '', pageNum = 1, status = '') => {
    setLoading(true);
    try {
      const isAdminOrManager = user?.role?.includes('admin') || user?.role?.includes('catalogue_manager');
      const resp = await axios.get(`${process.env.api_url}/shipments`, {
        params: {
          created_by: user?._id,
          page: pageNum,
          per_page: PAGE_SIZE,
          ...(searchTerm && { search: searchTerm }),
          ...(status && { status }),
          ...(isAdminOrManager && { role: 'admin' }),
        },
      });
      setShipments(resp.data.shipments || []);
      setTotal(resp.data.total || 0);
      setTotalPages(resp.data.total_pages || 0);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      setPage(1);
      getData(search, 1, statusFilter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, statusFilter]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (user?._id) {
        setPage(1);
        getData(search, 1, statusFilter);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, val: number) => {
    setPage(val);
    getData(search, val, statusFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'delivered') return 'success';
    if (s === 'shipped') return 'primary';
    return 'default';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      sx={{ width: '100%', gap: 1.5, p: isMobile ? 1.5 : 3 }}
    >
      <Header title='Shipments' showBackButton />

      {/* Search Bar */}
      <Box sx={{ width: '100%', maxWidth: 500, mb: 0.5 }}>
        <TextField
          fullWidth
          placeholder='Search shipments...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            ),
          }}
          size='small'
          sx={{ borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      {/* Status Filters */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center', mb: 0.5 }}>
        {STATUS_FILTERS.map((filter) => (
          <Chip
            key={filter.value}
            label={filter.label}
            size='small'
            variant={statusFilter === filter.value ? 'filled' : 'outlined'}
            color={statusFilter === filter.value ? 'primary' : 'default'}
            onClick={() => setStatusFilter(filter.value)}
            sx={{
              height: 28,
              fontSize: '0.75rem',
              cursor: 'pointer',
              backgroundColor: statusFilter === filter.value ? undefined : 'background.paper',
            }}
          />
        ))}
      </Box>

      {/* Total Count */}
      {!loading && total > 0 && (
        <Typography variant='caption' color='text.secondary'>
          {total} shipment{total !== 1 ? 's' : ''}
        </Typography>
      )}

      {/* Display Shipments */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : shipments.length === 0 ? (
        <Paper
          elevation={1}
          sx={{ p: 3, textAlign: 'center', borderRadius: 2, width: '100%', maxWidth: 400 }}
        >
          <LocalShippingIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant='body1' color='text.secondary' gutterBottom>
            No Shipments Found
          </Typography>
          <Typography variant='caption' color='text.disabled'>
            {search || statusFilter ? 'Try different filters' : 'No shipments available'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ width: '100%', maxWidth: 500 }}>
          {shipments.map((shipment: any) => (
            <Card
              key={shipment._id}
              onClick={() => router.push(`/shipments/${shipment._id}`)}
              sx={{
                mb: 1.5,
                cursor: 'pointer',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Top row: Shipment number + Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box>
                    <Typography variant='subtitle1' fontWeight={600} sx={{ lineHeight: 1.2 }}>
                      {shipment.shipment_number || 'N/A'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      SO: {shipment.salesorder_number || 'N/A'}
                      {shipment.invoice_number && ` • INV: ${shipment.invoice_number}`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={(shipment.status || 'Unknown').charAt(0).toUpperCase() + (shipment.status || 'Unknown').slice(1).toLowerCase()}
                      color={getStatusColor(shipment.status)}
                      size='small'
                      sx={{ height: 24, fontSize: '0.7rem' }}
                    />
                    <ArrowForwardIosIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  </Box>
                </Box>

                {/* Customer name */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, mr: 0.75, color: 'primary.main' }} />
                  <Typography variant='body2' fontWeight={500} noWrap>
                    {shipment.customer_name || 'Unknown'}
                  </Typography>
                </Box>

                {/* Bottom row: Date, Total, Images indicator */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant='body2' color='text.secondary'>
                        {formatDate(shipment.date)}
                      </Typography>
                    </Box>
                    {shipment.images && shipment.images.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhotoLibraryIcon sx={{ fontSize: 14, mr: 0.3, color: 'primary.main' }} />
                        <Typography variant='caption' color='primary.main'>
                          {shipment.images.length}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {shipment.total && (
                    <Typography variant='body2' fontWeight={600} color='primary.main'>
                      ₹{Number(shipment.total).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pt: 1 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
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
                    getData(search, num, statusFilter);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    (e.currentTarget.elements.namedItem('jumpPage') as HTMLInputElement).value = '';
                  }
                }}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Typography variant='body2' color='text.secondary'>Go to page</Typography>
                <TextField
                  name='jumpPage'
                  size='small'
                  type='number'
                  slotProps={{ htmlInput: { min: 1, max: totalPages } }}
                  sx={{ width: 72 }}
                />
                <Button type='submit' size='small' variant='outlined' sx={{ borderRadius: 2 }}>Go</Button>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default Shipments;
