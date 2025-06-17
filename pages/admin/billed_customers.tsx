import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  useTheme,
  alpha,
  TablePagination,
  InputAdornment,
  Divider,
  Switch,
  FormControlLabel,
  FormGroup,
  Grid,
} from '@mui/material';
import {
  PaidRounded,
  FileDownloadOutlined,
  RefreshOutlined,
  CalendarTodayOutlined,
  SearchOutlined,
  VisibilityOutlined,
  TrendingUpOutlined,
  ShoppingCartOutlined,
  PersonOutlined,
  ViewListOutlined,
  ViewModuleOutlined,
  ReceiptOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subMonths } from 'date-fns';
import axiosInstance from '../../src/util/axios';

type ViewType = 'detailed' | 'summary';

interface DetailedCustomer {
  contact_name: string;
  pincode: string;
  item_name: string;
  total_quantity: number;
  date_wise_quantities: Record<string, number>;
}

interface SummaryCustomer {
  contact_name: string;
  pincode: string;
  total_quantity: number;
  total_amount: number;
  invoice_count: number;
}

const BilledCustomersComponent = () => {
  const theme = useTheme();
  const [startDate, setStartDate]: any = useState(subMonths(new Date(), 6));
  const [endDate, setEndDate]: any = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewType, setViewType] = useState<ViewType>('summary');

  // Data states
  const [billedData, setBilledData]: any = useState(null);
  const [billedCustomers, setBilledCustomers] = useState<
    (DetailedCustomer | SummaryCustomer)[]
  >([]);
  const [filteredCustomers, setFilteredCustomers] = useState<
    (DetailedCustomer | SummaryCustomer)[]
  >([]);
  const [detailsDialog, setDetailsDialog]: any = useState({
    open: false,
    data: null,
  });

  // API Base URL
  const API_BASE_URL = process.env.api_url;

  const fetchBilledCustomers = async () => {
    // Add validation for dates
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    // Validate date order
    if (startDate > endDate) {
      alert('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Format dates properly and add validation
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      console.log('Sending request:', {
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        view_type: viewType,
      });

      const response = await axiosInstance.post(
        `${API_BASE_URL}/admin/sales_by_customer/billed_customers`,
        {
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          view_type: viewType,
          exclude_patterns: [
            '(NA)',
            '(amzb2b)',
            '(PUPEV)',
            '(EC)',
            '(MKT)',
            '(SPUR)',
            '(SSAM)',
          ],
        }
      );

      // Fix: Check response.status correctly for axios
      if (response.status !== 200) {
        throw new Error('Failed to fetch billed customers');
      }

      const data = response.data;
      setBilledData(data);
      console.log('Received data:', data);
      setBilledCustomers(data.report || []);
      setFilteredCustomers(data.report || []);
      setPage(0);
    } catch (err: any) {
      console.error('Full error object:', err);
      setError(
        err.response?.data?.detail || err.message || 'Failed to fetch data'
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadXLSX = async () => {
    try {
      setDownloadLoading(true);

      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const params = new URLSearchParams();
      params.append('start_date', formattedStartDate);
      params.append('end_date', formattedEndDate);
      params.append('view_type', viewType);

      // Add each exclude pattern separately (no brackets)
      const excludePatterns = [
        '(NA)',
        '(amzb2b)',
        '(PUPEV)',
        '(EC)',
        '(MKT)',
        '(SPUR)',
        '(SSAM)',
      ];

      excludePatterns.forEach((pattern) => {
        params.append('exclude_patterns', pattern);
      });

      const response = await axiosInstance.get(
        `${API_BASE_URL}/admin/sales_by_customer/billed_customers?${params.toString()}`
      );
      if (!response.status) {
        throw new Error('Failed to download billed customers report');
      }

      const data = response.data;

      // Create and download file
      const byteCharacters = atob(data.xlsx_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
      console.error('Error downloading billed customers:', err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleSearch = (event: any) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = billedCustomers.filter((customer: any) => {
      const matchesName = customer.contact_name?.toLowerCase().includes(term);
      const matchesPincode = customer.pincode?.toString().includes(term);

      if (viewType === 'detailed') {
        const matchesItem = customer.item_name?.toLowerCase().includes(term);
        return matchesName || matchesItem || matchesPincode;
      } else {
        return matchesName || matchesPincode;
      }
    });

    setFilteredCustomers(filtered);
    setPage(0);
  };

  const handleRefresh = () => {
    fetchBilledCustomers();
  };

  const handleViewTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setViewType(event.target.checked ? 'summary' : 'detailed');
    setSearchTerm('');
    setPage(0);
  };

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchBilledCustomers();
  }, [startDate, endDate, viewType]);

  const StatsCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card
      sx={{
        background: `white`,
        border: `1px solid ${alpha(color, 0.2)}`,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        },
        transition: 'all 0.3s ease-in-out',
        height: '100%',
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant='h3' fontWeight='bold' color={color}>
              {value?.toLocaleString() || '0'}
            </Typography>
            <Typography variant='h6' color='text.primary' gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant='body2' color='text.secondary'>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: '50%',
              bgcolor: alpha(color, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, {
              sx: { fontSize: 40, color },
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const DetailsDialog = () => (
    <Dialog
      open={detailsDialog.open}
      onClose={() => setDetailsDialog({ open: false, data: null })}
      maxWidth='md'
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PaidRounded sx={{ mr: 1, color: 'success.main' }} />
          {viewType === 'detailed'
            ? 'Billed Customer Details'
            : 'Customer Summary Details'}
        </Box>
      </DialogTitle>
      <DialogContent>
        {detailsDialog.data && (
          <Box>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Customer Name
                  </Typography>
                  <Typography variant='body1' fontWeight='bold'>
                    {detailsDialog.data.contact_name}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Pincode
                  </Typography>
                  <Chip
                    label={detailsDialog.data.pincode || 'N/A'}
                    size='small'
                    color='primary'
                  />
                </Box>
              </Box>

              {viewType === 'detailed' && (
                <>
                  <Box>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Item Name
                    </Typography>
                    <Typography variant='body1' fontWeight='bold'>
                      {detailsDialog.data.item_name}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Total Quantity
                    </Typography>
                    <Typography
                      variant='h6'
                      color='success.main'
                      fontWeight='bold'
                    >
                      {detailsDialog.data.total_quantity}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant='h6' gutterBottom>
                      Date-wise Quantities
                    </Typography>
                    <Box
                      sx={{
                        maxHeight: 300,
                        overflow: 'auto',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                      }}
                    >
                      <Stack spacing={1}>
                        {Object.entries(
                          detailsDialog.data.date_wise_quantities || {}
                        )
                          .filter(([date, qty]: any) => qty > 0)
                          .map(([date, qty]) => (
                            <Box
                              key={date}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Typography variant='body2'>
                                {format(new Date(date), 'yyyy-MM-dd')}
                              </Typography>
                              <Chip
                                label={String(qty) || '0'}
                                size='small'
                                color='primary'
                              />
                            </Box>
                          ))}
                      </Stack>
                    </Box>
                  </Box>
                </>
              )}

              {viewType === 'summary' && (
                <>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Total Quantity
                      </Typography>
                      <Typography
                        variant='h6'
                        color='success.main'
                        fontWeight='bold'
                      >
                        {detailsDialog.data.total_quantity}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Total Amount
                      </Typography>
                      <Typography
                        variant='h6'
                        color='primary.main'
                        fontWeight='bold'
                      >
                        ₹
                        {detailsDialog.data.total_amount?.toLocaleString() ||
                          '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Invoice Count
                      </Typography>
                      <Typography
                        variant='h6'
                        color='warning.main'
                        fontWeight='bold'
                      >
                        {detailsDialog.data.invoice_count}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailsDialog({ open: false, data: null })}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Calculate totals for display
  const totalQuantity = filteredCustomers.reduce(
    (sum, customer: any) => sum + (customer.total_quantity || 0),
    0
  );

  const totalAmount =
    viewType === 'summary'
      ? filteredCustomers.reduce(
          (sum, customer: any) => sum + (customer.total_amount || 0),
          0
        )
      : 0;

  const uniqueItems =
    viewType === 'detailed'
      ? new Set(filteredCustomers.map((c: any) => c.item_name)).size
      : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant='h4'
              fontWeight='bold'
              sx={{ display: 'flex', alignItems: 'center', color: 'white' }}
            >
              <PaidRounded
                sx={{ mr: 2, color: 'success.main', fontSize: 40 }}
              />
              Billed Customers -{' '}
              {viewType === 'detailed' ? 'Detailed View' : 'Summary View'}
            </Typography>
            <Typography variant='body1' color='white'>
              {viewType === 'detailed'
                ? 'Customer-item combinations with date-wise breakdown'
                : 'Customers grouped with total quantities and amounts'}
            </Typography>
          </Box>
          <Button
            variant='outlined'
            startIcon={<RefreshOutlined />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* View Type Toggle */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ViewListOutlined color='primary' />
              <Typography variant='h6' fontWeight='bold'>
                View Type
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={viewType === 'summary'}
                      onChange={handleViewTypeChange}
                      color='primary'
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {viewType === 'detailed' ? (
                        <>
                          <ViewListOutlined fontSize='small' />
                          <span>Detailed View</span>
                        </>
                      ) : (
                        <>
                          <ViewModuleOutlined fontSize='small' />
                          <span>Summary View</span>
                        </>
                      )}
                    </Box>
                  }
                />
              </FormGroup>
              <Typography variant='body2' color='text.secondary' sx={{ ml: 2 }}>
                {viewType === 'detailed'
                  ? 'Shows individual products with date-wise breakdown'
                  : 'Shows customer totals without product details'}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Date Range Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 3,
              }}
            >
              <CalendarTodayOutlined color='primary' />

              <Box sx={{ minWidth: 200 }}>
                <DatePicker
                  enableAccessibleFieldDOMStructure={false}
                  label='Start Date'
                  format='dd-MM-yyyy'
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  slots={{
                    textField: TextField,
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Box>

              <Box sx={{ minWidth: 200 }}>
                <DatePicker
                  enableAccessibleFieldDOMStructure={false}
                  label='End Date'
                  format='dd-MM-yyyy'
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  slots={{
                    textField: TextField,
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography
                  variant='h6'
                  color='text.secondary'
                  fontWeight={'bold'}
                >
                  Selected Range: {format(startDate, 'yyyy-MM-dd')} -{' '}
                  {format(endDate, 'yyyy-MM-dd')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        {billedData && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Box>
              <StatsCard
                title='Total Customers'
                value={billedData.summary?.total_customers}
                icon={<PersonOutlined />}
                color={theme.palette.success.main}
                subtitle='Unique customers'
              />
            </Box>
            <Box>
              <StatsCard
                title='Total Records'
                value={billedData.summary?.total_records}
                icon={<ShoppingCartOutlined />}
                color={theme.palette.primary.main}
                subtitle={
                  viewType === 'detailed'
                    ? 'Customer-item combinations'
                    : 'Customer records'
                }
              />
            </Box>
            {viewType === 'detailed' && (
              <Box>
                <StatsCard
                  title='Unique Items'
                  value={billedData.summary?.total_unique_items}
                  icon={<TrendingUpOutlined />}
                  color={theme.palette.info.main}
                  subtitle='Different products sold'
                />
              </Box>
            )}
            <Box>
              <StatsCard
                title='Total Quantity'
                value={totalQuantity}
                icon={<PaidRounded />}
                color={theme.palette.warning.main}
                subtitle='Items sold'
              />
            </Box>
            {viewType === 'summary' && (
              <Box>
                <StatsCard
                  title='Total Amount'
                  value={`₹${totalAmount.toLocaleString()}`}
                  icon={<ReceiptOutlined />}
                  color={theme.palette.secondary.main}
                  subtitle='Total billed amount'
                />
              </Box>
            )}
          </Grid>
        )}

        {/* Search and Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <TextField
                placeholder={
                  viewType === 'detailed'
                    ? 'Search customers, items, or pincode...'
                    : 'Search customers or pincode...'
                }
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchOutlined />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 300, flex: 1, maxWidth: 500 }}
                size='small'
              />

              <Button
                variant='contained'
                startIcon={<FileDownloadOutlined />}
                onClick={downloadXLSX}
                disabled={downloadLoading}
                color='success'
              >
                {downloadLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  `Download ${
                    viewType === 'detailed' ? 'Detailed' : 'Summary'
                  } XLSX`
                )}
              </Button>
            </Box>

            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Showing {filteredCustomers.length} of {billedCustomers.length}{' '}
              records
            </Typography>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <Card
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
            }}
          >
            <CircularProgress />
          </Card>
        ) : (
          <Card>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Customer Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Pincode</strong>
                    </TableCell>
                    {viewType === 'detailed' && (
                      <TableCell>
                        <strong>Item Name</strong>
                      </TableCell>
                    )}
                    <TableCell align='right'>
                      <strong>Total Quantity</strong>
                    </TableCell>
                    {viewType === 'summary' && (
                      <>
                        <TableCell align='right'>
                          <strong>Total Amount</strong>
                        </TableCell>
                        <TableCell align='right'>
                          <strong>Invoice Count</strong>
                        </TableCell>
                      </>
                    )}
                    <TableCell align='center'>
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((customer: any, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight='medium'>
                            {customer.contact_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.pincode || 'N/A'}
                            size='small'
                            variant='outlined'
                            color='primary'
                          />
                        </TableCell>
                        {viewType === 'detailed' && (
                          <TableCell>
                            <Typography variant='body2'>
                              {customer.item_name}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell align='right'>
                          <Typography
                            variant='body2'
                            fontWeight='bold'
                            color='success.main'
                          >
                            {customer.total_quantity}
                          </Typography>
                        </TableCell>
                        {viewType === 'summary' && (
                          <>
                            <TableCell align='right'>
                              <Typography
                                variant='body2'
                                fontWeight='bold'
                                color='primary.main'
                              >
                                ₹
                                {customer.total_amount?.toLocaleString() || '0'}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography
                                variant='body2'
                                fontWeight='bold'
                                color='warning.main'
                              >
                                {customer.invoice_count}
                              </Typography>
                            </TableCell>
                          </>
                        )}
                        <TableCell align='center'>
                          <Tooltip title='View Details'>
                            <IconButton
                              size='small'
                              onClick={() =>
                                setDetailsDialog({
                                  open: true,
                                  data: customer,
                                })
                              }
                              color='primary'
                            >
                              <VisibilityOutlined />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component='div'
              count={filteredCustomers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Card>
        )}

        {/* Details Dialog */}
        <DetailsDialog />
      </Box>
    </LocalizationProvider>
  );
};

export default BilledCustomersComponent;
