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
  ListItemText,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  NotificationsOutlined,
  DoneAll,
  OpenInNew,
} from '@mui/icons-material';
import { useNotifications, AppNotification } from '../../hooks/useNotifications';
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
          <Badge
            badgeContent={unreadCount > 0 ? unreadCount : undefined}
            color='error'
            max={99}
          >
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
            width: 360,
            maxHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
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
          <Typography variant='subtitle1' fontWeight={600}>
            Notifications
            {unreadCount > 0 && (
              <Typography
                component='span'
                variant='caption'
                sx={{ ml: 1, color: 'text.secondary' }}
              >
                {unreadCount} unread
              </Typography>
            )}
          </Typography>
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
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant='body2' color='text.secondary'>
                No notifications yet
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {preview.map((n, i) => (
                <Box key={n._id}>
                  <ListItemButton
                    onClick={() => handleClick(n)}
                    sx={{
                      px: 2,
                      py: 1.25,
                      backgroundColor: n.read ? 'transparent' : 'action.hover',
                      '&:hover': { backgroundColor: 'action.selected' },
                    }}
                  >
                    {!n.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          mr: 1.5,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <ListItemText
                      inset={n.read}
                      primary={
                        <Typography
                          variant='body2'
                          fontWeight={n.read ? 400 : 600}
                          sx={{ lineHeight: 1.3 }}
                        >
                          {n.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            component='span'
                            variant='caption'
                            color='text.secondary'
                            sx={{ display: 'block' }}
                          >
                            {n.body}
                          </Typography>
                          <Typography
                            component='span'
                            variant='caption'
                            color='text.disabled'
                          >
                            {formatDistanceToNow(new Date(n.created_at), {
                              addSuffix: true,
                            })}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                  {i < preview.length - 1 && <Divider component='li' />}
                </Box>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 1,
          }}
        >
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
