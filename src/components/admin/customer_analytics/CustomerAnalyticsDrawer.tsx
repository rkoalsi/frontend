import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  LinearProgress,
  Alert,
  Fade,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close,
  Person,
  Business,
  TrendingUp,
  TrendingDown,
  Payment,
  Schedule,
  Edit,
  Add,
  Delete,
  LocationOn,
  Phone,
  Email,
  AccountBalance,
  CalendarToday,
  Assessment,
} from '@mui/icons-material';

interface CustomerDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: any;
  openAddDialog: () => void;
  specialMarginProducts: any[];
  onCustomerUpdate: (customer: any) => void;
}

const CustomerDetailsDrawer: React.FC<CustomerDetailsDrawerProps> = ({
  open,
  onClose,
  customer,
  openAddDialog,
  specialMarginProducts,
  onCustomerUpdate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!customer) return null;

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

  const getTierColor = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'A': return '#4caf50';
      case 'B': return '#ff9800';
      case 'C': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const currentYearGrowth = calculateGrowth(
    customer.billingTillDateCurrentYear,
    customer.totalSalesLastFY
  );

  const getActivityScore = () => {
    let score = 0;
    if (customer.hasBilledLastMonth) score += 40;
    if (customer.hasBilledLast45Days) score += 30;
    if (customer.hasBilledLast2Months) score += 20;
    if (customer.hasBilledLast3Months) score += 10;
    return Math.min(score, 100);
  };

  const activityScore = getActivityScore();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100vw', sm: 600, md: 800, lg: 900 },
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Fixed Header */}
      <Paper
        elevation={2}
        sx={{
          position: 'sticky',
          marginTop: 8,
          zIndex: 1,
          borderRadius: 0,
          p: 3,
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar
              sx={{
                backgroundColor: getTierColor(customer.tier),
                color: 'white',
                fontWeight: 'bold',
                width: { xs: 48, sm: 56 },
                height: { xs: 48, sm: 56 },
                fontSize: { xs: '1.2rem', sm: '1.5rem' },
                boxShadow: 3,
              }}
            >
              {customer.tier || '?'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                sx={{
                  fontWeight: 'bold',
                  color: '#1976d2',
                  mb: 0.5,
                  wordBreak: 'break-word',
                }}
              >
                {customer.customerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Sales Person: {customer.salesPerson || 'Unassigned'}
              </Typography>
              <Chip
                size="small"
                label={customer.status}
                color={customer.status === 'active' ? 'success' : 'error'}
                sx={{ fontWeight: 500 }}
              />
            </Box>
          </Box>
          <Tooltip title="Close">
            <IconButton onClick={onClose} size="large" sx={{ ml: 1 }}>
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          pt: 2,
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: 4,
            '&:hover': {
              backgroundColor: '#a1a1a1',
            },
          },
        }}
      >
        {/* Key Metrics Cards */}
        <Fade in timeout={300}>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid>
              <Card
                sx={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%)',
                  border: '1px solid #e3f2fd',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <AccountBalance sx={{ color: '#1976d2', fontSize: 32, mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                    {formatCurrency(customer.billingTillDateCurrentYear || 0).replace('₹', '₹ ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Current Year Sales
                  </Typography>
                  {currentYearGrowth !== 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      {currentYearGrowth > 0 ? (
                        <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />
                      ) : (
                        <TrendingDown sx={{ color: '#f44336', fontSize: 16 }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: currentYearGrowth > 0 ? '#4caf50' : '#f44336',
                          fontWeight: 600,
                        }}
                      >
                        {Math.abs(currentYearGrowth).toFixed(1)}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid>
              <Card
                sx={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #fff3e0 0%, #f8f9fa 100%)',
                  border: '1px solid #fff3e0',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <CalendarToday sx={{ color: '#ff9800', fontSize: 32, mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff9800', mb: 0.5 }}>
                    {formatCurrency(customer.totalSalesCurrentMonth || 0).replace('₹', '₹ ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current Month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid>
              <Card
                sx={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #f8f9fa 100%)',
                  border: '1px solid #e8f5e8',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Assessment sx={{ color: '#4caf50', fontSize: 32, mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 0.5 }}>
                    {customer.averageOrderFrequencyMonthly || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Orders/Month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid>
              <Card
                sx={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f3e5f5 0%, #f8f9fa 100%)',
                  border: '1px solid #f3e5f5',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <TrendingUp sx={{ color: '#9c27b0', fontSize: 32, mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#9c27b0', mb: 0.5 }}>
                    {activityScore}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Activity Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={activityScore}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: '#9c27b0',
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Fade>

        {/* Billing Address */}
        <Fade in timeout={400}>
          <Card sx={{ mb: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationOn sx={{ color: '#1976d2', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  Billing Address
                </Typography>
              </Box>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  lineHeight: 1.6,
                  backgroundColor: '#f8f9fa',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                }}
              >
                {customer.shippingAddress || 'No address provided'}
              </Typography>
            </CardContent>
          </Card>
        </Fade>

        {/* Activity Timeline */}
        <Fade in timeout={500}>
          <Card sx={{ mb: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#1976d2' }}>
                Billing Activity Timeline
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                <Grid>
                  <Box sx={{ textAlign: 'center' }}>
                    <Tooltip title={customer.hasBilledLastMonth ? "Billed in last month" : "No billing in last month"}>
                      <Box
                        sx={{
                          width: { xs: 50, sm: 60 },
                          height: { xs: 50, sm: 60 },
                          borderRadius: '50%',
                          backgroundColor: customer.hasBilledLastMonth ? '#4caf50' : '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          transition: 'all 0.3s ease',
                          boxShadow: customer.hasBilledLastMonth ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Schedule sx={{ color: 'white', fontSize: { xs: 20, sm: 24 } }} />
                      </Box>
                    </Tooltip>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: customer.hasBilledLastMonth ? 'bold' : 'normal',
                        color: customer.hasBilledLastMonth ? '#4caf50' : 'text.secondary',
                        display: 'block',
                      }}
                    >
                      Last Month
                    </Typography>
                  </Box>
                </Grid>
                <Grid>
                  <Box sx={{ textAlign: 'center' }}>
                    <Tooltip title={customer.hasBilledLast45Days ? "Billed in last 45 days" : "No billing in last 45 days"}>
                      <Box
                        sx={{
                          width: { xs: 50, sm: 60 },
                          height: { xs: 50, sm: 60 },
                          borderRadius: '50%',
                          backgroundColor: customer.hasBilledLast45Days ? '#ff9800' : '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          transition: 'all 0.3s ease',
                          boxShadow: customer.hasBilledLast45Days ? '0 4px 12px rgba(255, 152, 0, 0.3)' : 'none',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Schedule sx={{ color: 'white', fontSize: { xs: 20, sm: 24 } }} />
                      </Box>
                    </Tooltip>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: customer.hasBilledLast45Days ? 'bold' : 'normal',
                        color: customer.hasBilledLast45Days ? '#ff9800' : 'text.secondary',
                        display: 'block',
                      }}
                    >
                      45 Days
                    </Typography>
                  </Box>
                </Grid>
                <Grid>
                  <Box sx={{ textAlign: 'center' }}>
                    <Tooltip title={customer.hasBilledLast2Months ? "Billed in last 2 months" : "No billing in last 2 months"}>
                      <Box
                        sx={{
                          width: { xs: 50, sm: 60 },
                          height: { xs: 50, sm: 60 },
                          borderRadius: '50%',
                          backgroundColor: customer.hasBilledLast2Months ? '#ff5722' : '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          transition: 'all 0.3s ease',
                          boxShadow: customer.hasBilledLast2Months ? '0 4px 12px rgba(255, 87, 34, 0.3)' : 'none',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Schedule sx={{ color: 'white', fontSize: { xs: 20, sm: 24 } }} />
                      </Box>
                    </Tooltip>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: customer.hasBilledLast2Months ? 'bold' : 'normal',
                        color: customer.hasBilledLast2Months ? '#ff5722' : 'text.secondary',
                        display: 'block',
                      }}
                    >
                      2 Months
                    </Typography>
                  </Box>
                </Grid>
                <Grid>
                  <Box sx={{ textAlign: 'center' }}>
                    <Tooltip title={customer.hasBilledLast3Months ? "Billed in last 3 months" : "No billing in last 3 months"}>
                      <Box
                        sx={{
                          width: { xs: 50, sm: 60 },
                          height: { xs: 50, sm: 60 },
                          borderRadius: '50%',
                          backgroundColor: customer.hasBilledLast3Months ? '#f44336' : '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          transition: 'all 0.3s ease',
                          boxShadow: customer.hasBilledLast3Months ? '0 4px 12px rgba(244, 67, 54, 0.3)' : 'none',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Schedule sx={{ color: 'white', fontSize: { xs: 20, sm: 24 } }} />
                      </Box>
                    </Tooltip>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: customer.hasBilledLast3Months ? 'bold' : 'normal',
                        color: customer.hasBilledLast3Months ? '#f44336' : 'text.secondary',
                        display: 'block',
                      }}
                    >
                      3 Months
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  Last Bill Date: <strong style={{ color: '#1976d2' }}>{formatDate(customer.lastBillDate)}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>


        {/* Payment Status */}
        {(customer.duePayments?.length > 0 || customer.notDuePayments?.length > 0) && (
          <Fade in timeout={600}>
            <Card sx={{ mb: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Payment sx={{ color: '#1976d2', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    Payment Status
                  </Typography>
                </Box>

                {customer.duePayments?.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>{customer.duePayments.length}</strong> overdue payment(s) require immediate attention
                    </Typography>
                  </Alert>
                )}

                <Grid container spacing={3}>
                  {customer.duePayments?.length > 0 && (
                    <Grid >
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#f44336', mb: 2 }}>
                        🚨 Overdue Payments
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#ffebee' }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {customer.duePayments.map((payment: any, index: number) => (
                              <TableRow key={index} hover>
                                <TableCell sx={{ fontFamily: 'monospace' }}>{payment.invoice_number}</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#f44336' }}>
                                  {formatCurrency(payment.total)}
                                </TableCell>
                                <TableCell>{formatDate(payment.due_date)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}

                  {customer.notDuePayments?.length > 0 && (
                    <Grid >
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 2 }}>
                        ✅ Recent Payments
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#e8f5e8' }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {customer.notDuePayments.slice(0, 5).map((payment: any, index: number) => (
                              <TableRow key={index} hover>
                                <TableCell sx={{ fontFamily: 'monospace' }}>{payment.invoice_number}</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                                  {formatCurrency(payment.total)}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={payment.status}
                                    color={payment.status === 'paid' ? 'success' : 'warning'}
                                    sx={{ fontWeight: 500 }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Fade>
        )}


        {/* Sales History */}
        <Fade in timeout={700}>
          <Card sx={{ mb: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#1976d2' }}>
                Sales History Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid>
                  <Paper
                    elevation={1}
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      background: 'linear-gradient(135deg, #fff3e0 0%, #fff 100%)',
                      borderRadius: 3,
                      border: '1px solid #ffcc02',
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff9800', mb: 1 }}>
                      {formatCurrency(customer.totalSalesPreviousFY || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Previous Financial Year ({new Date().getFullYear() - 2})
                    </Typography>
                  </Paper>
                </Grid>
                <Grid>
                  <Paper
                    elevation={1}
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      background: 'linear-gradient(135deg, #ffebee 0%, #fff 100%)',
                      borderRadius: 3,
                      border: '1px solid #ffcdd2',
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f44336', mb: 1 }}>
                      {formatCurrency(customer.totalSalesLastFY || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last Financial Year ({new Date().getFullYear() - 1})
                    </Typography>
                  </Paper>
                </Grid>
                <Grid>
                  <Paper
                    elevation={1}
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      background: 'linear-gradient(135deg, #e8f5e8 0%, #fff 100%)',
                      borderRadius: 3,
                      border: '1px solid #c8e6c9',
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 1 }}>
                      {formatCurrency(customer.billingTillDateCurrentYear || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Financial Year ({new Date().getFullYear()})
                    </Typography>
                  </Paper>
                </Grid>
                <Grid>
                  <Paper
                    elevation={1}
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      background: 'linear-gradient(135deg, #fff3e0 0%, #fff 100%)',
                      borderRadius: 3,
                      border: '1px solid #ffcc02',
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff9800', mb: 1 }}>
                      {formatCurrency(customer.totalSalesCurrentMonth || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Month ({new Date().getMonth()})
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>
        {/* Bottom Padding */}
        <Box sx={{ height: 24 }} />
      </Box>
    </Drawer>
  );
};

export default CustomerDetailsDrawer;