'use client';
import { useContext, useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Alert,
  Container,
  useTheme,
  useMediaQuery,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  alpha,
  IconButton,
  Skeleton,
  Drawer,
  Divider,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog,
  DialogContent,
} from '@mui/material';
import AuthContext from '../../../src/components/Auth';
import {
  Search,
  ArrowBack,
  CheckCircle,
  Schedule,
  FilterList,
  Clear,
  Close,
  LocalShipping,
  LocationOn,
  Inventory,
  PhotoLibrary,
  ChevronLeft,
  ChevronRight,
  CalendarToday,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../../src/util/axios';
import { format } from 'date-fns';

interface Shipment {
  _id: string;
  shipment_id?: string;
  shipment_number: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  customer_name?: string;
  salesorder_number?: string;
  invoice_number?: string;
  carrier?: string;
  tracking_number?: string;
  shipping_address?: any;
  line_items?: any[];
  images?: any[];
  shipping_charge?: number;
}


const CustomerShipmentsPage = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailShipment, setDetailShipment] = useState<Shipment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Image carousel state
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchShipments = useCallback(async () => {
    if (!user?.data?.customer_id) {
      setLoading(false);
      setError('Customer ID not found. Please contact support.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/customer_portal/shipments', {
        params: {
          customer_id: user.data.customer_id,
          page: page + 1,
          per_page: rowsPerPage,
          status: statusFilter || undefined,
        },
      });

      setShipments(data.shipments || []);
      setTotalItems(data.total || 0);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching shipments:', err);
      setError('Failed to load shipments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, page, rowsPerPage, statusFilter]);

  useEffect(() => {
    if (user) {
      fetchShipments();
    }
  }, [user, fetchShipments]);

  const fetchShipmentDetail = async (shipmentId: string) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      const { data } = await axiosInstance.get(`/shipments/${shipmentId}`);
      setDetailShipment(data);
    } catch (err: any) {
      console.error('Error fetching shipment details:', err);
      setDetailError('Failed to load shipment details. Please try again.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenDrawer = (shipment: Shipment) => {
    setDetailShipment(shipment);
    setDrawerOpen(true);
    fetchShipmentDetail(shipment._id);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDetailShipment(null);
    setCarouselOpen(false);
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setCarouselOpen(true);
  };

  const handleCarouselNext = () => {
    if (detailShipment?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % detailShipment.images!.length);
    }
  };

  const handleCarouselPrev = () => {
    if (detailShipment?.images) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + detailShipment.images!.length) % detailShipment.images!.length
      );
    }
  };

  useEffect(() => {
    if (!carouselOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleCarouselPrev();
      else if (e.key === 'ArrowRight') handleCarouselNext();
      else if (e.key === 'Escape') setCarouselOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselOpen, detailShipment?.images?.length]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'shipped':
        return <Schedule sx={{ fontSize: 16 }} />;
      default:
        return undefined;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'PP');
    } catch {
      return dateStr;
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredShipments = shipments.filter((shipment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      shipment.shipment_number?.toLowerCase().includes(search) ||
      shipment.status?.toLowerCase().includes(search)
    );
  });

  if (!user?.data?.customer_id) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert severity='warning'>
          Your account is not linked to a customer. Please contact support.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth='lg' sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: { xs: 2, md: 4 },
          overflow: 'hidden',
          minHeight: '80vh',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%)',
            color: 'white',
            padding: { xs: 2, sm: 3, md: 4 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: { xs: 150, md: 200 },
              height: { xs: 150, md: 200 },
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 161, 105, 0.1)',
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              position: 'relative',
              zIndex: 1,
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => router.push('/customer')}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
                size={isMobile ? 'small' : 'medium'}
              >
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant={isMobile ? 'h6' : 'h4'} sx={{ fontWeight: 700, mb: 0.5 }}>
                  My Shipments
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  View all your shipments and delivery details
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}
        >
          {error ? (
            <Alert
              severity='error'
              sx={{ borderRadius: 2, mb: 3 }}
              action={
                <Button color='inherit' size='small' onClick={fetchShipments}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : (
            <>
              {/* Filters */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  mb: 3,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Grid container spacing={2} alignItems='center'>
                  <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                    <TextField
                      fullWidth
                      size='small'
                      placeholder='Search by shipment number...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position='start'>
                              <Search color='action' />
                            </InputAdornment>
                          ),
                          endAdornment: searchTerm && (
                            <InputAdornment position='end'>
                              <IconButton size='small' onClick={() => setSearchTerm('')}>
                                <Clear fontSize='small' />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Filter by Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label='Filter by Status'
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPage(0);
                        }}
                      >
                        <MenuItem value=''>All Statuses</MenuItem>
                        <MenuItem value='delivered'>Delivered</MenuItem>
                        <MenuItem value='shipped'>Shipped</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                      fullWidth
                      variant='outlined'
                      startIcon={<FilterList />}
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('');
                        setPage(0);
                      }}
                      sx={{ height: 40 }}
                    >
                      Clear Filters
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Shipments Table/Cards */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  overflow: 'hidden',
                }}
              >
                {loading ? (
                  <Box sx={{ p: 3 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton
                        key={i}
                        variant='rectangular'
                        height={60}
                        sx={{ mb: 1, borderRadius: 1 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TableCell sx={{ fontWeight: 600 }}>Shipment #</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align='right'>
                              Amount
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align='center'>
                              Details
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredShipments.length > 0 ? (
                            filteredShipments.map((shipment) => (
                              <TableRow
                                key={shipment._id}
                                hover
                                sx={{
                                  cursor: 'pointer',
                                  '&:last-child td, &:last-child th': { border: 0 },
                                }}
                                onClick={() => handleOpenDrawer(shipment)}
                              >
                                <TableCell>
                                  <Typography fontWeight={500}>
                                    {shipment.shipment_number}
                                  </Typography>
                                </TableCell>
                                <TableCell>{formatDate(shipment.date)}</TableCell>
                                <TableCell>
                                  <Chip
                                    icon={getStatusIcon(shipment.status)}
                                    label={shipment.status}
                                    color={getStatusColor(shipment.status) as any}
                                    size='small'
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography fontWeight={500}>
                                    {formatCurrency(shipment.total)}
                                  </Typography>
                                </TableCell>
                                <TableCell align='center'>
                                  <Button
                                    size='small'
                                    variant='outlined'
                                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDrawer(shipment);
                                    }}
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} align='center' sx={{ py: 4 }}>
                                <LocalShipping
                                  sx={{ fontSize: 48, color: 'grey.300', mb: 2, display: 'block', mx: 'auto' }}
                                />
                                <Typography color='text.secondary'>No shipments found</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Mobile / Tablet Cards */}
                    <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
                      {filteredShipments.length > 0 ? (
                        filteredShipments.map((shipment) => (
                          <Card
                            key={shipment._id}
                            elevation={0}
                            onClick={() => handleOpenDrawer(shipment)}
                            sx={{
                              mb: 2,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 2,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                              },
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  mb: 1.5,
                                }}
                              >
                                <Box>
                                  <Typography fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                                    {shipment.shipment_number}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    {formatDate(shipment.date)}
                                  </Typography>
                                </Box>
                                <Chip
                                  icon={getStatusIcon(shipment.status)}
                                  label={shipment.status}
                                  color={getStatusColor(shipment.status) as any}
                                  size='small'
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <Typography fontWeight={600} color='primary.main'>
                                  {formatCurrency(shipment.total)}
                                </Typography>
                                <Typography
                                  variant='caption'
                                  color='primary.main'
                                  sx={{ fontWeight: 500 }}
                                >
                                  Tap to view details →
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <LocalShipping sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                          <Typography color='text.secondary'>No shipments found</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Pagination */}
                    <TablePagination
                      component='div'
                      count={totalItems}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25]}
                      sx={{
                        borderTop: `1px solid ${theme.palette.divider}`,
                        '& .MuiTablePagination-toolbar': {
                          flexWrap: 'wrap',
                          justifyContent: { xs: 'center', sm: 'flex-end' },
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows':
                          { fontSize: { xs: '0.75rem', sm: '0.875rem' } },
                      }}
                    />
                  </>
                )}
              </Paper>
            </>
          )}
        </Box>
      </Paper>

      {/* Shipment Detail Drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        slotProps={{
          paper: {
            sx: {
              width: isMobile ? '100%' : { sm: 440, md: 520 },
              maxHeight: isMobile ? '90vh' : '100vh',
              borderTopLeftRadius: isMobile ? 16 : 0,
              borderTopRightRadius: isMobile ? 16 : 0,
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {/* Drag handle for bottom sheet on mobile */}
        {isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
            <Box
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.palette.divider,
              }}
            />
          </Box>
        )}

        {/* Drawer Header */}
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            position: 'sticky',
            top: 0,
            zIndex: 1,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocalShipping color='primary' sx={{ fontSize: { xs: 20, sm: 24 } }} />
            <Box>
              <Typography variant='subtitle1' fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {detailShipment?.shipment_number || 'Shipment Details'}
              </Typography>
              {detailShipment?.status && (
                <Chip
                  icon={getStatusIcon(detailShipment.status)}
                  label={detailShipment.status}
                  color={getStatusColor(detailShipment.status) as any}
                  size='small'
                  sx={{
                    textTransform: 'capitalize',
                    height: 20,
                    fontSize: '0.7rem',
                    mt: 0.25,
                  }}
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={handleCloseDrawer} size='small'>
            <Close />
          </IconButton>
        </Box>

        {/* Drawer Scrollable Content */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {detailLoading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant='rectangular'
                  height={80}
                  sx={{ mb: 1.5, borderRadius: 1 }}
                />
              ))}
            </Box>
          ) : detailError ? (
            <Alert severity='error' sx={{ m: 2 }}>
              {detailError}
            </Alert>
          ) : detailShipment ? (
            <>
              {/* Basic Info */}
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ width: 'calc(50% - 8px)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 13, mr: 0.5, color: 'text.disabled' }} />
                      <Typography variant='caption' color='text.secondary'>
                        Date
                      </Typography>
                    </Box>
                    <Typography variant='body2' fontWeight={500}>
                      {formatDate(detailShipment.date)}
                    </Typography>
                  </Box>

                  {detailShipment.total != null && (
                    <Box sx={{ width: 'calc(50% - 8px)' }}>
                      <Typography variant='caption' color='text.secondary'>
                        Total
                      </Typography>
                      <Typography variant='body2' fontWeight={600} color='primary.main'>
                        {formatCurrency(detailShipment.total)}
                      </Typography>
                    </Box>
                  )}

                  {detailShipment.salesorder_number && (
                    <Box sx={{ width: 'calc(50% - 8px)' }}>
                      <Typography variant='caption' color='text.secondary'>
                        Sales Order
                      </Typography>
                      <Typography variant='body2' fontWeight={500}>
                        {detailShipment.salesorder_number}
                      </Typography>
                    </Box>
                  )}

                  {detailShipment.invoice_number && (
                    <Box sx={{ width: 'calc(50% - 8px)' }}>
                      <Typography variant='caption' color='text.secondary'>
                        Invoice
                      </Typography>
                      <Typography variant='body2' fontWeight={500}>
                        {detailShipment.invoice_number}
                      </Typography>
                    </Box>
                  )}

                  {detailShipment.carrier && (
                    <Box sx={{ width: 'calc(50% - 8px)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <LocalShipping sx={{ fontSize: 13, mr: 0.5, color: 'text.disabled' }} />
                        <Typography variant='caption' color='text.secondary'>
                          Carrier
                        </Typography>
                      </Box>
                      <Typography variant='body2' fontWeight={500}>
                        {detailShipment.carrier}
                      </Typography>
                    </Box>
                  )}

                  {detailShipment.tracking_number && (
                    <Box sx={{ width: 'calc(50% - 8px)' }}>
                      <Typography variant='caption' color='text.secondary'>
                        Tracking #
                      </Typography>
                      <Typography
                        variant='body2'
                        fontWeight={500}
                        sx={{ wordBreak: 'break-all' }}
                      >
                        {detailShipment.tracking_number}
                      </Typography>
                    </Box>
                  )}

                  {detailShipment.shipping_charge != null && (
                    <Box sx={{ width: 'calc(50% - 8px)' }}>
                      <Typography variant='caption' color='text.secondary'>
                        Shipping Charge
                      </Typography>
                      <Typography variant='body2' fontWeight={500}>
                        {formatCurrency(detailShipment.shipping_charge)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Shipping Address */}
                {detailShipment.shipping_address && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <LocationOn sx={{ fontSize: 14, mr: 0.5, mt: 0.3, color: 'text.disabled' }} />
                      <Box>
                        <Typography variant='caption' color='text.secondary'>
                          Shipping Address
                        </Typography>
                        {typeof detailShipment.shipping_address === 'string' ? (
                          <Typography variant='body2'>{detailShipment.shipping_address}</Typography>
                        ) : (
                          <>
                            {detailShipment.shipping_address.attention && (
                              <Typography variant='body2' fontWeight={500}>
                                Attn: {detailShipment.shipping_address.attention}
                              </Typography>
                            )}
                            <Typography variant='body2'>
                              {[
                                detailShipment.shipping_address.address,
                                detailShipment.shipping_address.street2,
                                detailShipment.shipping_address.city,
                                detailShipment.shipping_address.state,
                                detailShipment.shipping_address.zip,
                                detailShipment.shipping_address.country,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </Typography>
                            {detailShipment.shipping_address.phone && (
                              <Typography variant='body2' color='text.secondary'>
                                Ph: {detailShipment.shipping_address.phone}
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    </Box>
                  </>
                )}
              </Box>

              {/* Line Items */}
              {detailShipment.line_items && detailShipment.line_items.length > 0 && (
                <>
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Inventory sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant='subtitle2' fontWeight={600}>
                        Items ({detailShipment.line_items.length})
                      </Typography>
                    </Box>

                    {detailShipment.line_items.map((item: any, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          py: 1.5,
                          borderBottom:
                            index < detailShipment.line_items!.length - 1
                              ? `1px solid ${theme.palette.divider}`
                              : 'none',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Box sx={{ flex: 1, mr: 1 }}>
                            <Typography
                              variant='body2'
                              fontWeight={500}
                              sx={{ lineHeight: 1.3 }}
                            >
                              {item.name || item.item_name || '-'}
                            </Typography>
                            {item.sku && (
                              <Typography variant='caption' color='text.secondary'>
                                SKU: {item.sku}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography variant='body2' fontWeight={500}>
                              ×{item.quantity || item.quantity_shipped || '-'}
                            </Typography>
                            {item.amount && (
                              <Typography variant='caption' color='text.secondary'>
                                {formatCurrency(item.amount)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </>
              )}

              {/* Shipment Images */}
              {detailShipment.images && detailShipment.images.length > 0 && (
                <>
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <PhotoLibrary sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant='subtitle2' fontWeight={600}>
                        Photos ({detailShipment.images.length})
                      </Typography>
                    </Box>

                    <ImageList cols={isMobile ? 1 : 2} gap={8}>
                      {detailShipment.images.map((image: any, index: number) => (
                        <ImageListItem
                          key={index}
                          sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden' }}
                        >
                          <img
                            src={image.url}
                            alt={image.caption || `Shipment image ${index + 1}`}
                            loading='lazy'
                            style={{
                              height: 160,
                              objectFit: 'cover',
                              borderRadius: 4,
                              width: '100%',
                            }}
                            onClick={() => handleImageClick(index)}
                          />
                          {image.caption && (
                            <ImageListItemBar
                              title={image.caption}
                              sx={{
                                borderBottomLeftRadius: 4,
                                borderBottomRightRadius: 4,
                              }}
                            />
                          )}
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Box>
                </>
              )}

              {/* Empty state when detail is loaded but no extra info */}
              {!detailLoading &&
                (!detailShipment.line_items || detailShipment.line_items.length === 0) &&
                (!detailShipment.images || detailShipment.images.length === 0) && (
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      No items or images available for this shipment.
                    </Typography>
                  </Box>
                )}
            </>
          ) : null}
        </Box>
      </Drawer>

      {/* Image Carousel Dialog */}
      <Dialog
        open={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        maxWidth='lg'
        fullWidth
        slotProps={{
          paper: {
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.9)', boxShadow: 'none' },
          },
        }}
      >
        <DialogContent sx={{ position: 'relative', p: 0, backgroundColor: 'black' }}>
          <IconButton
            onClick={() => setCarouselOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              zIndex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <Close />
          </IconButton>

          {detailShipment?.images && detailShipment.images.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '70vh',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  flex: 1,
                }}
              >
                <img
                  src={detailShipment.images[currentImageIndex]?.url}
                  alt={
                    detailShipment.images[currentImageIndex]?.caption ||
                    `Image ${currentImageIndex + 1}`
                  }
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              </Box>

              {detailShipment.images[currentImageIndex]?.caption && (
                <Box
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: 2,
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant='body1'>
                    {detailShipment.images[currentImageIndex].caption}
                  </Typography>
                </Box>
              )}

              {detailShipment.images.length > 1 && (
                <>
                  <IconButton
                    onClick={handleCarouselPrev}
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                    }}
                  >
                    <ChevronLeft fontSize='large' />
                  </IconButton>
                  <IconButton
                    onClick={handleCarouselNext}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                    }}
                  >
                    <ChevronRight fontSize='large' />
                  </IconButton>

                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant='body2'>
                      {currentImageIndex + 1} / {detailShipment.images.length}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default CustomerShipmentsPage;
