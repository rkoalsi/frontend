import { useContext, useEffect, useState } from 'react';
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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import AuthContext from '../../src/components/Auth';
import { toast } from 'react-toastify';
import CustomButton from '../../src/components/common/Button';
import Header from '../../src/components/common/Header';
import capitalize from '../../src/util/capitalize';

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
};

const StyledContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '900px',
  margin: '0 auto',
  padding: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
  },
}));

const CustomerCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  },
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(1.5),
  },
}));

const MetricCard = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(2),
  textAlign: 'center',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  flex: 1,
  minWidth: '120px',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    minWidth: '100px',
  },
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(3.5),
    marginBottom: theme.spacing(2),
  },
}));

const StatsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(2),
  },
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
      duration: 0.5,
      ease: 'easeOut'
    }
  },
};

const CustomerAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerAnalyticsType[]>([]);
  const [filterType, setFilterType] = useState<
    'all' | 'active' | 'inactive' | 'recent'
  >('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user }: any = useContext(AuthContext);

  // Fetch customer analytics from the backend
  const getData = async () => {
    try {
      setLoading(true);
      const queryParams: any = {};

      if (statusFilter) {
        queryParams.status = statusFilter;
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

  // Navigate to customer details page
  const handleCustomerClick = (customerName: string) => {
    console.log('Customer clicked:', customerName);
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

    // Then apply search filter (case-insensitive search in name and address)
    const searchMatch = searchTerm === '' || 
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.billingAddress.toLowerCase().includes(searchTerm.toLowerCase());

    return activityMatch && searchMatch;
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
      case 'premium':
        return 'warning';
      case 'gold':
        return 'success';
      case 'silver':
        return 'info';
      default:
        return 'default';
    }
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

  useEffect(() => {
    getData();
  }, [filterType, statusFilter]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        paddingBottom: 4,
      }}
    >
      <StyledContainer>
        {/* Header */}
        <Header title='Customer Analytics' showBackButton />

        {/* Filter Controls */}
        <FilterContainer>
          {/* Search Bar */}
          <TextField
            placeholder="Search by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              minWidth: isMobile ? '100%' : 300,
              '& .MuiInputLabel-root': { color: 'white' },
              '& .MuiInputBase-input': { 
                color: 'white',
                fontSize: '0.9rem',
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
                borderColor: 'white',
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

          <FormControl
            variant='outlined'
            size="small"
            sx={{ 
              minWidth: isMobile ? 160 : 200,
              '& .MuiInputLabel-root': { color: 'white', fontSize: '0.9rem' },
              '& .MuiSelect-root': { 
                color: 'white',
                fontSize: '0.9rem',
              },
              '& .MuiOutlinedInput-notchedOutline': { 
                borderColor: 'rgba(255, 255, 255, 0.6)' 
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.8)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
            }}
          >
            <InputLabel id='activity-filter-label'>Activity Filter</InputLabel>
            <Select
              labelId='activity-filter-label'
              value={filterType}
              label='Activity Filter'
              onChange={(e) =>
                setFilterType(
                  e.target.value as 'all' | 'active' | 'inactive' | 'recent'
                )
              }
            >
              <MenuItem value='all'>All Customers</MenuItem>
              <MenuItem value='active'>Active (Last 3 Months)</MenuItem>
              <MenuItem value='inactive'>Inactive (3+ Months)</MenuItem>
              <MenuItem value='recent'>Recent (Last Month)</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            variant='outlined'
            size="small"
            sx={{ 
              minWidth: isMobile ? 140 : 160,
              '& .MuiInputLabel-root': { color: 'white', fontSize: '0.9rem' },
              '& .MuiSelect-root': { 
                color: 'white',
                fontSize: '0.9rem',
              },
              '& .MuiOutlinedInput-notchedOutline': { 
                borderColor: 'rgba(255, 255, 255, 0.6)' 
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.8)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
            }}
          >
            <InputLabel id='status-filter-label'>Status</InputLabel>
            <Select
              labelId='status-filter-label'
              value={statusFilter}
              label='Status'
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value='all'>All Status</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </Select>
          </FormControl>
        </FilterContainer>

        {/* Loading State */}
        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((item) => (
              <Skeleton
                key={item}
                variant='rectangular'
                height={isMobile ? 120 : 160}
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
              <Stack spacing={isMobile ? 1.5 : 2}>
                {filteredCustomers.map((customer, index) => (
                  <motion.div
                    key={`${customer.customerName}-${index}`}
                    variants={cardVariants}
                  >
                    <CustomerCard
                      onClick={() => handleCustomerClick(customer.customerName)}
                    >
                      <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
                        {/* Header Section */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            justifyContent: 'space-between',
                            mb: 2,
                            gap: isMobile ? 1 : 0,
                          }}
                        >
                          <Typography 
                            variant={isMobile ? 'h6' : 'h5'} 
                            component='h2'
                            sx={{ 
                              fontWeight: 700,
                              color: 'text.primary',
                              lineHeight: 1.2,
                              fontSize: isMobile ? '1.1rem' : '1.25rem',
                            }}
                          >
                            {index + 1}. {customer.customerName}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={capitalize(customer.status)}
                              color={getStatusColor(customer.status)}
                              size='small'
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            />
                            <Chip
                              label={customer.tier === 'UNDEFINED' ? "No Tier" : customer.tier}
                              color={getTierColor(customer.tier)}
                              size='small'
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Customer Info */}
                        <Stack spacing={1} sx={{ mb: 2 }}>
                          <Typography 
                            variant='body2' 
                            color='text.secondary'
                            sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}
                          >
                            <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                              Address:
                            </Box>{' '}
                            {customer.billingAddress}
                          </Typography>

                          {customer.salesPerson && (
                            <Typography 
                              variant='body2' 
                              color='text.secondary'
                              sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}
                            >
                              <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                                Sales Person:
                              </Box>{' '}
                              {customer.salesPerson}
                            </Typography>
                          )}
                        </Stack>

                        {/* Financial Metrics */}
                        <Box
                          sx={{
                            display: 'flex',
                            gap: isMobile ? 1 : 1.5,
                            flexWrap: 'wrap',
                            mb: 2,
                          }}
                        >
                          <MetricCard>
                            <Typography 
                              variant='caption' 
                              color='text.secondary'
                              sx={{ 
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              Current Month
                            </Typography>
                            <Typography 
                              variant='body1' 
                              sx={{ 
                                fontWeight: 700,
                                color: 'primary.main',
                                fontSize: isMobile ? '0.9rem' : '1rem',
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
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              This Year ({new Date().getFullYear()})
                            </Typography>
                            <Typography 
                              variant='body1' 
                              sx={{ 
                                fontWeight: 700,
                                color: 'success.main',
                                fontSize: isMobile ? '0.9rem' : '1rem',
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
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              Last FY ({new Date().getFullYear() - 1})
                            </Typography>
                            <Typography 
                              variant='body1' 
                              sx={{ 
                                fontWeight: 700,
                                color: 'info.main',
                                fontSize: isMobile ? '0.9rem' : '1rem',
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
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              Prior FY ({new Date().getFullYear() - 2})
                            </Typography>
                            <Typography 
                              variant='body1' 
                              sx={{ 
                                fontWeight: 700,
                                color: 'info.main',
                                fontSize: isMobile ? '0.9rem' : '1rem',
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
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              Frequency
                            </Typography>
                            <Typography 
                              variant='body1' 
                              sx={{ 
                                fontWeight: 700,
                                color: 'warning.main',
                                fontSize: isMobile ? '0.9rem' : '1rem',
                                lineHeight: 1.2,
                                mt: 0.5,
                              }}
                            >
                              {customer.averageOrderFrequencyMonthly.toFixed(1)}/mo
                            </Typography>
                          </MetricCard>
                        </Box>

                        {/* Activity Indicators */}
                   <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                          <Chip
                            label={customer.hasBilledLastMonth ? "✓ Billed Last Month" : "✗ No Bills Last Month"}
                            color={customer.hasBilledLastMonth ? "success" : "default"}
                            size='small'
                            variant={customer.hasBilledLastMonth ? "filled" : "outlined"}
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip
                            label={customer.hasBilledLast45Days ? "✓ Billed Last 45 days" : "✗ Not Billed Last 45 days"}
                            color={customer.hasBilledLast45Days ? "info" : "default"}
                            size='small'
                            variant={customer.hasBilledLast45Days ? "filled" : "outlined"}
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip
                            label={customer.hasBilledLast3Months ? "✓ Billed in the Last 3 Months" : "✗ Not Billed in the Last 3 Months"}
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
                            fontSize: '0.875rem',
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
                      </CardContent>
                    </CustomerCard>
                  </motion.div>
                ))}
              </Stack>
            ) : (
              <Card sx={{ textAlign: 'center', py: 6, background: 'rgba(255, 255, 255, 0.9)' }}>
                <CardContent>
                  <Typography 
                    variant='h6' 
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
              sx={{ 
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'white',
              }}
            />
            <Chip
              label={`Active: ${filteredCustomers.filter(c => c.hasBilledLast3Months).length}`}
              color='success'
              sx={{ 
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'white',
              }}
            />
            <Chip
              label={`Inactive: ${filteredCustomers.filter(c => !c.hasBilledLast3Months).length}`}
              color='error'
              sx={{ 
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'white',
              }}
            />
            {searchTerm && (
              <Chip
                label={`Search Results: ${filteredCustomers.length}`}
                color='info'
                sx={{ 
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: 'white',
                }}
              />
            )}
          </StatsContainer>
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CustomButton
            color='secondary'
            onClick={() => router.push('/')}
            text='Go Back'
          />
        </Box>
      </StyledContainer>
    </Box>
  );
};

export default CustomerAnalytics