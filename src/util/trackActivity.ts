import axiosInstance from './axios';

export type ActivityAction =
  | 'view_dashboard'
  | 'view_orders_list'
  | 'view_order_detail'
  | 'view_account'
  | 'click_new_order'
  | 'view_catalogues'
  | 'view_training'
  | 'view_expected_reorders';

export type ActivityCategory = 'auth' | 'portal' | 'orders' | 'documents';

interface TrackPayload {
  action: ActivityAction | string;
  category: ActivityCategory;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget customer activity tracker.
 * Sends an event to the backend without blocking the UI.
 * Silently ignores errors (network failures, non-customer accounts, etc.).
 */
export const trackActivity = (payload: TrackPayload): void => {
  axiosInstance.post('/customer_activity/track', payload).catch(() => {
    // Intentionally silent — tracking must never break the user experience
  });
};
