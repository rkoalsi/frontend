import { useCallback, useContext, useEffect, useRef, useState, useMemo } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Paper,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
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
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ClearIcon from '@mui/icons-material/Clear';
import InfoIcon from '@mui/icons-material/Info';
import AuthContext from '../../src/components/Auth';
import { toast } from 'react-toastify';
import CustomButton from '../../src/components/common/Button';
import Header from '../../src/components/common/Header';
import capitalize from '../../src/util/capitalize';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

// Types remain the same
type PaymentInfo = {
  _id: string;
  invoice_number: string;
  invoice_id: string;
  status: string;
  total: number;
  balance: number;
};

type AllInvoiceInfo = {
  _id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  status: string;
  total: number;
  balance: number;
  customer_id: string;
  invoice_id: string;
  yearMonth: string;
  isCurrentMonth: boolean;
  isCurrentFY: boolean;
  isLastFY: boolean;
  isPreviousFY: boolean;
};

type CustomerAnalyticsType = {
  customerName: string;
  shippingAddress: string;
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
  allInvoices: AllInvoiceInfo[];
};

// Styled Components
const StyledContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '1400px',
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
  background: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(0, 0, 0, 0.08)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease-in-out',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(0, 0, 0, 0.12)',
  },
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(2.5),
  },
}));

const MetricCard = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  textAlign: 'center',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  flex: 1,
  minWidth: '90px',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
    minWidth: '110px',
  },
  [theme.breakpoints.up('md')]: {
    minWidth: '130px',
  },
}));

const PaymentCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #fafbfc 0%, #ffffff 100%)',
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(2),
  border: '1px solid rgba(0, 0, 0, 0.06)',
  marginTop: theme.spacing(1.5),
  elevation: 0,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2.5),
    marginTop: theme.spacing(2),
  },
}));

const InvoiceChip = styled(Chip)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: theme.spacing(2),
  backdropFilter: 'blur(10px)',
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2.5),
  },
}));

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
  padding: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: theme.spacing(2),
  flexWrap: 'wrap',
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: 'transparent',
  boxShadow: 'none',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  borderRadius: theme.spacing(1),
  marginTop: theme.spacing(1),
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: `${theme.spacing(1)} 0`,
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  borderRadius: theme.spacing(1),
  minHeight: 48,
  cursor: 'pointer',
  '&.Mui-expanded': {
    minHeight: 48,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  '& .MuiAccordionSummary-content': {
    margin: `${theme.spacing(1)} 0`,
    alignItems: 'center',
  },
  '& .MuiAccordionSummary-expandIconWrapper': {
    transform: 'rotate(0deg)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  '&.Mui-expanded .MuiAccordionSummary-expandIconWrapper': {
    transform: 'rotate(180deg)',
  },
}));

// Custom hook for debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2
    }
  }
};

