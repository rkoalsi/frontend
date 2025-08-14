import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  useMediaQuery,
  styled,
  Card,
  CardContent,
  Stack,
  InputAdornment,
  Collapse,
  IconButton,
  Drawer,
  Button,
  Badge,
  Divider,
  Tooltip,
  Zoom,
  Fab,
  useScrollTrigger,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AuthContext from '../../src/components/Auth';
import { toast } from 'react-toastify';
import CustomButton from '../../src/components/common/Button';
import Header from '../../src/components/common/Header';
import capitalize from '../../src/util/capitalize';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

type PaymentInfo = {
  _id: string;
  invoice_number: string;
  invoice_id: string; // Added invoice_id for API calls
  status: string;
  total: number;
  balance: number;
};

type CustomerAnalyticsType = {
  customerName: string;
  billingAddress: string;
  status: string;
  tier: string;
  totalSalesCurrentMonth: number;
  lastBillDate: string;
  averageOrderFrequencyMonthly: number;
  billingTillDateCurrentYear: number;
  totalSalesLastFY: number;
  totalSalesPreviousFY: number;
  salesPerson: string;
  hasBilledLastMonth: boolean;
  hasBilledLast45Days: boolean;
  hasBilledLast2Months: boolean;
  hasBilledLast3Months: boolean;
  duePayments: PaymentInfo[];
  notDuePayments: PaymentInfo[];
};

const StyledContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: theme.spacing(1),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3),
  },
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(4),
  },
}));

const CustomerCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  marginBottom: theme.spacing(1.5),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(2),
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    },
  },
}));

const MetricCard = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1),
  textAlign: 'center',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  flex: 1,
  minWidth: '80px',
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(1.5),
    minWidth: '100px',
    borderRadius: theme.spacing(1.5),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(2),
    minWidth: '120px',
  },
}));

const PaymentCard = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5),
  border: '1px solid rgba(0, 0, 0, 0.08)',
  marginTop: theme.spacing(1),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(1.5),
  },
}));

const InvoiceChip = styled(Chip)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
}));

const PaymentBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
    fontSize: '0.65rem',
    fontWeight: 700,
  },
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(3),
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(0, 1),
  [theme.breakpoints.up('sm')]: {
    padding: 0,
  },
}));

const MobileFiltersButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontWeight: 600,
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const DesktopFiltersRow = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.up('md')]: {
    display: 'flex',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    flexWrap: 'wrap',
    justifyContent: 'center',
    '&::-webkit-scrollbar': {
      height: '4px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '2px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.3)',
      borderRadius: '2px',
    },
  },
}));

const TabletFiltersRow = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.between('sm', 'md')]: {
    display: 'flex',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
}));

const StatsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: theme.spacing(2),
  padding: theme.spacing(0, 1),
  [theme.breakpoints.up('sm')]: {
    gap: theme.spacing(1),
    marginTop: theme.spacing(3),
    padding: 0,
  },
}));

const MetricsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
  flexWrap: 'wrap',
  marginBottom: theme.spacing(1.5),
  [theme.breakpoints.up('sm')]: {
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  [theme.breakpoints.up('md')]: {
    gap: theme.spacing(1.5),
  },
}));

const CollapsibleContent = styled(Collapse)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: {
    '& .MuiCollapse-wrapper': {
      display: 'block !important',
    },
    '& .MuiCollapse-wrapperInner': {
      display: 'block !important',
    },
  },
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
};

const CustomerAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerAnalyticsType[]>([]);
  const [filterType, setFilterType] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [overdueFilter, setOverdueFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  // Page navigation refs
  const pageTopRef = useRef<HTMLDivElement>(null);
  const pageBottomRef = useRef<HTMLDivElement>(null);
  const { user }: any = useContext(AuthContext);
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  // Toggle card expansion on mobile (only for expand icon)
  const toggleCardExpansion = (customerName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    if (isMobile) {
      setExpandedCards(prev => ({
        ...prev,
        [customerName]: !prev[customerName]
      }));
    }
  };

  // Handle invoice click - API call function
  const handleInvoiceClick = async (invoiceId: string, invoiceNumber: string, event: React.MouseEvent) => {
    try {
      const resp = await axios.get(
        `${process.env.api_url}/invoices/download_pdf/${invoiceId}`,
        {
          responseType: 'blob', // Receive the response as binary data
        }
      );
      // Check if the blob is an actual PDF or an error message
      if (resp.data.type !== 'application/pdf') {
        // Convert to text to read the error response
        toast.error('Invoice Not Created');
        return;
      }

      // Extract filename from headers or set default
      const contentDisposition = resp.headers['content-disposition'];
      let fileName = `${invoiceNumber}.pdf`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // Create and trigger download
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF');
    }
  };

  // Fetch customer analytics from the backend
  const getData = async () => {
    try {
      setLoading(true);
      const queryParams: any = {};

      if (statusFilter) {
        queryParams.status = statusFilter;
      }

      if (tierFilter) {
        queryParams.tier = tierFilter;
      }

      if (overdueFilter) {
        queryParams.due_status = overdueFilter;
      }

      queryParams.sp_code = user?.data?.code;

      const queryString = new URLSearchParams(queryParams).toString();
      const url = queryString
        ? `${process.env.api_url}/customer_analytics?${queryString}`
        : `${process.env.api_url}/customer_analytics`;

      const resp = await axios.get(url);
      setCustomers(resp.data || []);
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      toast.error('Error fetching customer analytics');
    } finally {
      setLoading(false);
    }
  };


  // Filter customers based on selected dropdown value and search term
  const filteredCustomers = customers.filter((customer) => {
    // First apply activity filter
    let activityMatch = true;
    switch (filterType) {
      case 'active':
        activityMatch = customer.hasBilledLast3Months;
        break;
      case 'inactive':
        activityMatch = !customer.hasBilledLast3Months;
        break;
      case 'recent':
        activityMatch = customer.hasBilledLastMonth;
        break;
      default:
        activityMatch = true;
    }

    // Apply payment status filter (in addition to backend filtering)
    let paymentMatch = true;
    if (overdueFilter === 'due') {
      // Only show customers who have due payments
      paymentMatch = customer.duePayments && customer.duePayments.length > 0;
    } else if (overdueFilter === 'not_due') {
      // Only show customers who have NO due payments (all payments are done)
      paymentMatch = !customer.duePayments || customer.duePayments.length === 0;
    }

    // Then apply search filter (case-insensitive search in name and address)
    const searchMatch = searchTerm === '' ||
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.billingAddress.toLowerCase().includes(searchTerm.toLowerCase());

    return activityMatch && paymentMatch && searchMatch;
  });

  // Get status color for chips
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'unknown':
        return 'default';
      default:
        return 'primary';
    }
  };

  // Get tier color for chips
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'a':
        return 'warning';
      case 'b':
        return 'info';
      case 'c':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'paid') return 'success';
    if (lowerStatus === 'overdue') return 'error';
    if (lowerStatus === 'partially_paid') return 'warning';
    if (lowerStatus === 'sent') return 'info';
    return 'default';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const scrollToTop = useCallback(() => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    pageBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Render filter control
  const renderFilterControl = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { value: string; label: string }[],
    minWidth: number = 140
  ) => (
    <FormControl
      variant='outlined'
      size="small"
      sx={{
        minWidth: minWidth,
        flexShrink: 0,
        '& .MuiInputLabel-root': {
          color: isMobile ? 'black' : 'white',
          fontSize: isMobile ? '0.8rem' : '0.85rem'
        },
        '& .MuiSelect-root': {
          color: isMobile ? 'black' : 'white',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(255, 255, 255, 0.6)'
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(255, 255, 255, 0.8)',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: isMobile ? 'black' : 'white',
        },
      }}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  // Improved invoice rendering function
  const renderInvoiceList = (payments: PaymentInfo[], title: string, icon: React.ReactNode, color: 'error' | 'success') => {
    if (!payments || payments.length === 0) return null;

    return (
      <PaymentCard>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icon}
          <Typography
            variant='caption'
            sx={{
              fontWeight: 600,
              color: `${color}.main`,
              textTransform: 'uppercase',
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}
          >
            {title} ({payments.length})
          </Typography>
        </Box>

        <Grid container spacing={1}>
          {payments.map((payment, idx) => (
            <Grid key={idx}>
              <InvoiceChip
                icon={<VisibilityIcon sx={{ fontSize: '0.8rem' }} />}
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                     Invoice Number: {payment.invoice_number}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                     Total Amount: {formatCurrency(payment.total)}
                    </Typography>
                    {color == 'error' && <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                     Balance Amount: {formatCurrency(payment.balance)}
                    </Typography>}
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                    Status: {capitalize(payment.status)}
                    </Typography>
                  </Box>
                }
                size="small"
                color={getPaymentStatusColor(payment.status)}
                variant="outlined"
                onClick={(event) => handleInvoiceClick(payment._id, payment.invoice_number, event)}
                sx={{
                  width: '100%',
                  height: 'auto',
                  minHeight: 40,
                  justifyContent: 'flex-start',
                  '& .MuiChip-label': {
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    paddingLeft: 1,
                    paddingRight: 1,
                  },
                  '& .MuiChip-icon': {
                    marginLeft: 1,
                    marginRight: 0.5,
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </PaymentCard>
    );
  };

  // Mobile filters drawer
  const renderMobileFilters = () => (
    <Drawer
      anchor="bottom"
      open={mobileFiltersOpen}
      onClose={() => setMobileFiltersOpen(false)}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '80vh',
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>Filters</Typography>
          <IconButton onClick={() => setMobileFiltersOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={3}>
          {renderFilterControl(
            'Activity',
            filterType,
            setFilterType,
            [
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Billed in Last 3 Months' },
              { value: 'inactive', label: 'Not Billed in Last 3 Months' },
              { value: 'recent', label: 'Billed in Last 45 Days' },
            ]
          )}

          {renderFilterControl(
            'Status',
            statusFilter,
            setStatusFilter,
            [
              { value: '', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]
          )}

          {renderFilterControl(
            'Tier',
            tierFilter,
            setTierFilter,
            [
              { value: '', label: 'All' },
              { value: 'A', label: 'A' },
              { value: 'B', label: 'B' },
              { value: 'C', label: 'C' },
            ]
          )}

          {renderFilterControl(
            'Payment Status',
            overdueFilter,
            setOverdueFilter,
            [
              { value: 'all', label: 'All' },
              { value: 'due', label: 'Has Due Payments' },
              { value: 'not_due', label: 'All Payments Done' },
            ]
          )}
        </Stack>
      </Box>
    </Drawer>
  );

  useEffect(() => {
    getData();
  }, [filterType, statusFilter, tierFilter, overdueFilter]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        paddingBottom: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <div ref={pageTopRef} />
      <StyledContainer>
        {/* Header */}
        <Header title='Customer Analytics' showBackButton />

        {/* Filter Controls */}
        <FilterContainer>
          {/* Search Bar */}
          <SearchContainer>
            <TextField
              placeholder="Search by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                width: '100%',
                maxWidth: { xs: '100%', sm: '400px', md: '500px' },
                '& .MuiInputLabel-root': { color: 'black' },
                '& .MuiInputBase-input': {
                  color: 'black',
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 1,
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.6)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'black',
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </SearchContainer>

          {/* Mobile Filters Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <MobileFiltersButton
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setMobileFiltersOpen(true)}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.6)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Filters
            </MobileFiltersButton>
          </Box>

          {/* Tablet Filters */}
          <TabletFiltersRow>
            {renderFilterControl(
              'Activity',
              filterType,
              setFilterType,
              [
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Billed Last 3M' },
                { value: 'inactive', label: 'Not Billed Last 3M' },
                { value: 'recent', label: 'Billed Last 45D' },
              ],
              130
            )}
            {renderFilterControl(
              'Status',
              statusFilter,
              setStatusFilter,
              [
                { value: '', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
              100
            )}
            {renderFilterControl(
              'Tier',
              tierFilter,
              setTierFilter,
              [
                { value: '', label: 'All' },
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' },
                { value: 'C', label: 'C' },
              ],
              80
            )}
            {renderFilterControl(
              'Payments',
              overdueFilter,
              setOverdueFilter,
              [
                { value: 'all', label: 'All' },
                { value: 'due', label: 'Has Due' },
                { value: 'not_due', label: 'All Done' },
              ],
              110
            )}
          </TabletFiltersRow>

          {/* Desktop Filters */}
          <DesktopFiltersRow>
            {renderFilterControl(
              'Activity',
              filterType,
              setFilterType,
              [
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Billed in the Last 3 Months' },
                { value: 'inactive', label: 'Not Billed in the Last 3 Months' },
                { value: 'recent', label: 'Billed in the last 45 days' },
              ],
              200
            )}
            {renderFilterControl(
              'Status',
              statusFilter,
              setStatusFilter,
              [
                { value: '', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]
            )}
            {renderFilterControl(
              'Tier',
              tierFilter,
              setTierFilter,
              [
                { value: '', label: 'All' },
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' },
                { value: 'C', label: 'C' },
              ],
              120
            )}
            {renderFilterControl(
              'Payment Status',
              overdueFilter,
              setOverdueFilter,
              [
                { value: 'all', label: 'All' },
                { value: 'due', label: 'Has Due Payments' },
                { value: 'not_due', label: 'All Payments Done' },
              ],
              180
            )}
          </DesktopFiltersRow>
        </FilterContainer>

        {/* Loading State */}
        {loading ? (
          <Stack spacing={{ xs: 1.5, sm: 2 }}>
            {[1, 2, 3].map((item) => (
              <Skeleton
                key={item}
                variant='rectangular'
                sx={{
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }}
              />
            ))}
          </Stack>
        ) : (
          /* Customer List */
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {filteredCustomers.length > 0 ? (
              <Stack spacing={{ xs: 1.5, sm: 2 }}>
                {filteredCustomers.map((customer, index) => {
                  const isExpanded = expandedCards[customer.customerName];
                  const hasDuePayments = customer.duePayments && customer.duePayments.length > 0;
                  const hasNotDuePayments = customer.notDuePayments && customer.notDuePayments.length > 0;

                  return (
                    <motion.div
                      key={`${customer.customerName}-${index}`}
                      variants={cardVariants}
                    >
                      <CustomerCard
                        onClick={(event) => toggleCardExpansion(customer.customerName, event)}
                        sx={{ cursor: isMobile ? 'default' : 'pointer' }}
                      >
                        <CardContent
                          sx={{
                            p: { xs: 1.5, sm: 2, md: 3 },
                            '&:last-child': { pb: { xs: 1.5, sm: 2, md: 3 } }
                          }}
                        >
                          {/* Header Section */}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              justifyContent: 'space-between',
                              mb: { xs: 1.5, sm: 2 },
                              gap: { xs: 1, sm: 0 },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-evenly' : 'flex-start', width: '100%', gap: 1, flex: 1 }}>
                              <Typography
                                variant='body1'
                                component='h2'
                                sx={{
                                  fontWeight: 700,
                                  color: 'text.primary',
                                  lineHeight: 1.2,
                                  fontSize: {
                                    xs: '0.95rem',
                                    sm: '1.1rem',
                                    md: '1.25rem'
                                  },
                                }}
                              >
                                {index + 1}. {customer.customerName}
                              </Typography>

                              {/* Payment Indicators */}
                              <Box sx={{ display: 'flex', gap: '12px !important', alignItems: 'center' }}>
                                {hasDuePayments && (
                                  <Tooltip title={`${customer.duePayments.length} due payment(s)`}>
                                    <PaymentBadge
                                      badgeContent={customer.duePayments.length}
                                      color="error"
                                    >
                                      <WarningIcon sx={{ fontSize: '1.2rem', color: 'error.main' }} />
                                    </PaymentBadge>
                                  </Tooltip>
                                )}
                                {hasNotDuePayments && (
                                  <Tooltip title={`${customer.notDuePayments.length} paid/current payment(s)`}>
                                    <PaymentBadge
                                      badgeContent={customer.notDuePayments.length}
                                      color="success"
                                    >
                                      <CheckCircleIcon sx={{ fontSize: '1.2rem', color: 'success.main' }} />
                                    </PaymentBadge>
                                  </Tooltip>
                                )}
                              </Box>

                              {isMobile && (
                                <IconButton
                                  size="small"
                                  sx={{ ml: 'auto', color: 'text.secondary' }}
                                  onClick={(event) => toggleCardExpansion(customer.customerName, event)}
                                >
                                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                              )}
                            </Box>

                            <Box sx={{
                              display: 'flex',
                              gap: 0.5,
                              flexWrap: 'wrap',
                              alignSelf: { xs: 'flex-start', sm: 'center' }
                            }}>
                              <Chip
                                label={capitalize(customer.status)}
                                color={getStatusColor(customer.status)}
                                size='small'
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                }}
                              />
                              <Chip
                                label={customer.tier === 'UNDEFINED' ? "No Tier" : `Tier ${customer.tier.toUpperCase()}`}
                                color={getTierColor(customer.tier)}
                                size='small'
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Always visible content on mobile - address only */}
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              lineHeight: 1.4,
                              mb: { xs: 1, sm: 2 }
                            }}
                          >
                            <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                              Address:
                            </Box>{' '}
                            {customer.billingAddress}
                          </Typography>

                          {/* Collapsible content on mobile, always visible on larger screens */}
                          <CollapsibleContent
                            in={!isMobile || isExpanded}
                            timeout="auto"
                          >
                            <Box>
                              {/* Sales Person */}
                              {customer.salesPerson && (
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                  sx={{
                                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                    lineHeight: 1.4,
                                    mb: { xs: 1.5, sm: 2 }
                                  }}
                                >
                                  <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    Sales Person:
                                  </Box>{' '}
                                  {customer.salesPerson}
                                </Typography>
                              )}

                              {/* Financial Metrics */}
                              <MetricsContainer>
                                <MetricCard>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    sx={{
                                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                      fontWeight: 500,
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5,
                                      display: 'block',
                                    }}
                                  >
                                    Current Month
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    sx={{
                                      fontWeight: 700,
                                      color: 'primary.main',
                                      fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' },
                                      lineHeight: 1.2,
                                      mt: 0.5,
                                    }}
                                  >
                                    {formatCurrency(customer.totalSalesCurrentMonth)}
                                  </Typography>
                                </MetricCard>

                                <MetricCard>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    sx={{
                                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                      fontWeight: 500,
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5,
                                      display: 'block',
                                    }}
                                  >
                                    This Year ({new Date().getFullYear()})
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    sx={{
                                      fontWeight: 700,
                                      color: 'success.main',
                                      fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' },
                                      lineHeight: 1.2,
                                      mt: 0.5,
                                    }}
                                  >
                                    {formatCurrency(customer.billingTillDateCurrentYear)}
                                  </Typography>
                                </MetricCard>

                                <MetricCard>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    sx={{
                                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                      fontWeight: 500,
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5,
                                      display: 'block',
                                    }}
                                  >
                                    Last FY ({new Date().getFullYear() - 1})
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    sx={{
                                      fontWeight: 700,
                                      color: 'info.main',
                                      fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' },
                                      lineHeight: 1.2,
                                      mt: 0.5,
                                    }}
                                  >
                                    {formatCurrency(customer.totalSalesLastFY)}
                                  </Typography>
                                </MetricCard>

                                <MetricCard>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    sx={{
                                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                      fontWeight: 500,
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5,
                                      display: 'block',
                                    }}
                                  >
                                    Prior FY ({new Date().getFullYear() - 2})
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    sx={{
                                      fontWeight: 700,
                                      color: 'info.main',
                                      fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' },
                                      lineHeight: 1.2,
                                      mt: 0.5,
                                    }}
                                  >
                                    {formatCurrency(customer.totalSalesPreviousFY)}
                                  </Typography>
                                </MetricCard>

                                <MetricCard>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    sx={{
                                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                      fontWeight: 500,
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5,
                                      display: 'block',
                                    }}
                                  >
                                    Frequency
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    sx={{
                                      fontWeight: 700,
                                      color: 'warning.main',
                                      fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' },
                                      lineHeight: 1.2,
                                      mt: 0.5,
                                    }}
                                  >
                                    {customer.averageOrderFrequencyMonthly.toFixed(1)}/mo
                                  </Typography>
                                </MetricCard>
                              </MetricsContainer>

                              {/* Payment Information - Updated with better invoice display */}
                              {(hasDuePayments || hasNotDuePayments) && (
                                <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                                  {renderInvoiceList(
                                    customer.duePayments,
                                    'Due Payments',
                                    <WarningIcon sx={{ fontSize: '1rem', color: 'error.main' }} />,
                                    'error'
                                  )}

                                  {renderInvoiceList(
                                    customer.notDuePayments,
                                    'Paid/Current Payments',
                                    <CheckCircleIcon sx={{ fontSize: '1rem', color: 'success.main' }} />,
                                    'success'
                                  )}
                                </Box>
                              )}

                              {/* Activity Indicators */}
                              <Box sx={{
                                display: 'flex',
                                gap: { xs: 0.5, sm: 0.5 },
                                flexWrap: 'wrap',
                                mb: { xs: 1, sm: 1.5 }
                              }}>
                                <Chip
                                  label={customer.hasBilledLastMonth ? "✓ Last Month" : "✗ Last Month"}
                                  color={customer.hasBilledLastMonth ? "success" : "default"}
                                  size='small'
                                  variant={customer.hasBilledLastMonth ? "filled" : "outlined"}
                                  sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
                                />
                                <Chip
                                  label={customer.hasBilledLast45Days ? "✓ Last 45D" : "✗ Last 45D"}
                                  color={customer.hasBilledLast45Days ? "info" : "default"}
                                  size='small'
                                  variant={customer.hasBilledLast45Days ? "filled" : "outlined"}
                                  sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
                                />
                                <Chip
                                  label={customer.hasBilledLast3Months ? "✓ Last 3M" : "✗ Last 3M"}
                                  color={customer.hasBilledLast3Months ? "primary" : "error"}
                                  size='small'
                                  variant={customer.hasBilledLast3Months ? "filled" : "outlined"}
                                  sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
                                />
                              </Box>

                              {/* Last Bill Date */}
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{
                                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                  fontStyle: customer.lastBillDate ? 'normal' : 'italic',
                                }}
                              >
                                <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                                  Last Billed:
                                </Box>{' '}
                                {customer.lastBillDate
                                  ? new Date(customer.lastBillDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                  : 'No recent bills'}
                              </Typography>
                            </Box>
                          </CollapsibleContent>
                        </CardContent>
                      </CustomerCard>
                    </motion.div>
                  );
                })}
              </Stack>
            ) : (
              <Card sx={{
                textAlign: 'center',
                py: { xs: 4, sm: 6 },
                background: 'rgba(255, 255, 255, 0.9)'
              }}>
                <CardContent>
                  <Typography
                    variant={'body1'}
                    color='text.secondary'
                    sx={{ fontWeight: 500 }}
                  >
                    No customers found for the selected filters
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    Try adjusting your filter criteria or search term
                  </Typography>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Summary Stats */}
        {!loading && filteredCustomers.length > 0 && (
          <StatsContainer>
            <Chip
              label={`Total: ${filteredCustomers.length}`}
              color='primary'
              size={isMobile ? 'small' : 'medium'}
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                color: 'white',
              }}
            />
            <Chip
              label={`Active: ${filteredCustomers.filter(c => c.hasBilledLast3Months).length}`}
              color='success'
              size={isMobile ? 'small' : 'medium'}
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                color: 'white',
              }}
            />
            <Chip
              label={`Inactive: ${filteredCustomers.filter(c => !c.hasBilledLast3Months).length}`}
              color='error'
              size={isMobile ? 'small' : 'medium'}
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                color: 'white',
              }}
            />
            <Chip
              label={`With Due: ${filteredCustomers.filter(c => c.duePayments && c.duePayments.length > 0).length}`}
              color='warning'
              size={isMobile ? 'small' : 'medium'}
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                color: 'white',
              }}
            />
            <Chip
              label={`Fully Paid: ${filteredCustomers.filter(c => !c.duePayments || c.duePayments.length === 0).length}`}
              color='success'
              size={isMobile ? 'small' : 'medium'}
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                color: 'white',
              }}
            />
            {searchTerm && (
              <Chip
                label={`Search: ${filteredCustomers.length}`}
                color='info'
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  color: 'white',
                }}
              />
            )}
          </StatsContainer>
        )}

        {/* Navigation */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: { xs: 3, sm: 4 },
          px: { xs: 1, sm: 0 }
        }}>
          <CustomButton
            color='secondary'
            onClick={() => router.push('/')}
            text='Go Back'
          />
        </Box>

        {/* Mobile Filters Drawer */}
        {renderMobileFilters()}
      </StyledContainer>
      {/* Navigation Buttons */}
      <Zoom in={trigger}>
        <Box
          sx={{
            position: 'fixed',
            bottom: isMobile ? 350 : 16, // Move higher on mobile
            right: isMobile ? 4 : 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 9999,
          }}
          className='no-pdf'
        >
          <Tooltip title='Go to Top'>
            <Fab color='primary'
              size={isMobile ? 'small' : 'medium'}
              aria-label='scroll to top'
              onClick={scrollToTop}
              sx={{ opacity: 0.9 }}
            >
              <KeyboardArrowUp />
            </Fab>
          </Tooltip>
          <Tooltip title='Go to Bottom'>
            <Fab
              color='primary'
              size={isMobile ? 'small' : 'medium'}
              aria-label='scroll to bottom'
              onClick={scrollToBottom}
              sx={{ opacity: 0.9 }}
            >
              <KeyboardArrowDown />
            </Fab>
          </Tooltip>
        </Box>
      </Zoom>
      <div ref={pageBottomRef} />
    </Box>
  );
};

export default CustomerAnalytics;