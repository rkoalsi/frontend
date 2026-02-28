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
  Paper,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  PendingActionsOutlined,
  FileDownloadOutlined,
  RefreshOutlined,
  CalendarTodayOutlined,
  SearchOutlined,
  VisibilityOutlined,
  PersonOffOutlined,
  WarningAmberOutlined,
  EmailOutlined,
  PhoneOutlined,
  LocationOnOutlined,
  AccountCircleOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subMonths } from 'date-fns';
import axiosInstance from '../../src/util/axios';

const UnbilledCustomersComponent = () => {
  const theme = useTheme();
  const [startDate, setStartDate]: any = useState(subMonths(new Date(), 6));
  const [endDate, setEndDate]: any = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');

  // Data states
  const [unbilledData, setUnbilledData]: any = useState(null);
  const [unbilledCustomers, setUnbilledCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [detailsDialog, setDetailsDialog]: any = useState({
    open: false,
    data: null,
  });

  const fetchUnbilledCustomers = async () => {
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

      console.log('Sending dates:', {
        start_date: formattedStartDate,
        end_date: formattedEndDate,
      });

      const response = await axiosInstance.post(
        `/admin/sales_by_customer/unbilled_customers`,
        {
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        }
      );

      // Check response status
      if (response.status !== 200) {
        throw new Error('Failed to fetch unbilled customers');
      }

      const data = response.data;
      setUnbilledData(data);
      console.log('Received data:', data);
      setUnbilledCustomers(data.report || []);
      setFilteredCustomers(data.report || []);
      setPage(0); // Reset pagination
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

      const response = await axiosInstance.get(
        `/admin/sales_by_customer/unbilled_customers?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
      );

      if (!response.status) {
        throw new Error('Failed to download unbilled customers report');
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
      console.error('Error downloading unbilled customers:', err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleSearch = (event: any) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, statusFilter);
  };

  const handleStatusFilter = (event: any) => {
    const status = event.target.value;
    setStatusFilter(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (searchTerm: string, statusFilter: string) => {
    let filtered = unbilledCustomers.filter((customer: any) => {
      const matchesSearch =
        customer.contact_name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.toString().includes(searchTerm) ||
        customer.sales_person?.toLowerCase().includes(searchTerm) ||
        customer.pincode?.toString().includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'never_billed' &&
          customer.billing_status === 'Never Billed') ||
        (statusFilter === 'previously_billed' &&
          customer.billing_status === 'Previously Billed');

      return matchesSearch && matchesStatus;
    });

    setFilteredCustomers(filtered);
    setPage(0);
  };

  const handleRefresh = () => {
    fetchUnbilledCustomers();
  };

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchUnbilledCustomers();
  }, [startDate, endDate]);

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
          <PendingActionsOutlined sx={{ mr: 1, color: 'warning.main' }} />
          Unbilled Customer Details
        </Box>
      </DialogTitle>
      <DialogContent>
        {detailsDialog.data && (
          <Box>
            <Stack spacing={3}>
              {/* Basic Info */}
              <Box>
                <Typography
                  variant='h6'
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <AccountCircleOutlined sx={{ mr: 1 }} />
                  Customer Information
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Customer ID
                    </Typography>
                    <Typography variant='body1' fontWeight='bold'>
                      {detailsDialog.data.contact_id}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Customer Name
                    </Typography>
                    <Typography variant='body1' fontWeight='bold'>
                      {detailsDialog.data.contact_name}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Status
                    </Typography>
                    <Chip
                      label={detailsDialog.data.status}
                      size='small'
                      color={
                        detailsDialog.data.status === 'active'
                          ? 'success'
                          : 'default'
                      }
                    />
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Contact Info */}
              <Box>
                <Typography
                  variant='h6'
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <EmailOutlined sx={{ mr: 1 }} />
                  Contact Information
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Email
                    </Typography>
                    <Typography variant='body1'>
                      {detailsDialog.data.email || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Phone
                    </Typography>
                    <Typography variant='body1'>
                      {detailsDialog.data.phone || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Pincode
                    </Typography>
                    <Typography variant='body1'>
                      {detailsDialog.data.pincode || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Sales Info */}
              <Box>
                <Typography variant='h6' gutterBottom>
                  Sales Information
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Sales Person
                    </Typography>
                    <Chip
                      label={detailsDialog.data.sales_person || 'Unassigned'}
                      size='small'
                      color={
                        detailsDialog.data.sales_person ? 'primary' : 'default'
                      }
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Billing Status
                    </Typography>
                    <Chip
                      label={detailsDialog.data.billing_status}
                      size='small'
                      color={
                        detailsDialog.data.billing_status === 'Never Billed'
                          ? 'error'
                          : 'warning'
                      }
                    />
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Billing History */}
              <Box>
                <Typography variant='h6' gutterBottom>
                  Billing History
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Last Invoice Date
                    </Typography>
                    <Typography variant='body1' fontWeight='bold'>
                      {detailsDialog.data.last_invoice_date
                        ? format(
                            new Date(detailsDialog.data.last_invoice_date),
                            'dd-MM-yyyy'
                          )
                        : 'Never billed'}
                    </Typography>
                  </Box>
                  {detailsDialog.data.last_invoice_amount && (
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Last Invoice Amount
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight='bold'
                        color='success.main'
                      >
                        ₹
                        {detailsDialog.data.last_invoice_amount?.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  {detailsDialog.data.days_since_last_invoice && (
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Days Since Last Invoice
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight='bold'
                        color='warning.main'
                      >
                        {detailsDialog.data.days_since_last_invoice} days
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 0 },
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant='h4'
              fontWeight='bold'
              sx={{ display: 'flex', alignItems: 'center', color: 'white', fontSize: { xs: '1.5rem', sm: '2rem' } }}
            >
              <PendingActionsOutlined
                sx={{ mr: 2, color: 'warning.main', fontSize: 40 }}
              />
              Unbilled Customers
            </Typography>
            <Typography variant='body1' color='white'>
              Active customers who haven't been billed in the selected period
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
                  label='Start Date'
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  format='dd-MM-yyyy'
                  enableAccessibleFieldDOMStructure={false}
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
                  label='End Date'
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  format='dd-MM-yyyy'
                  enableAccessibleFieldDOMStructure={false}
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
                  Selected Range:{' '}
                  {startDate ? format(startDate, 'dd-MM-yyyy') : 'Not selected'}{' '}
                  - {endDate ? format(endDate, 'dd-MM-yyyy') : 'Not selected'}
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
        {unbilledData && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <StatsCard
                title='Total Unbilled'
                value={unbilledData.summary?.total_unbilled_customers}
                icon={<PendingActionsOutlined />}
                color={theme.palette.warning.main}
                subtitle='Need attention'
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <StatsCard
                title='Never Billed'
                value={unbilledData.summary?.customers_never_billed}
                icon={<PersonOffOutlined />}
                color={theme.palette.error.main}
                subtitle='New customers'
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <StatsCard
                title='Previously Billed'
                value={unbilledData.summary?.customers_with_past_billing}
                icon={<WarningAmberOutlined />}
                color={theme.palette.info.main}
                subtitle='Inactive customers'
              />
            </Box>
          </Box>
        )}

        {/* Search and Filters */}
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
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flex: 1,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <TextField
                  placeholder='Search customers, email, phone, sales person...'
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchOutlined />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 300, flex: 1, maxWidth: 400 }}
                  size='small'
                />

                <FormControl size='small' sx={{ minWidth: 150 }}>
                  <InputLabel>Billing Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label='Billing Status'
                    onChange={handleStatusFilter}
                  >
                    <MenuItem value='all'>All Status</MenuItem>
                    <MenuItem value='never_billed'>Never Billed</MenuItem>
                    <MenuItem value='previously_billed'>
                      Previously Billed
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Button
                variant='contained'
                startIcon={<FileDownloadOutlined />}
                onClick={downloadXLSX}
                disabled={downloadLoading}
                color='warning'
              >
                {downloadLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  'Download XLSX'
                )}
              </Button>
            </Box>

            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Showing {filteredCustomers.length} of {unbilledCustomers.length}{' '}
              customers
            </Typography>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
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
                      <strong>Contact Info</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Sales Person</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Billing Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Last Billed</strong>
                    </TableCell>
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
                          <Box>
                            <Typography variant='body2' fontWeight='medium'>
                              {customer.contact_name}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              ID: {customer.contact_id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography
                              variant='caption'
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 0.5,
                              }}
                            >
                              <EmailOutlined sx={{ fontSize: 12, mr: 0.5 }} />
                              {customer.email || 'N/A'}
                            </Typography>
                            <Typography
                              variant='caption'
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 0.5,
                              }}
                            >
                              <PhoneOutlined sx={{ fontSize: 12, mr: 0.5 }} />
                              {customer.phone || 'N/A'}
                            </Typography>
                            {customer.pincode && (
                              <Typography
                                variant='caption'
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <LocationOnOutlined
                                  sx={{ fontSize: 12, mr: 0.5 }}
                                />
                                {customer.pincode}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.sales_person || 'Unassigned'}
                            size='small'
                            color={
                              customer.sales_person ? 'primary' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.billing_status}
                            size='small'
                            color={
                              customer.billing_status === 'Never Billed'
                                ? 'error'
                                : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant='body2'>
                              {customer.last_invoice_date
                                ? format(
                                    new Date(customer.last_invoice_date),
                                    'dd-MM-yyyy'
                                  )
                                : 'Never'}
                            </Typography>
                            {customer.days_since_last_invoice && (
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {customer.days_since_last_invoice} days ago
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
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

export default UnbilledCustomersComponent;
