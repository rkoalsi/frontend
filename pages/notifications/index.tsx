import { useContext } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DoneAll, ArrowBack, NotificationsNone } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import Layout from '../../src/components/Layout';
import AuthContext from '../../src/components/Auth';
import { useNotifications, AppNotification } from '../../src/hooks/useNotifications';

const TYPE_LABELS: Record<string, string> = {
  order_placed: 'Order',
  order_edited: 'Order',
  new_catalogue: 'Catalogue',
  product_back_in_stock: 'Stock',
  return_order_created: 'Returns',
  customer_request_submitted: 'Requests',
  customer_request_status: 'Requests',
  customer_request_comment: 'Requests',
  customer_request_reply: 'Requests',
  daily_visit_created: 'Daily Visit',
  daily_visit_updated: 'Daily Visit',
  daily_visit_comment: 'Daily Visit',
  new_training: 'Training',
  new_announcement: 'Announcement',
  shipment_dispatched: 'Shipment',
  shipment_delivered: 'Shipment',
};

const TYPE_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  order_placed: 'primary',
  order_edited: 'warning',
  new_catalogue: 'info',
  product_back_in_stock: 'success',
  return_order_created: 'error',
  customer_request_submitted: 'secondary',
  customer_request_status: 'secondary',
  customer_request_comment: 'secondary',
  customer_request_reply: 'secondary',
  daily_visit_created: 'default',
  daily_visit_updated: 'default',
  daily_visit_comment: 'default',
  new_training: 'info',
  new_announcement: 'warning',
  shipment_dispatched: 'primary',
  shipment_delivered: 'success',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user }: any = useContext(AuthContext);
  const {
    notifications,
    total,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
    unreadCount,
  } = useNotifications();

  const handleClick = async (n: AppNotification) => {
    if (!n.read) await markRead(n._id);
    if (n.link) router.push(n.link);
  };

  const isLoading = notifications.length === 0 && total === 0;

  return (
    <>
      <Box sx={{ maxWidth: 680, mx: 'auto', py: 3, px: { xs: 1, sm: 2 } }}>
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
                sx={{ textTransform: 'none' }}
              >
                Mark all read
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* Empty state */}
        {!isLoading && notifications.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 8,
              gap: 2,
              color: 'text.secondary',
            }}
          >
            <NotificationsNone sx={{ fontSize: 56, opacity: 0.35 }} />
            <Typography>You're all caught up</Typography>
          </Box>
        )}

        {/* List */}
        {notifications.length > 0 && (
          <Box
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <List disablePadding>
              {notifications.map((n, i) => (
                <Box key={n._id}>
                  <ListItemButton
                    onClick={() => handleClick(n)}
                    sx={{
                      px: 2.5,
                      py: 2,
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
                          mr: 2,
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      />
                    )}
                    <ListItemText
                      inset={n.read}
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          <Typography
                            variant='body1'
                            fontWeight={n.read ? 400 : 600}
                            sx={{ flexGrow: 1 }}
                          >
                            {n.title}
                          </Typography>
                          <Chip
                            label={TYPE_LABELS[n.type] ?? n.type}
                            color={TYPE_COLORS[n.type] ?? 'default'}
                            size='small'
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            component='span'
                            variant='body2'
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
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                  {i < notifications.length - 1 && <Divider component='li' />}
                </Box>
              ))}
            </List>
          </Box>
        )}

        {/* Load more */}
        {hasMore && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button onClick={loadMore} variant='outlined' sx={{ textTransform: 'none' }}>
              Load more
            </Button>
          </Box>
        )}

        {/* Total count */}
        {total > 0 && (
          <Typography
            variant='caption'
            color='text.disabled'
            sx={{ display: 'block', textAlign: 'center', mt: 2 }}
          >
            {notifications.length} of {total} notifications
          </Typography>
        )}
      </Box>
    </>
  );
}
