import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_BASE_URL;
const POLL_INTERVAL = 30_000; // 30 seconds

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/api/notifications/unread-count`);
      setUnreadCount(res.data.count ?? 0);
    } catch {
      // silently ignore — badge just stays stale
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNum = 0, replace = true) => {
    try {
      const res = await axios.get(`${BASE}/api/notifications`, {
        params: { page: pageNum, limit: 20 },
      });
      const { notifications: items, total: tot } = res.data;
      setTotal(tot);
      setHasMore((pageNum + 1) * 20 < tot);
      setNotifications(prev => replace ? items : [...prev, ...items]);
      setUnreadCount(items.filter((n: AppNotification) => !n.read).length);
    } catch {
      // ignore
    }
  }, []);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    fetchNotifications(next, false);
  }, [page, fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    try {
      await axios.patch(`${BASE}/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await axios.patch(`${BASE}/api/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications(0, true);
    timerRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    total,
    hasMore,
    fetchNotifications,
    loadMore,
    markRead,
    markAllRead,
  };
}
