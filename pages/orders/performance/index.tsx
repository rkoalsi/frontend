'use client';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Container,
  useTheme,
  useMediaQuery,
  Stack,
  Chip,
  Divider,
  Alert,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  TrendingFlat,
  ShoppingCart,
  CheckCircle,
  Cancel,
  Receipt,
  Schedule,
  Send,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import AuthContext from '../../../src/components/Auth';
import axiosInstance from '../../../src/util/axios';

interface PeriodStats {
  total_count: number;
  total_value: number;
  by_status: Record<string, { count: number; value: number }>;
}

interface PerformanceData {
  this_month: PeriodStats;
  last_month: PeriodStats;
  /** Same elapsed slice of last month — the like-for-like baseline. */
  last_month_to_date?: PeriodStats;
  count_change_pct: number | null;
  value_change_pct: number | null;
  period: { this_month_label: string; last_month_label: string; comparison_label?: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: '#f57c00', icon: Schedule },
  sent: { label: 'Sent', color: '#4633B8', icon: Send },
  accepted: { label: 'Accepted', color: '#388e3c', icon: CheckCircle },
  invoiced: { label: 'Invoiced', color: '#2e7d32', icon: Receipt },
  declined: { label: 'Declined', color: '#d32f2f', icon: Cancel },
};

const formatINR = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

/**
 * Progress against the same point in last month. Matches the homepage rule:
 * green only when genuinely ahead, and a shortfall is shown as a gap to close
 * rather than a red negative — see HomeHeaderCard for the reasoning.
 */
const TrendBadge = ({
  current,
  previous,
  format = (v: number) => String(v),
}: {
  current: number;
  previous: number | null;
  format?: (v: number) => string;
}) => {
  const theme = useTheme();
  if (previous === null || previous <= 0)
    return <Chip label='No comparison for last month' size='small' color='default' />;

  if (current > previous) {
    const pct = Math.round(((current - previous) / previous) * 100);
    return (
      <Chip
        icon={<TrendingUp style={{ fontSize: 16, color: theme.palette.success.main }} />}
        label={`+${pct}% vs same time last month`}
        size='small'
        sx={{
          backgroundColor: alpha(theme.palette.success.main, 0.15),
          color: theme.palette.success.main,
          fontWeight: 700,
          '& .MuiChip-icon': { color: theme.palette.success.main },
        }}
      />
    );
  }

  if (current === previous)
    return (
      <Chip
        icon={<TrendingFlat style={{ fontSize: 16 }} />}
        label='Level with last month'
        size='small'
        color='default'
      />
    );

  return (
    <Chip
      icon={<TrendingFlat style={{ fontSize: 16 }} />}
      label={`${format(previous - current)} to go to match last month`}
      size='small'
      color='default'
      sx={{ fontWeight: 700 }}
    />
  );
};

const StatCard = ({
  label,
  thisMonth,
  lastMonth,
  lastMonthToDate,
  format = (v: number) => String(v),
  highlight = false,
}: {
  label: string;
  thisMonth: number;
  /** Full previous month — shown as context under the badge. */
  lastMonth: number;
  /** The same slice of last month that has elapsed of this one. */
  lastMonthToDate: number | null;
  format?: (v: number) => string;
  highlight?: boolean;
}) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        p: 3,
        borderRadius: 3,
        border: `1px solid ${highlight ? theme.palette.primary.main + '40' : theme.palette.divider}`,
        backgroundColor: highlight ? `${theme.palette.primary.main}05` : 'background.paper',
      }}
    >
      <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant='h4' fontWeight={700} sx={{ my: 1, color: highlight ? 'primary.main' : 'text.primary' }}>
        {format(thisMonth)}
      </Typography>
      <TrendBadge current={thisMonth} previous={lastMonthToDate} format={format} />
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
        Last month, full: {format(lastMonth)}
      </Typography>
    </Paper>
  );
};

const PerformancePage = () => {
  const { user }: any = useContext(AuthContext);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data: res } = await axiosInstance.get('/orders/my-performance', {
        params: { user_id: user._id },
      });
      setData(res);
    } catch {
      setError('Failed to load performance data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchPerformance();
  }, [user, fetchPerformance]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth='md' sx={{ py: 4 }}>
        <Alert severity='error'>{error || 'No data available'}</Alert>
      </Container>
    );
  }

  const allStatuses = Array.from(
    new Set([...Object.keys(data.this_month.by_status), ...Object.keys(data.last_month.by_status)])
  );

  return (
    <Container maxWidth='md' sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            p: { xs: 3, md: 4 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title='Back'>
              <IconButton size='small' onClick={() => router.back()} aria-label='Back' sx={{ color: 'white' }}>
                <ArrowBack />
              </IconButton>
            </Tooltip>
            <ShoppingCart sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>
                My Performance
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9, mt: 0.5 }}>
                {data.period.this_month_label}, compared with the same days of{' '}
                {data.period.last_month_label}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Summary Cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <StatCard
              label='Orders This Month'
              thisMonth={data.this_month.total_count}
              lastMonth={data.last_month.total_count}
              lastMonthToDate={data.last_month_to_date?.total_count ?? null}
              highlight
            />
            <StatCard
              label='Total Value'
              thisMonth={data.this_month.total_value}
              lastMonth={data.last_month.total_value}
              lastMonthToDate={data.last_month_to_date?.total_value ?? null}
              format={formatINR}
            />
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* By Status Breakdown */}
          <Typography variant='h6' fontWeight={700} sx={{ mb: 2 }}>
            Breakdown by Status
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            {allStatuses.map(status => {
              const cfg = STATUS_CONFIG[status] || { label: status, color: '#666', icon: ShoppingCart };
              const Icon = cfg.icon;
              const thisCount = data.this_month.by_status[status]?.count || 0;
              const lastCount = data.last_month.by_status[status]?.count || 0;
              const lastToDate = data.last_month_to_date?.by_status[status]?.count ?? null;
              const thisVal = data.this_month.by_status[status]?.value || 0;

              return (
                <Paper
                  key={status}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${cfg.color}30`,
                    backgroundColor: `${cfg.color}08`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Icon sx={{ fontSize: 18, color: cfg.color }} />
                    <Typography variant='subtitle2' fontWeight={700} sx={{ color: cfg.color }}>
                      {cfg.label}
                    </Typography>
                  </Box>
                  <Typography variant='h4' fontWeight={700} sx={{ color: cfg.color }}>
                    {thisCount}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                    {formatINR(thisVal)}
                  </Typography>
                  <Box sx={{ mt: 0.75 }}>
                    <TrendBadge current={thisCount} previous={lastToDate} />
                  </Box>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                    Last month, full: {lastCount}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PerformancePage;
