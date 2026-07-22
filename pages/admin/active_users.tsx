import { useEffect, useRef, useState } from 'react';
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
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Refresh, SensorsOutlined } from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';

const POLL_INTERVAL_MS = 15_000;

interface OnlineUser {
  user_id: string;
  name: string;
  email?: string;
  role: string;
  current_page?: string | null;
  seconds_ago: number;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_person: 'Salesperson',
  sales_admin: 'Sales Admin',
  customer: 'Customer',
  shared_guest: 'Shared Link Guest',
  guest: 'Visitor',
};

const roleLabel = (role: string) =>
  ROLE_LABELS[role] ??
  role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const roleColor = (
  role: string
): 'primary' | 'secondary' | 'info' | 'warning' | 'default' => {
  if (role === 'admin' || role === 'sales_admin') return 'secondary';
  if (role === 'sales_person') return 'info';
  if (role === 'customer') return 'primary';
  if (role === 'shared_guest') return 'warning';
  return 'default';
};

const lastSeenText = (secondsAgo: number) => {
  if (secondsAgo < 10) return 'just now';
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  return `${Math.floor(secondsAgo / 60)}m ago`;
};

const ActiveUsersPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchingRef = useRef(false);

  const fetchPresence = async (showSpinner = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (showSpinner) setRefreshing(true);
    try {
      const res = await axiosInstance.get('/presence/online');
      setUsers(res.data.users || []);
      setRoleCounts(res.data.role_counts || {});
      setOnlineCount(res.data.online_count || 0);
      setLastUpdated(new Date());
    } catch {
      // Silent — keep showing the last good data; next poll retries.
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchPresence();
    }, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchPresence();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SensorsOutlined color='primary' />
          <Typography variant='h5' fontWeight={600}>
            Active Users
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant='caption' color='text.secondary'>
              Updated {lastUpdated.toLocaleTimeString('en-IN')}
            </Typography>
          )}
          <Tooltip title='Refresh now'>
            <IconButton
              size='small'
              onClick={() => fetchPresence(true)}
              disabled={refreshing}
            >
              <Refresh fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stat tiles */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(auto-fit, minmax(160px, 1fr))',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Typography variant='caption' color='text.secondary'>
            Online now
          </Typography>
          <Typography variant='h4' fontWeight={700} color='primary.main'>
            {loading ? '—' : onlineCount}
          </Typography>
        </Paper>
        {Object.entries(roleCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([role, count]) => (
            <Paper key={role} sx={{ p: 2 }}>
              <Typography variant='caption' color='text.secondary'>
                {roleLabel(role)}
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {count}
              </Typography>
            </Paper>
          ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color='text.secondary'>
            No one is online right now. Users appear here within a minute of
            opening the app.
          </Typography>
        </Paper>
      ) : isMobile ? (
        // Mobile: card list
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {users.map((u) => (
            <Paper key={u.user_id} sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <Typography fontWeight={600} noWrap>
                  {u.name || u.email || 'Unknown'}
                </Typography>
                <Chip
                  size='small'
                  label={roleLabel(u.role)}
                  color={roleColor(u.role)}
                />
              </Box>
              {u.current_page && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ wordBreak: 'break-all' }}
                >
                  {u.current_page}
                </Typography>
              )}
              <Typography variant='caption' color='text.secondary'>
                Last seen {lastSeenText(u.seconds_ago)}
              </Typography>
            </Paper>
          ))}
        </Box>
      ) : (
        // Desktop: table
        <TableContainer component={Paper}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Current Page</TableCell>
                <TableCell>Last Seen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user_id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {u.name || u.email || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={roleLabel(u.role)}
                      color={roleColor(u.role)}
                    />
                  </TableCell>
                  <TableCell>{u.email || '-'}</TableCell>
                  <TableCell sx={{ wordBreak: 'break-all' }}>
                    {u.current_page || '-'}
                  </TableCell>
                  <TableCell>{lastSeenText(u.seconds_ago)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ActiveUsersPage;
