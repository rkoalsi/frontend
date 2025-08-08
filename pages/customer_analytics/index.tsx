import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  Skeleton,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  Paper,
  styled,
  Grid,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import axios from 'axios';
import AuthContext from '../../src/components/Auth';
import { toast } from 'react-toastify';
import CustomButton from '../../src/components/common/Button';
import Header from '../../src/components/common/Header';

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

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
  borderRadius: 18,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0px 6px 25px rgba(0,0,0,0.3)',
  width: '100%',
  maxWidth: '800px',
  marginBottom: theme.spacing(3),
}));

// Container variants for staggered animations
const listContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

// Card motion variants with a slightly larger hover effect
const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

const CustomerAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerAnalyticsType[]>([]);
  const [filterType, setFilterType] = useState<
    'all' | 'active' | 'inactive' | 'recent'
  >('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  // Navigate to customer details page (if needed)
  const handleCustomerClick = (customerName: string) => {
    // You can implement navigation to customer details if needed
    console.log('Customer clicked:', customerName);
  };

  // Filter customers based on selected dropdown value
  const filteredCustomers = customers.filter((customer) => {
    switch (filterType) {
      case 'active':
        return customer.hasBilledLast3Months;
      case 'inactive':
        return !customer.hasBilledLast3Months;
      case 'recent':
        return customer.hasBilledLastMonth;
      default:
        return true;
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, statusFilter]);

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      sx={{
        width: '100%',
        gap: 2,
        padding: isMobile ? 2 : 4,
      }}
    >
      {/* Reusable Header with Back Button */}
      <Header title='Customer Analytics' showBackButton />

      {/* Filter Controls */}
      <Box
        display='flex'
        gap={2}
        flexWrap='wrap'
        justifyContent='center'
        sx={{ width: '100%', maxWidth: '800px' }}
      >
        {/* Activity Filter */}
        <FormControl
          variant='outlined'
          sx={{ minWidth: isMobile ? 150 : 200, color: 'white' }}
        >
          <InputLabel id='activity-filter-label' sx={{ color: 'white' }}>
            Activity Filter
          </InputLabel>
          <Select
            labelId='activity-filter-label'
            value={filterType}
            label='Activity Filter'
            onChange={(e) =>
              setFilterType(
                e.target.value as 'all' | 'active' | 'inactive' | 'recent'
              )
            }
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
            }}
          >
            <MenuItem value='all'>All Customers</MenuItem>
            <MenuItem value='active'>Active (Billed in Last 3 Months)</MenuItem>
            <MenuItem value='inactive'>Inactive (Not Billed in 3 Months)</MenuItem>
            <MenuItem value='recent'>Recent (Billed Last Month)</MenuItem>
          </Select>
        </FormControl>

        {/* Status Filter */}
        <FormControl
          variant='outlined'
          sx={{ minWidth: isMobile ? 120 : 150, color: 'white' }}
        >
          <InputLabel id='status-filter-label' sx={{ color: 'white' }}>
            Status
          </InputLabel>
          <Select
            labelId='status-filter-label'
            value={statusFilter}
            label='Status'
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
            }}
          >
            <MenuItem value='all'>All</MenuItem>
            <MenuItem value='active'>Active Customers</MenuItem>
            <MenuItem value='inactive'>Inactive Customers</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Customers List */}
      {loading ? (
        <Box sx={{ width: '100%', maxWidth: '800px', mt: 4 }}>
          <Skeleton variant='rectangular' height={150} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' height={150} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' height={150} />
        </Box>
      ) : (
        <StyledPaper>
          {filteredCustomers.length > 0 ? (
            <Box
              component={motion.div}
              variants={listContainerVariants}
              initial='hidden'
              animate='visible'
            >
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={`${customer.customerName}-${index}`}
                  variants={cardVariants}
                  whileHover='hover'
                  whileTap='tap'
                >
                  <ListItem
                    onClick={() => handleCustomerClick(customer.customerName)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: 3,
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      border: '2px solid #475569',
                      borderRadius: 2,
                      mb: 2,
                    }}
                  >
                    {/* Header Row */}
                    <Box
                      display='flex'
                      flexDirection='row'
                      alignItems='center'
                      justifyContent='space-between'
                      sx={{ width: '100%', mb: 2 }}
                    >
                      <Typography variant='h6' fontWeight='bold' color='black'>
                        {index+1}. {customer.customerName}
                      </Typography>
                      <Box display='flex' gap={1} alignItems='center'>
                        <Chip
                          label={customer.status}
                          color={getStatusColor(customer.status)}
                          size='small'
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Chip
                          label={customer.tier === 'UNDEFINED' ? "No Tier" : `Tier ${customer.tier}`}
                          color={getTierColor(customer.tier)}
                          size='small'
                          sx={{ fontWeight: 'bold' }}
                        />
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomerClick(customer.customerName);
                          }}
                          aria-label='view customer details'
                          size='small'
                          color='primary'
                        >
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Customer Details */}
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                      <strong>Address:</strong> {customer.billingAddress}
                    </Typography>

                    {customer.salesPerson && (
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        <strong>Sales Person:</strong> {customer.salesPerson}
                      </Typography>
                    )}

                    {/* Financial Metrics Grid */}
                    <Grid container spacing={2} sx={{ width: '100%', mb: 2 }}>
                      <Grid>
                        <Box textAlign='center'>
                          <Typography variant='caption' color='text.secondary'>
                            Current Month Sales
                          </Typography>
                          <Typography variant='body1' fontWeight='bold' color='primary.main'>
                            {formatCurrency(customer.totalSalesCurrentMonth)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid>
                        <Box textAlign='center'>
                          <Typography variant='caption' color='text.secondary'>
                            Current Year Sales
                          </Typography>
                          <Typography variant='body1' fontWeight='bold' color='success.main'>
                            {formatCurrency(customer.billingTillDateCurrentYear)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid>
                        <Box textAlign='center'>
                          <Typography variant='caption' color='text.secondary'>
                            Last FY Sales
                          </Typography>
                          <Typography variant='body1' fontWeight='bold' color='info.main'>
                            {formatCurrency(customer.totalSalesLastFY)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid>
                        <Box textAlign='center'>
                          <Typography variant='caption' color='text.secondary'>
                            Order Frequency
                          </Typography>
                          <Typography variant='body1' fontWeight='bold' color='warning.main'>
                            {customer.averageOrderFrequencyMonthly.toFixed(1)}/month
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Activity Indicators */}
                    <Box display='flex' gap={1} flexWrap='wrap' sx={{ width: '100%', mb: 1 }}>
                      <Chip
                        label={customer.hasBilledLastMonth ? "Billed Last Month" : "No Bills Last Month"}
                        color={customer.hasBilledLastMonth ? "success" : "default"}
                        size='small'
                        variant={customer.hasBilledLastMonth ? "filled" : "outlined"}
                      />
                      <Chip
                        label={customer.hasBilledLast45Days ? "Active (45 days)" : "Inactive (45 days)"}
                        color={customer.hasBilledLast45Days ? "info" : "default"}
                        size='small'
                        variant={customer.hasBilledLast45Days ? "filled" : "outlined"}
                      />
                      <Chip
                        label={customer.hasBilledLast3Months ? "Active (3 months)" : "Inactive (3 months)"}
                        color={customer.hasBilledLast3Months ? "primary" : "error"}
                        size='small'
                        variant={customer.hasBilledLast3Months ? "filled" : "outlined"}
                      />
                    </Box>

                    {/* Last Bill Date */}
                    <Typography variant='body2' color='text.secondary'>
                      <strong>Last Bill Date:</strong> {
                        customer.lastBillDate
                          ? new Date(customer.lastBillDate).toLocaleDateString('en-IN')
                          : 'No bills found'
                      }
                    </Typography>
                  </ListItem>
                  {index < filteredCustomers.length - 1 && <Divider />}
                </motion.div>
              ))}
            </Box>
          ) : (
            <Typography
              variant='body1'
              align='center'
              sx={{ p: 2, color: 'white' }}
            >
              No customer data available for the selected filters.
            </Typography>
          )}
        </StyledPaper>
      )}

      {/* Summary Stats */}
      {!loading && filteredCustomers.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
            mt: 2
          }}
        >
          <Chip
            label={`Total Customers: ${filteredCustomers.length}`}
            color='primary'
            sx={{ fontWeight: 'bold' }}
          />
          <Chip
            label={`Active: ${filteredCustomers.filter(c => c.hasBilledLast3Months).length}`}
            color='success'
            sx={{ fontWeight: 'bold' }}
          />
          <Chip
            label={`Inactive: ${filteredCustomers.filter(c => !c.hasBilledLast3Months).length}`}
            color='error'
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      )}

      {/* Navigation Buttons */}
      <Box display='flex' justifyContent='center' gap={1} sx={{ mt: 2 }}>
        <CustomButton
          color='secondary'
          onClick={() => router.push('/')}
          text='Go Back'
        />
      </Box>
    </Box>
  );
};

export default CustomerAnalytics;