import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Box,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
  Card,
  LinearProgress,
  Paper,
  Divider,
  Badge,
  alpha,
  useTheme,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Search,
  Visibility,
  ToggleOn,
  ToggleOff,
  TrendingUp,
  TrendingDown,
  Payment,
  Schedule,
  Person,
  BusinessCenter,
  AttachMoney,
  CalendarToday,
  Clear,
  LocationCity,
} from '@mui/icons-material';

interface CustomerTableProps {
  customers: any[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onViewDetails: (customer: any) => void;
  handleToggle: (customer: any) => void;
  searchLoading?: boolean;
  loading?: boolean;
}

const CustomerAnalyticsTable: React.FC<CustomerTableProps> = ({
  customers,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  searchQuery,
  setSearchQuery,
  onViewDetails,
  handleToggle,
  searchLoading = false,
  loading = false
}) => {
  const theme = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTierConfig = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'A+':
        return { color: '#193e1bff', bg: '#e8f5e8', label: 'Super Premium' };
      case 'A':
        return { color: '#2e7d32', bg: '#e8f5e8', label: 'Premium' };
      case 'B':
        return { color: '#ed6c02', bg: '#fff4e6', label: 'Standard' };
      case 'C':
        return { color: '#d32f2f', bg: '#ffebee', label: 'Basic' };
      default:
        return { color: '#757575', bg: '#f5f5f5', label: 'Unrated' };
    }
  };

  const getActivityConfig = (customer: any) => {
    const { hasBilledLastMonth, hasBilledLast45Days, hasBilledLast3Months } = customer;
    if (hasBilledLastMonth)
      return { color: '#2e7d32', bg: '#e8f5e8', label: 'Very Active', intensity: 100 };
    if (hasBilledLast45Days)
      return { color: '#ed6c02', bg: '#fff4e6', label: 'Active', intensity: 75 };
    if (hasBilledLast3Months)
      return { color: '#f57c00', bg: '#fff8e1', label: 'Moderate', intensity: 50 };
    return { color: '#d32f2f', bg: '#ffebee', label: 'Dormant', intensity: 25 };
  };

  const getPaymentStatus = (customer: any) => {
    const hasDue = customer.duePayments && customer.duePayments.length > 0;
    return {
      status: hasDue ? 'Pending' : 'Clear',
      color: hasDue ? '#ed6c02' : '#2e7d32',
      bg: hasDue ? '#fff4e6' : '#e8f5e8',
      count: hasDue ? customer.duePayments.length : 0,
    };
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const highlightSearchTerm = (text: any, searchTerm: string) => {
    // Convert text to string safely (handles arrays, null, undefined)
    const textString = Array.isArray(text) ? text.join(', ') : String(text || '');

    if (!searchTerm || !textString) return textString;

    // Escape special regex characters in searchTerm
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    try {
      const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
      const parts = textString.split(regex);

      return parts.map((part, index) =>
        regex.test(part) ? (
          <Box
            key={index}
            component="span"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              fontWeight: 700,
              borderRadius: 0.5,
              px: 0.5,
            }}
          >
            {part}
          </Box>
        ) : part
      );
    } catch {
      // If regex fails for any reason, return the original text
      return textString;
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
      }}
    >
      {/* Enhanced Search Header */}
      <Box sx={{
        p: 4,
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
      }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search customers by name, sales person, or address... (instant search)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {searchLoading ? (
                  <CircularProgress size={20} thickness={4} />
                ) : (
                  <Search sx={{ color: theme.palette.action.active }} />
                )}
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  edge="end"
                  sx={{ mr: 1 }}
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'white',
              boxShadow: searchLoading
                ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                : '0 2px 8px rgba(0,0,0,0.04)',
              border: 'none',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              },
              '&.Mui-focused': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
              },
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            },
          }}
        />

        {/* Search Results Info */}
        {searchQuery && (
          <Fade in={true}>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {searchLoading ? 'Searching...' : `Found ${totalCount} results for "${searchQuery}"`}
              </Typography>
              {searchLoading && (
                <LinearProgress
                  sx={{
                    width: 100,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }}
                />
              )}
            </Box>
          </Fade>
        )}
      </Box>

     {loading?<CircularProgress/>: <TableContainer component={Paper} elevation={0}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                fontWeight: 700,
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Person sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  <span>Customer Details</span>
                </Stack>
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AttachMoney sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  <span>Sales Performance</span>
                </Stack>
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalendarToday sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  <span>Activity & Payments</span>
                </Stack>
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
                textAlign: 'center',
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 8 }}>
                  <Stack alignItems="center" spacing={2}>
                    <Search sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
                    <Typography variant="h6" color="text.secondary">
                      {searchQuery ? `No customers found for "${searchQuery}"` : 'No customers available'}
                    </Typography>
                    {searchQuery && (
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your search terms or clearing the search
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer, index) => {
                const tierConfig = getTierConfig(customer.tier);
                const activityConfig = getActivityConfig(customer);
                const paymentConfig = getPaymentStatus(customer);
                const growth = calculateGrowth(
                  customer.billingTillDateCurrentYear,
                  customer.totalSalesLastFY
                );

                return (
                  <TableRow
                    key={customer._id || index}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.04)',
                      },
                      transition: 'all 0.2s ease-in-out',
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                    }}
                  >
                    {/* Customer Details Column */}
                    <TableCell sx={{ width: '35%', py: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Badge
                          badgeContent={`Tier ${customer.tier}`}
                          sx={{
                            '& .MuiBadge-badge': {
                              whiteSpace: "nowrap",
                              backgroundColor: tierConfig.color,
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              minWidth: 20,
                              height: 20,
                            },
                          }}
                        >
                          <Avatar
                            sx={{
                              backgroundColor: alpha(tierConfig.color, 0.1),
                              color: tierConfig.color,
                              fontWeight: 700,
                              width: 48,
                              height: 48,
                              fontSize: '1.1rem',
                              border: `2px solid ${alpha(tierConfig.color, 0.2)}`,
                            }}
                          >
                            {customer.customerName?.charAt(0)?.toUpperCase() || '?'}
                          </Avatar>
                        </Badge>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.primary.main,
                              fontSize: '1rem',
                              mb: 0.5,
                            }}
                            noWrap
                          >
                            {highlightSearchTerm(customer.customerName, searchQuery)}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              mb: 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >

                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              mb: 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <LocationCity sx={{ fontSize: 14 }} />
                            {customer.shippingAddress || 'No address provided'}
                          </Typography>

                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip
                              size="small"
                              label={customer.status === 'active' ? 'Active' : 'Inactive'}
                              sx={{
                                backgroundColor: customer.status === 'active' ? '#e8f5e8' : '#ffebee',
                                color: customer.status === 'active' ? '#2e7d32' : '#d32f2f',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 24,
                              }}
                            />
                            <Chip
                              size="small"
                              label={tierConfig.label}
                              sx={{
                                backgroundColor: tierConfig.bg,
                                color: tierConfig.color,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 24,
                              }}
                            />

                            <Chip
                              size="small"
                              icon={<Person sx={{ fontSize: 14 }} />}
                              label={highlightSearchTerm(customer.salesPerson || 'Unassigned', searchQuery)}
                              sx={{
                                backgroundColor: tierConfig.bg,
                                color: tierConfig.color,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 24,
                              }}
                            />

                          </Stack>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Sales Performance Column */}
                    <TableCell sx={{ width: '30%', py: 3 }}>
                      <Stack spacing={2}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                            Current Year Sales
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                            {formatCurrency(customer.billingTillDateCurrentYear || 0)}
                          </Typography>
                        </Paper>

                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                            Current Month
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                            {formatCurrency(customer.totalSalesCurrentMonth || 0)}
                          </Typography>
                        </Box>

                        {growth !== 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {growth > 0 ? (
                              <TrendingUp sx={{ color: '#2e7d32', fontSize: 18 }} />
                            ) : (
                              <TrendingDown sx={{ color: '#d32f2f', fontSize: 18 }} />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                color: growth > 0 ? '#2e7d32' : '#d32f2f',
                                fontWeight: 600,
                              }}
                            >
                              {Math.abs(growth).toFixed(1)}% vs Last FY
                            </Typography>
                          </Box>
                        )}

                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                            Order Frequency: {customer.averageOrderFrequencyMonthly || 0}/month
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((customer.averageOrderFrequencyMonthly || 0) * 25, 100)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              mt: 1,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: theme.palette.primary.main,
                              },
                            }}
                          />
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Activity & Payments Column */}
                    <TableCell sx={{ width: '25%', py: 3 }}>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                            Last Bill Date
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatDate(customer.lastBillDate)}
                          </Typography>
                        </Box>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            backgroundColor: activityConfig.bg,
                            borderRadius: 2,
                            border: `1px solid ${alpha(activityConfig.color, 0.2)}`,
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: activityConfig.color,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ color: activityConfig.color, fontWeight: 600 }}
                            >
                              {activityConfig.label}
                            </Typography>
                          </Stack>
                        </Paper>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Payment sx={{ color: paymentConfig.color, fontSize: 18 }} />
                          <Typography
                            variant="body2"
                            sx={{ color: paymentConfig.color, fontWeight: 600 }}
                          >
                            Payments: {paymentConfig.status}
                          </Typography>
                          {paymentConfig.count > 0 && (
                            <Chip
                              size="small"
                              label={paymentConfig.count}
                              sx={{
                                backgroundColor: '#ffebee',
                                color: '#d32f2f',
                                fontWeight: 600,
                                minWidth: 24,
                                height: 20,
                              }}
                            />
                          )}
                        </Box>

                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {customer.hasBilledLastMonth && (
                            <Chip
                              size="small"
                              label="Last Month"
                              sx={{
                                backgroundColor: '#e8f5e8',
                                color: '#2e7d32',
                                fontSize: '0.65rem',
                                height: 20,
                              }}
                            />
                          )}
                          {customer.hasBilledLast45Days && (
                            <Chip
                              size="small"
                              label="45 Days"
                              sx={{
                                backgroundColor: '#fff4e6',
                                color: '#ed6c02',
                                fontSize: '0.65rem',
                                height: 20,
                              }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell sx={{ width: '10%', py: 3, textAlign: 'center' }}>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Details" arrow>
                          <IconButton
                            size="medium"
                            onClick={() => onViewDetails(customer)}
                            sx={{
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                transform: 'scale(1.05)',
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>}

      <Divider />

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50, 100]}
        sx={{
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          '& .MuiTablePagination-toolbar': {
            paddingX: 3,
            paddingY: 2,
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontWeight: 600,
            color: theme.palette.text.secondary,
          },
        }}
      />
    </Card>
  );
};

export default CustomerAnalyticsTable;