const CustomerAnalytics = () => {
  // State Management
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerAnalyticsType[]>([]);
  const [filterType, setFilterType] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [overdueFilter, setOverdueFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  const [expandedInvoices, setExpandedInvoices] = useState<{ [key: string]: boolean }>({});
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const router = useRouter();
  const { user }: any = useContext(AuthContext);
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  // Memoized filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
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

      let paymentMatch = true;
      if (overdueFilter === 'due') {
        paymentMatch = customer.duePayments && customer.duePayments.length > 0;
      } else if (overdueFilter === 'not_due') {
        paymentMatch = !customer.duePayments || customer.duePayments.length === 0;
      }

      const searchMatch = debouncedSearchTerm === '' ||
        customer.customerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.shippingAddress.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (customer.salesPerson && customer.salesPerson.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      return activityMatch && paymentMatch && searchMatch;
    });
  }, [customers, filterType, overdueFilter, debouncedSearchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, statusFilter, tierFilter, overdueFilter, debouncedSearchTerm]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Toggle functions
  const toggleCardExpansion = useCallback((customerName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (isMobile) {
      setExpandedCards(prev => ({
        ...prev,
        [customerName]: !prev[customerName]
      }));
    }
  }, [isMobile]);

  const toggleInvoiceAccordion = useCallback((customerName: string) => {
    setExpandedInvoices(prev => ({
      ...prev,
      [customerName]: !prev[customerName]
    }));
  }, []);

  // Handle invoice click
  const handleInvoiceClick = useCallback(async (invoiceId: string, invoiceNumber: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const resp = await axios.get(
        `${process.env.api_url}/invoices/download_pdf/${invoiceId}`,
        {
          responseType: 'blob',
        }
      );

      if (resp.data.type !== 'application/pdf') {
        toast.error('Invoice Not Created');
        return;
      }

      const contentDisposition = resp.headers['content-disposition'];
      let fileName = `${invoiceNumber}.pdf`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

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
  }, []);

  // Fetch data
  const getData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams: any = {};

      if (statusFilter) queryParams.status = statusFilter;
      if (tierFilter) queryParams.tier = tierFilter;
      if (overdueFilter) queryParams.due_status = overdueFilter;
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
  }, [statusFilter, tierFilter, overdueFilter, user?.data?.code]);

  useEffect(() => {
    getData();
  }, [getData]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'unknown': return 'default';
      default: return 'primary';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'a': return 'warning';
      case 'b': return 'info';
      case 'c': return 'secondary';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'paid') return 'success';
    if (lowerStatus === 'overdue') return 'error';
    if (lowerStatus === 'partially_paid') return 'warning';
    if (lowerStatus === 'sent') return 'info';
    return 'default';
  };

  const formatStatus = (status: string) => {
    if (!status) return '';
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterType('');
    setStatusFilter('');
    setTierFilter('');
    setOverdueFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = filterType || statusFilter || tierFilter || overdueFilter !== 'all' || searchTerm;

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
          fontSize: { xs: '0.8rem', sm: '0.875rem' }
        },
        '& .MuiSelect-root': {
          fontSize: { xs: '0.8rem', sm: '0.875rem' },
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

  // Render invoice list
  const renderInvoiceList = (payments: PaymentInfo[], title: string, icon: React.ReactNode, color: 'error' | 'success') => {
    if (!payments || payments.length === 0) return null;

    return (
      <PaymentCard elevation={0}>
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
                      #{payment.invoice_number}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                      {formatCurrency(payment.total)}
                    </Typography>
                    {color === 'error' && (
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'error.main' }}>
                        Balance: {formatCurrency(payment.balance)}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                      {capitalize(payment.status)}
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
                  },
                }}
              />
            </Grid>
          ))}
        </Grid>
      </PaymentCard>
    );
  };

  // Render all invoices accordion
  const renderAllInvoicesAccordion = (customer: CustomerAnalyticsType) => {
    if (!customer.allInvoices || customer.allInvoices.length === 0) return null;

    const sortedInvoices = [...customer.allInvoices].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
      <StyledAccordion
        expanded={expandedInvoices[customer.customerName] || false}
        onChange={() => toggleInvoiceAccordion(customer.customerName)}
      >
        <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <ListAltIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
            <Typography
              variant='body2'
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              All Invoices ({customer.allInvoices.length})
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={`Total: ${customer.allInvoices.length}`}
                size="small"
                color="primary"
                sx={{ fontSize: '0.65rem', height: 20 }}
                onClick={(e) => e.stopPropagation()}
              />
              <Chip
                label={`Paid: ${customer.allInvoices.filter(inv => inv.status.toLowerCase() === 'paid').length}`}
                size="small"
                color="success"
                sx={{ fontSize: '0.65rem', height: 20 }}
                onClick={(e) => e.stopPropagation()}
              />
              <Chip
                label={`Due: ${customer.allInvoices.filter(inv => inv.balance > 0).length}`}
                size="small"
                color="error"
                sx={{ fontSize: '0.65rem', height: 20 }}
                onClick={(e) => e.stopPropagation()}
              />
            </Box>
          </Box>
        </StyledAccordionSummary>
        <AccordionDetails sx={{ pt: 2 }}>
          <Grid container spacing={1.5}>
            {sortedInvoices.map((invoice, idx) => (
              <Grid  key={idx}>
                <InvoiceChip
                  icon={<VisibilityIcon sx={{ fontSize: '0.9rem' }} />}
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        {formatDate(invoice.date)} - #{invoice.invoice_number}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        {formatCurrency(invoice.total)}
                      </Typography>
                      {invoice.balance > 0 && (
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'error.main' }}>
                          Balance: {formatCurrency(invoice.balance)}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                        Due: {formatDate(invoice.due_date)}
                      </Typography>
                    </Box>
                  }
                  size="small"
                  color={getPaymentStatusColor(invoice.status)}
                  variant="outlined"
                  onClick={(event) => handleInvoiceClick(invoice._id, invoice.invoice_number, event)}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    justifyContent: 'flex-start',
                    '& .MuiChip-label': {
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                    },
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </StyledAccordion>
    );
  };

  // Render customer card
  const renderCustomerCard = (customer: CustomerAnalyticsType, index: number) => {
    const isExpanded = expandedCards[customer.customerName];
    const hasDuePayments = customer.duePayments && customer.duePayments.length > 0;
    const hasNotDuePayments = customer.notDuePayments && customer.notDuePayments.length > 0;
    const globalIndex = startIndex + index + 1;

    return (
      <motion.div
        key={`${customer.customerName}-${index}`}
        variants={cardVariants}
        layout
      >
        <CustomerCard>
          <CardContent
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                mb: 2,
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <Typography
                  variant='body1'
                  component='h2'
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                  }}
                >
                  {globalIndex}. {customer.customerName}
                </Typography>

                {/* Payment Indicators */}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  {hasDuePayments && (
                    <Tooltip title={`${customer.duePayments.length} due payment(s)`}>
                      <Badge badgeContent={customer.duePayments.length} color="error">
                        <WarningIcon sx={{ fontSize: '1.2rem', color: 'error.main' }} />
                      </Badge>
                    </Tooltip>
                  )}
                  {hasNotDuePayments && (
                    <Tooltip title={`${customer.notDuePayments.length} paid/current payment(s)`}>
                      <Badge badgeContent={customer.notDuePayments.length} color="success">
                        <CheckCircleIcon sx={{ fontSize: '1.2rem', color: 'success.main' }} />
                      </Badge>
                    </Tooltip>
                  )}
                </Box>

                {isMobile && (
                  <IconButton
                    size="small"
                    sx={{ ml: 'auto' }}
                    onClick={(event) => toggleCardExpansion(customer.customerName, event)}
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Chip
                  label={capitalize(customer.status)}
                  color={getStatusColor(customer.status)}
                  size='small'
                  sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                />
                <Chip
                  label={customer.tier === 'UNDEFINED' ? "No Tier" : `Tier ${customer.tier}`}
                  color={getTierColor(customer.tier)}
                  size='small'
                  sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                />
              </Box>
            </Box>

            {/* Address */}
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                mb: 1.5
              }}
            >
              <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                Address:
              </Box>{' '}
              {customer.shippingAddress}
            </Typography>

            {/* Collapsible content */}
            <Collapse in={!isMobile || isExpanded} timeout="auto">
              <Box>
                {/* Sales Person */}
                {customer.salesPerson && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      mb: 2
                    }}
                  >
                    <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Sales Person:
                    </Box>{' '}
                    {customer.salesPerson}
                  </Typography>
                )}

                {/* Financial Metrics */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <MetricCard>
                    <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                      Current Month
                    </Typography>
                    <Typography variant='body2' sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.85rem', sm: '0.95rem' }, mt: 0.5 }}>
                      {formatCurrency(customer.totalSalesCurrentMonth)}
                    </Typography>
                  </MetricCard>

                  <MetricCard>
                    <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                      This Year
                    </Typography>
                    <Typography variant='body2' sx={{ fontWeight: 700, color: 'success.main', fontSize: { xs: '0.85rem', sm: '0.95rem' }, mt: 0.5 }}>
                      {formatCurrency(customer.billingTillDateCurrentYear)}
                    </Typography>
                  </MetricCard>

                  <MetricCard>
                    <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                      Last FY
                    </Typography>
                    <Typography variant='body2' sx={{ fontWeight: 700, color: 'info.main', fontSize: { xs: '0.85rem', sm: '0.95rem' }, mt: 0.5 }}>
                      {formatCurrency(customer.totalSalesLastFY)}
                    </Typography>
                  </MetricCard>

                  <MetricCard>
                    <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                      Prior FY
                    </Typography>
                    <Typography variant='body2' sx={{ fontWeight: 700, color: 'info.main', fontSize: { xs: '0.85rem', sm: '0.95rem' }, mt: 0.5 }}>
                      {formatCurrency(customer.totalSalesPreviousFY)}
                    </Typography>
                  </MetricCard>

                  <MetricCard>
                    <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                      Frequency
                    </Typography>
                    <Typography variant='body2' sx={{ fontWeight: 700, color: 'warning.main', fontSize: { xs: '0.85rem', sm: '0.95rem' }, mt: 0.5 }}>
                      {customer.averageOrderFrequencyMonthly.toFixed(1)}/mo
                    </Typography>
                  </MetricCard>
                </Box>

                {/* All Invoices Accordion */}
                {renderAllInvoicesAccordion(customer)}

                {/* Payment Information */}
                {(hasDuePayments || hasNotDuePayments) && (
                  <Box sx={{ mb: 2 }}>
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
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                  <Chip
                    label={customer.hasBilledLastMonth ? "✓ Last Month" : "✗ Last Month"}
                    color={customer.hasBilledLastMonth ? "success" : "default"}
                    size='small'
                    variant={customer.hasBilledLastMonth ? "filled" : "outlined"}
                    sx={{ fontSize: '0.7rem' }}
                  />
                  <Chip
                    label={customer.hasBilledLast45Days ? "✓ Last 45D" : "✗ Last 45D"}
                    color={customer.hasBilledLast45Days ? "info" : "default"}
                    size='small'
                    variant={customer.hasBilledLast45Days ? "filled" : "outlined"}
                    sx={{ fontSize: '0.7rem' }}
                  />
                  <Chip
                    label={customer.hasBilledLast3Months ? "✓ Last 3M" : "✗ Last 3M"}
                    color={customer.hasBilledLast3Months ? "primary" : "error"}
                    size='small'
                    variant={customer.hasBilledLast3Months ? "filled" : "outlined"}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>

                {/* Last Bill Date */}
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    fontStyle: customer.lastBillDate ? 'normal' : 'italic',
                  }}
                >
                  <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Last Billed:
                  </Box>{' '}
                  {customer.lastBillDate ? formatDate(customer.lastBillDate) : 'No recent bills'}
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </CustomerCard>
      </motion.div>
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
              { value: '', label: 'All' },
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

        <Button
          variant="outlined"
          color="error"
          startIcon={<ClearIcon />}
          onClick={clearAllFilters}
          sx={{ mt: 3, width: '100%' }}
        >
          Clear All Filters
        </Button>
      </Box>
    </Drawer>
  );

  return (
    <Box sx={{ minHeight: '100vh', pb: { xs: 2, sm: 3, md: 4 } }}>
      <StyledContainer>
        {/* Header */}
        <Header title='Customer Analytics' showBackButton />

        {/* Filters */}
        <FilterContainer>
          {/* Search Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <TextField
              placeholder="Search customers, addresses, sales person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                width: '100%',
                maxWidth: { xs: '100%', sm: '500px', md: '600px' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Mobile Filters Button */}
          {isMobile && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setMobileFiltersOpen(true)}
                sx={{ mb: 2 }}
              >
                Filters {hasActiveFilters && `(Active)`}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ClearIcon />}
                  onClick={clearAllFilters}
                  sx={{ mb: 2 }}
                >
                  Clear
                </Button>
              )}
            </Box>
          )}

          {/* Desktop/Tablet Filters */}
          {!isMobile && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', alignItems: 'center' }}>
              {renderFilterControl(
                'Activity',
                filterType,
                setFilterType,
                [
                  { value: '', label: 'All Activity' },
                  { value: 'active', label: 'Active (3M)' },
                  { value: 'inactive', label: 'Inactive (3M)' },
                  { value: 'recent', label: 'Recent (45D)' },
                ],
                isTablet ? 130 : 160
              )}
              {renderFilterControl(
                'Status',
                statusFilter,
                setStatusFilter,
                [
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ],
                isTablet ? 110 : 140
              )}
              {renderFilterControl(
                'Tier',
                tierFilter,
                setTierFilter,
                [
                  { value: '', label: 'All Tiers' },
                  { value: 'A', label: 'Tier A' },
                  { value: 'B', label: 'Tier B' },
                  { value: 'C', label: 'Tier C' },
                ],
                isTablet ? 100 : 120
              )}
              {renderFilterControl(
                'Payment',
                overdueFilter,
                setOverdueFilter,
                [
                  { value: 'all', label: 'All Payments' },
                  { value: 'due', label: 'Has Due' },
                  { value: 'not_due', label: 'All Paid' },
                ],
                isTablet ? 120 : 150
              )}
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearAllFilters}
                >
                  Clear All
                </Button>
              )}
            </Box>
          )}

        </FilterContainer>

        {/* Results Summary */}
        {!loading && filteredCustomers.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <InfoIcon fontSize="small" />
              <Typography variant="body2">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
              </Typography>
              {hasActiveFilters && (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  (Filtered from {customers.length} total)
                </Typography>
              )}
            </Box>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <>
            <LinearProgress sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Skeleton
                  key={item}
                  variant='rectangular'
                  height={180}
                  sx={{
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }}
                />
              ))}
            </Stack>
          </>
        ) : (
          <>
            {/* Customer List */}
            <AnimatePresence mode="wait">
              {paginatedCustomers.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                  exit='hidden'
                >
                  <Grid container spacing={viewMode === 'grid' ? 2 : 0} width={'100%'}>
                    {paginatedCustomers.map((customer, index) => (
                      <Grid 
                        // item 
                        // xs={12} 
                        // md={viewMode === 'grid' ? 6 : 12} 
                        width={'100%'}
                        key={`${customer.customerName}-${index}`}
                      >
                        {renderCustomerCard(customer, index)}
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              ) : (
                <Card sx={{
                  textAlign: 'center',
                  py: { xs: 4, sm: 6 },
                  background: 'rgba(255, 255, 255, 0.95)'
                }}>
                  <CardContent>
                    <Typography variant='h6' color='text.secondary' sx={{ mb: 1 }}>
                      No customers found
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Try adjusting your filters or search term
                    </Typography>
                    {hasActiveFilters && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ClearIcon />}
                        onClick={clearAllFilters}
                        sx={{ mt: 2 }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {filteredCustomers.length > 0 && (
              <PaginationContainer>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Items per page</InputLabel>
                    <Select
                      value={itemsPerPage}
                      label="Items per page"
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>

                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    color="primary"
                    size={isMobile ? 'small' : 'medium'}
                    siblingCount={isMobile ? 0 : 1}
                    boundaryCount={1}
                    showFirstButton={!isMobile}
                    showLastButton={!isMobile}
                  />
                </Box>
              </PaginationContainer>
            )}

            {/* Summary Stats */}
            {!loading && filteredCustomers.length > 0 && (
              <Box sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: 'center',
                mt: 3,
                p: 2,
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2,
              }}>
                <Chip
                  label={`Total: ${filteredCustomers.length}`}
                  color='primary'
                  size={isMobile ? 'small' : 'medium'}
                />
                <Chip
                  label={`Active: ${filteredCustomers.filter(c => c.hasBilledLast3Months).length}`}
                  color='success'
                  size={isMobile ? 'small' : 'medium'}
                />
                <Chip
                  label={`Inactive: ${filteredCustomers.filter(c => !c.hasBilledLast3Months).length}`}
                  color='error'
                  size={isMobile ? 'small' : 'medium'}
                />
                <Chip
                  label={`With Due: ${filteredCustomers.filter(c => c.duePayments?.length > 0).length}`}
                  color='warning'
                  size={isMobile ? 'small' : 'medium'}
                />
                <Chip
                  label={`Fully Paid: ${filteredCustomers.filter(c => !c.duePayments || c.duePayments.length === 0).length}`}
                  color='success'
                  size={isMobile ? 'small' : 'medium'}
                />
              </Box>
            )}
          </>
        )}

        {/* Navigation */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 4,
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

      {/* Floating Action Buttons */}
      <Zoom in={trigger}>
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 1000,
          }}
        >
          <Tooltip title='Go to Top'>
            <Fab
              color='primary'
              size={isMobile ? 'small' : 'medium'}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <KeyboardArrowUp />
            </Fab>
          </Tooltip>
        </Box>
      </Zoom>
    </Box>
  );
};

export default CustomerAnalytics;