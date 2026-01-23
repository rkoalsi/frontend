'use client';
import { useContext, useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
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
  Tooltip,
} from '@mui/material';
import AuthContext from '../../../src/components/Auth';
import {
  CreditCard,
  Search,
  ArrowBack,
  CheckCircle,
  Schedule,
  FilterList,
  Clear,
  AccountBalanceWallet,
  Download,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../../src/util/axios';
import { format } from 'date-fns';

interface CreditNote {
  _id: string;
  creditnote_id?: string;
  creditnote_number: string;
  status: string;
  date: string;
  total: number;
  balance: number;
  customer_name?: string;
  reference_number?: string;
}

interface CreditNoteSummary {
  total_credit_notes: number;
  total_credits: number;
  total_balance: number;
}

const CustomerCreditNotesPage = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [summary, setSummary] = useState<CreditNoteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCreditNotes = useCallback(async () => {
    if (!user?.data?.customer_id) {
      setLoading(false);
      setError('Customer ID not found. Please contact support.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/customer_portal/credit-notes', {
        params: {
          customer_id: user.data.customer_id,
          page: page + 1,
          per_page: rowsPerPage,
          status: statusFilter || undefined,
        },
      });

      setCreditNotes(data.credit_notes || []);
      setTotalItems(data.total || 0);
      setSummary(data.summary || null);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching credit notes:', err);
      setError('Failed to load credit notes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, page, rowsPerPage, statusFilter]);

  useEffect(() => {
    if (user) {
      fetchCreditNotes();
    }
  }, [user, fetchCreditNotes]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'primary';
      case 'closed':
        return 'success';
      case 'void':
        return 'default';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'closed':
        return <CheckCircle sx={{ fontSize: 16 }} />;
      default:
        return <Schedule sx={{ fontSize: 16 }} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredCreditNotes = creditNotes.filter((cn) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      cn.creditnote_number?.toLowerCase().includes(search) ||
      cn.status?.toLowerCase().includes(search) ||
      cn.reference_number?.toLowerCase().includes(search)
    );
  });

  const handleDownloadPdf = async (creditNoteId: string) => {
    try {
      const response = await axiosInstance.get(`/credit-notes/download_pdf/${creditNoteId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `credit_note_${creditNoteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  // Summary Card Component
  const SummaryCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              backgroundColor: alpha(color, 0.1),
              color: color,
              mr: 1.5,
            }}
          >
            {icon}
          </Box>
          <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {label}
          </Typography>
        </Box>
        <Typography variant='h5' fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

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
                <Typography
                  variant={isMobile ? 'h6' : 'h4'}
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  Credit Notes
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  View all your credit notes
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}>
          {error ? (
            <Alert
              severity='error'
              sx={{ borderRadius: 2, mb: 3 }}
              action={
                <Button color='inherit' size='small' onClick={fetchCreditNotes}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : (
            <>
              {/* Summary Cards */}
              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <SummaryCard
                    icon={<CreditCard sx={{ fontSize: 20 }} />}
                    label='Total Credit Notes'
                    value={summary?.total_credit_notes || 0}
                    color={theme.palette.primary.main}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <SummaryCard
                    icon={<AccountBalanceWallet sx={{ fontSize: 20 }} />}
                    label='Total Credits'
                    value={formatCurrency(summary?.total_credits || 0)}
                    color={theme.palette.success.main}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <SummaryCard
                    icon={<CheckCircle sx={{ fontSize: 20 }} />}
                    label='Available Balance'
                    value={formatCurrency(summary?.total_balance || 0)}
                    color={theme.palette.info.main}
                  />
                </Grid>
              </Grid>

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
                      placeholder='Search by credit note number...'
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
                        <MenuItem value='open'>Open</MenuItem>
                        <MenuItem value='closed'>Closed</MenuItem>
                        <MenuItem value='void'>Void</MenuItem>
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

              {/* Credit Notes Table */}
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
                            <TableCell sx={{ fontWeight: 600 }}>Credit Note #</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align='right'>Total Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align='right'>Balance</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align='center'>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredCreditNotes.length > 0 ? (
                            filteredCreditNotes.map((cn) => (
                              <TableRow
                                key={cn._id}
                                hover
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                              >
                                <TableCell>
                                  <Typography fontWeight={500}>{cn.creditnote_number}</Typography>
                                </TableCell>
                                <TableCell>
                                  {cn.date ? format(new Date(cn.date), 'PP') : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {cn.reference_number || '-'}
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography fontWeight={500} color='success.main'>
                                    {formatCurrency(cn.total)}
                                  </Typography>
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography fontWeight={500}>
                                    {formatCurrency(cn.balance)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    icon={getStatusIcon(cn.status)}
                                    label={cn.status}
                                    color={getStatusColor(cn.status) as any}
                                    size='small'
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                </TableCell>
                                <TableCell align='center'>
                                  <Tooltip title='Download PDF'>
                                    <IconButton
                                      size='small'
                                      onClick={() => handleDownloadPdf(cn._id)}
                                      color='primary'
                                    >
                                      <Download />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                                <CreditCard sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                                <Typography color='text.secondary'>No credit notes found</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Mobile Cards */}
                    <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
                      {filteredCreditNotes.length > 0 ? (
                        filteredCreditNotes.map((cn) => (
                          <Card
                            key={cn._id}
                            elevation={0}
                            sx={{
                              mb: 2,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 2,
                            }}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                  <Typography fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                                    {cn.creditnote_number}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    {cn.date ? format(new Date(cn.date), 'PP') : 'N/A'}
                                  </Typography>
                                </Box>
                                <Chip
                                  icon={getStatusIcon(cn.status)}
                                  label={cn.status}
                                  color={getStatusColor(cn.status) as any}
                                  size='small'
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </Box>

                              <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant='caption' color='text.secondary'>
                                    Total Amount
                                  </Typography>
                                  <Typography fontWeight={600} color='success.main'>
                                    {formatCurrency(cn.total)}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant='caption' color='text.secondary'>
                                    Available Balance
                                  </Typography>
                                  <Typography fontWeight={600}>
                                    {formatCurrency(cn.balance)}
                                  </Typography>
                                </Grid>
                              </Grid>

                              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                  size='small'
                                  startIcon={<Download />}
                                  onClick={() => handleDownloadPdf(cn._id)}
                                  sx={{ textTransform: 'none' }}
                                >
                                  Download PDF
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <CreditCard sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                          <Typography color='text.secondary'>No credit notes found</Typography>
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
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        },
                      }}
                    />
                  </>
                )}
              </Paper>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerCreditNotesPage;
