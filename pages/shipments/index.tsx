import { useContext, useEffect, useState, useRef, useCallback } from 'react';
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

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
];

function Shipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const { user }: any = useContext(AuthContext);
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getData = async (searchTerm = '', pageNum = 1, append = false, status = '') => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const isAdminOrManager = user?.data?.role?.includes('admin') || user?.data?.role?.includes('catalogue_manager');
      const resp = await axios.get(`${process.env.api_url}/shipments`, {
        params: {
          created_by: user?.data?._id,
          page: pageNum,
          per_page: 20,
          ...(searchTerm && { search: searchTerm }),
          ...(status && { status: status }),
          ...(isAdminOrManager && { role: 'admin' }),
        },
      });
      const newShipments = resp.data.shipments || [];
      if (append) {
        setShipments(prev => [...prev, ...newShipments]);
      } else {
        setShipments(newShipments);
      }
      setTotal(resp.data.total || 0);
      setHasMore(pageNum < (resp.data.total_pages || 0));
    } catch (error) {
      console.error(error);
      toast.error('Error fetching shipments');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user?.data?._id) {
      setPage(1);
      setShipments([]);
      getData(search, 1, false, statusFilter);
    }
  }, [user?.data?._id, statusFilter]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (user?.data?._id) {
        setPage(1);
        setShipments([]);
        getData(search, 1, false, statusFilter);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      getData(search, nextPage, true, statusFilter);
    }
  }, [loadingMore, hasMore, page, search, statusFilter]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, loadingMore, loading]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'delivered') return 'success';
    if (statusLower === 'shipped') return 'primary';
    return 'default';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
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
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            ),
          }}
          size='small'
          sx={{
            backgroundColor: 'white',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              borderRadius: 2,
            },
          }}
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
            onClick={() => handleStatusFilter(filter.value)}
            sx={{
              height: 28,
              fontSize: '0.75rem',
              cursor: 'pointer',
              backgroundColor: statusFilter === filter.value ? undefined : 'white',
            }}
          />
        ))}
      </Box>

      {/* Total Count */}
      {!loading && total > 0 && (
        <Typography variant='caption' color='white'>
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
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <LocalShippingIcon
            sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
          />
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                  }}
                >
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

                {/* Bottom row: Date, Total */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant='body2' color='text.secondary'>
                      {formatDate(shipment.date)}
                    </Typography>
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

          {/* Infinite scroll trigger */}
          <Box ref={loadMoreRef} sx={{ height: 20, mt: 1 }} />

          {/* Loading more indicator */}
          {loadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* End of list */}
          {!hasMore && shipments.length > 0 && (
            <Typography variant='caption' color='text.disabled' sx={{ textAlign: 'center', display: 'block', py: 2 }}>
              No more shipments
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default Shipments;
