import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItemButton,
  Button,
  Divider,
  Tooltip,
  Avatar,
} from '@mui/material';
import { NotificationsOutlined, DoneAll, OpenInNew } from '@mui/icons-material';
import { useNotifications, AppNotification } from '../../hooks/useNotifications';

// Server stores naive UTC datetimes (no Z suffix). Append Z so the browser
// always parses them as UTC instead of treating them as local time (IST).
const parseUTC = (ts: string) => new Date(ts.endsWith('Z') ? ts : ts + 'Z');
import {
  TYPE_ACCENT_COLORS,
  NotificationIcon,
} from './notificationUtils';
import { formatDistanceToNow } from 'date-fns';

const PREVIEW_LIMIT = 10;

const NotificationBell = () => {
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchor);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchor(e.currentTarget);
  };

  const handleClose = () => setAnchor(null);

  const handleClick = async (n: AppNotification) => {
    if (!n.read) await markRead(n._id);
    handleClose();
    if (n.link) router.push(n.link);
  };

  const handleViewAll = () => {
    handleClose();
    router.push('/notifications');
  };

  const preview = notifications.slice(0, PREVIEW_LIMIT);

  return (
    <>
      <Tooltip title='Notifications' arrow>
        <IconButton
          onClick={handleOpen}
          size='small'
          sx={{
            color: 'rgba(255,255,255,0.8)',
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: '8px',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' },
          }}
        >
          <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} color='error' max={99}>
            <NotificationsOutlined fontSize='small' />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='subtitle1' fontWeight={600}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Typography component='span' variant='caption' color='text.secondary'>
                {unreadCount} unread
              </Typography>
            )}
          </Box>
          {unreadCount > 0 && (
            <Tooltip title='Mark all as read'>
              <IconButton size='small' onClick={markAllRead}>
                <DoneAll fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* List */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          {preview.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <NotificationsOutlined sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
              <Typography variant='body2'>No notifications yet</Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {preview.map((n, i) => {
                const accent = TYPE_ACCENT_COLORS[n.type] ?? '#7c6fcd';
                return (
                  <Box key={n._id}>
                    <ListItemButton
                      onClick={() => handleClick(n)}
                      sx={{
                        px: 2,
                        py: 1.25,
                        gap: 1.25,
                        alignItems: 'flex-start',
                        backgroundColor: n.read ? 'transparent' : 'rgba(124,111,205,0.06)',
                        borderLeft: `3px solid ${n.read ? 'transparent' : accent}`,
                        transition: 'background-color 0.15s',
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: `${accent}22`,
                          color: accent,
                          flexShrink: 0,
                          mt: 0.25,
                          fontSize: '0.9rem',
                        }}
                      >
                        <NotificationIcon type={n.type} />
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant='body2'
                          fontWeight={n.read ? 400 : 600}
                          sx={{ lineHeight: 1.35 }}
                          noWrap
                        >
                          {n.title}
                        </Typography>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: 'block', lineHeight: 1.4, mt: 0.25 }}
                          noWrap
                        >
                          {n.body}
                        </Typography>
                        <Typography variant='caption' color='text.disabled'>
                          {formatDistanceToNow(parseUTC(n.created_at), { addSuffix: true })}
                        </Typography>
                      </Box>
                    </ListItemButton>
                    {i < preview.length - 1 && <Divider component='li' />}
                  </Box>
                );
              })}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2, py: 1 }}>
          <Button
            fullWidth
            size='small'
            endIcon={<OpenInNew fontSize='small' />}
            onClick={handleViewAll}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            View all notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
