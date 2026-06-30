import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Chip,
  Button,
  LinearProgress,
  Stack,
} from '@mui/material';
import { RefreshOutlined, CampaignOutlined } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const STATUS_COLORS: Record<string, any> = {
  queued: 'default',
  sent: 'info',
  delivered: 'primary',
  read: 'success',
  failed: 'error',
  rate_limit_exceeded: 'warning',
};

const StatCard = ({ label, value, sub, color }: any) => (
  <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, flex: 1, minWidth: 180 }}>
    <Typography variant='caption' color='text.secondary'>{label}</Typography>
    <Typography variant='h4' sx={{ fontWeight: 'bold', color: color || 'text.primary' }}>{value}</Typography>
    {sub && <Typography variant='caption' color='text.secondary'>{sub}</Typography>}
  </Paper>
);

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const WhatsAppAnalyticsPage = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/campaigns/analytics/overview');
      setData(res.data);
    } catch {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }
  if (!data) return null;

  const t = data.totals;
  const byStatus = t.by_status || {};

  return (
    <Box sx={{ padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>WhatsApp Analytics</Typography>
          <Stack direction='row' spacing={1}>
            <Button variant='outlined' startIcon={<CampaignOutlined />} href='/admin/campaigns'>Campaigns</Button>
            <Button variant='outlined' startIcon={<RefreshOutlined />} onClick={fetchData}>Refresh</Button>
          </Stack>
        </Box>
        <Typography variant='body1' sx={{ mb: 3 }} color='text.secondary'>
          Delivery and engagement across all campaign messages.
        </Typography>

        {/* Top-line cards */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <StatCard label='Total messages' value={t.messages} sub={`${data.campaign_count} campaigns`} />
          <StatCard label='Delivered rate' value={pct(t.delivered_rate)} color='primary.main' sub={`${(byStatus.delivered || 0) + (byStatus.read || 0)} delivered`} />
          <StatCard label='Read rate' value={pct(t.read_rate)} color='success.main' sub={`${byStatus.read || 0} read`} />
          <StatCard label='Failed rate' value={pct(t.failed_rate)} color='error.main' sub={`${byStatus.failed || 0} failed`} />
        </Box>

        {/* Status breakdown bar */}
        <Paper variant='outlined' sx={{ p: 2, borderRadius: 3, mb: 4 }}>
          <Typography variant='subtitle2' sx={{ mb: 1.5 }}>Message status breakdown</Typography>
          {Object.keys(byStatus).length === 0 ? (
            <Typography variant='body2' color='text.secondary'>No messages sent yet.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {Object.entries(byStatus)
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([status, count]: any) => (
                  <Box key={status}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Chip size='small' label={status} color={STATUS_COLORS[status] || 'default'} />
                      <Typography variant='body2'>{count} ({pct(t.messages ? count / t.messages : 0)})</Typography>
                    </Box>
                    <LinearProgress
                      variant='determinate'
                      value={t.messages ? (count / t.messages) * 100 : 0}
                      color={STATUS_COLORS[status] === 'default' ? 'inherit' : STATUS_COLORS[status]}
                    />
                  </Box>
                ))}
            </Stack>
          )}
        </Paper>

        {/* Recent campaigns */}
        <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>Recent campaigns</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sent</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Delivered</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Read</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Failed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recent_campaigns.map((c: any) => {
                const s = c.stats || {};
                const delivered = (s.delivered || 0) + (s.read || 0);
                return (
                  <TableRow key={c._id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell>
                    <TableCell><Chip size='small' label={c.status} /></TableCell>
                    <TableCell>{s.total || 0}</TableCell>
                    <TableCell>{delivered}</TableCell>
                    <TableCell>{s.read || 0}</TableCell>
                    <TableCell>{s.failed || 0}</TableCell>
                  </TableRow>
                );
              })}
              {data.recent_campaigns.length === 0 && (
                <TableRow><TableCell colSpan={6} align='center'>No campaigns yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default WhatsAppAnalyticsPage;
