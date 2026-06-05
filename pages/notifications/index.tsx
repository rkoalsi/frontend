import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  Divider,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Skeleton,
} from '@mui/material';
import { DoneAll, ArrowBack, NotificationsNone } from '@mui/icons-material';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { useNotifications, AppNotification } from '../../src/hooks/useNotifications';
import {
  TYPE_LABELS,
  TYPE_CHIP_COLORS,
  TYPE_ACCENT_COLORS,
  NotificationIcon,
} from '../../src/components/common/notificationUtils';

// Server stores naive UTC datetimes (no Z suffix). Append Z so the browser
// always parses them as UTC instead of treating them as local time (IST).
const parseUTC = (ts: string) => new Date(ts.endsWith('Z') ? ts : ts + 'Z');

function groupByDate(items: AppNotification[]) {
  const today: AppNotification[] = [];
  const yesterday: AppNotification[] = [];
  const older: AppNotification[] = [];
  for (const n of items) {
    const d = parseUTC(n.created_at);
    if (isToday(d)) today.push(n);
    else if (isYesterday(d)) yesterday.push(n);
    else older.push(n);
  }
  const groups: { label: string; items: AppNotification[] }[] = [];
  if (today.length) groups.push({ label: 'Today', items: today });
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
  if (older.length) groups.push({ label: 'Earlier', items: older });
  return groups;
}

function NotificationRow({
  n,
  onClick,
  isLast,
}: {
  n: AppNotification;
  onClick: () => void;
  isLast: boolean;
}) {
  const accent = TYPE_ACCENT_COLORS[n.type] ?? '#7c6fcd';
  return (
    <>
      <ListItemButton
        onClick={onClick}
        sx={{
          px: 2.5,
          py: 1.75,
          gap: 1.5,
          alignItems: 'flex-start',
          backgroundColor: n.read ? 'transparent' : 'rgba(124,111,205,0.06)',
          borderLeft: `3px solid ${n.read ? 'transparent' : accent}`,
          transition: 'background-color 0.15s',
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,
            bgcolor: `${accent}22`,
            color: accent,
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          <NotificationIcon type={n.type} />
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
              mb: 0.25,
            }}
          >
            <Typography
              variant='body2'
              fontWeight={n.read ? 400 : 600}
              sx={{ lineHeight: 1.4, flexGrow: 1 }}
            >
              {n.title}
            </Typography>
            <Chip
              label={TYPE_LABELS[n.type] ?? n.type}
              color={TYPE_CHIP_COLORS[n.type] ?? 'default'}
              size='small'
              sx={{ fontSize: '0.65rem', height: 18, flexShrink: 0, mt: 0.25 }}
            />
          </Box>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ lineHeight: 1.45, mb: 0.5 }}
          >
            {n.body}
          </Typography>
          <Typography variant='caption' color='text.disabled'>
            {formatDistanceToNow(parseUTC(n.created_at), { addSuffix: true })}
          </Typography>
        </Box>
      </ListItemButton>
      {!isLast && <Divider component='li' />}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box key={i}>
          <Box sx={{ px: 2.5, py: 1.75, display: 'flex', gap: 1.5 }}>
            <Skeleton variant='circular' width={38} height={38} sx={{ flexShrink: 0 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant='text' width='60%' height={20} />
              <Skeleton variant='text' width='90%' height={16} sx={{ mt: 0.5 }} />
              <Skeleton variant='text' width='30%' height={14} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
          {i < 2 && <Divider />}
        </Box>
      ))}
    </Box>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    total,
    hasMore,
    loading,
    loadMore,
    markRead,
    markAllRead,
    unreadCount,
  } = useNotifications();

  const handleClick = async (n: AppNotification) => {
    if (!n.read) await markRead(n._id);
    if (n.link) router.push(n.link);
  };

  const isEmpty = !loading && notifications.length === 0;
  const groups = groupByDate(notifications);

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 3, px: { xs: 1, sm: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
          <Tooltip title='Back'>
            <IconButton size='small' onClick={() => router.back()}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <Typography variant='h5' fontWeight={700} sx={{ flexGrow: 1 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Tooltip title='Mark all as read'>
              <Button
                size='small'
                startIcon={<DoneAll />}
                onClick={markAllRead}
                variant='outlined'
                sx={{ textTransform: 'none' }}
              >
                Mark all read
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* Loading skeleton */}
        {loading && <LoadingSkeleton />}

        {/* Empty state */}
        {isEmpty && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 10,
              gap: 1.5,
              color: 'text.secondary',
            }}
          >
            <NotificationsNone sx={{ fontSize: 64, opacity: 0.3 }} />
            <Typography variant='body1' fontWeight={500}>
              You&apos;re all caught up
            </Typography>
            <Typography variant='body2' color='text.disabled'>
              No notifications yet
            </Typography>
          </Box>
        )}

        {/* Grouped list */}
        {groups.map((group, gi) => (
          <Box key={group.label} sx={{ mb: gi < groups.length - 1 ? 3 : 0 }}>
            <Typography
              variant='caption'
              fontWeight={600}
              color='text.disabled'
              sx={{
                display: 'block',
                mb: 1,
                px: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {group.label}
            </Typography>
            <Box
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <List disablePadding>
                {group.items.map((n, i) => (
                  <NotificationRow
                    key={n._id}
                    n={n}
                    onClick={() => handleClick(n)}
                    isLast={i === group.items.length - 1}
                  />
                ))}
              </List>
            </Box>
          </Box>
        ))}

        {/* Load more */}
        {hasMore && (
          <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <Button onClick={loadMore} variant='outlined' sx={{ textTransform: 'none' }}>
              Load more
            </Button>
          </Box>
        )}

        {/* Count footer */}
        {total > 0 && (
          <Typography
            variant='caption'
            color='text.disabled'
            sx={{ display: 'block', textAlign: 'center', mt: 2.5 }}
          >
            Showing {notifications.length} of {total}
          </Typography>
        )}
    </Box>
  );
}
