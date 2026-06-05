import React from 'react';
import {
  ShoppingCartOutlined,
  EditOutlined,
  MenuBookOutlined,
  InventoryOutlined,
  AssignmentReturnOutlined,
  PersonAddOutlined,
  LocationOnOutlined,
  SchoolOutlined,
  CampaignOutlined,
  LocalShippingOutlined,
  NotificationsNoneOutlined,
} from '@mui/icons-material';

export const TYPE_LABELS: Record<string, string> = {
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

export const TYPE_CHIP_COLORS: Record<
  string,
  'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
> = {
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

export const TYPE_ACCENT_COLORS: Record<string, string> = {
  order_placed: '#7c6fcd',
  order_edited: '#ffb74d',
  new_catalogue: '#64b5f6',
  product_back_in_stock: '#66bb6a',
  return_order_created: '#D9534F',
  customer_request_submitted: '#9a85c9',
  customer_request_status: '#9a85c9',
  customer_request_comment: '#9a85c9',
  customer_request_reply: '#9a85c9',
  daily_visit_created: '#90caf9',
  daily_visit_updated: '#90caf9',
  daily_visit_comment: '#90caf9',
  new_training: '#64b5f6',
  new_announcement: '#ffb74d',
  shipment_dispatched: '#7c6fcd',
  shipment_delivered: '#66bb6a',
};

const ICONS: Record<string, React.ReactElement> = {
  order_placed: <ShoppingCartOutlined fontSize='small' />,
  order_edited: <EditOutlined fontSize='small' />,
  new_catalogue: <MenuBookOutlined fontSize='small' />,
  product_back_in_stock: <InventoryOutlined fontSize='small' />,
  return_order_created: <AssignmentReturnOutlined fontSize='small' />,
  customer_request_submitted: <PersonAddOutlined fontSize='small' />,
  customer_request_status: <PersonAddOutlined fontSize='small' />,
  customer_request_comment: <PersonAddOutlined fontSize='small' />,
  customer_request_reply: <PersonAddOutlined fontSize='small' />,
  daily_visit_created: <LocationOnOutlined fontSize='small' />,
  daily_visit_updated: <LocationOnOutlined fontSize='small' />,
  daily_visit_comment: <LocationOnOutlined fontSize='small' />,
  new_training: <SchoolOutlined fontSize='small' />,
  new_announcement: <CampaignOutlined fontSize='small' />,
  shipment_dispatched: <LocalShippingOutlined fontSize='small' />,
  shipment_delivered: <LocalShippingOutlined fontSize='small' />,
};

export function NotificationIcon({ type }: { type: string }) {
  return ICONS[type] ?? <NotificationsNoneOutlined fontSize='small' />;
}
