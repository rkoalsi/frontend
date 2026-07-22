import { useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AuthContext from './Auth';
import axiosInstance from '../util/axios';

const HEARTBEAT_INTERVAL_MS = 45_000;
const VISITOR_ID_KEY = 'pupscribe_visitor_id';

/** Stable anonymous id for guests (shared links / public pages). */
const getVisitorId = (): string => {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode) — per-session id is fine
    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
};

/**
 * Invisible presence beacon so admins can see who is using the app in real
 * time at /admin/active_users.
 *
 * - Logged-in users (any role): POST /presence/heartbeat (JWT).
 * - Anonymous visitors — shared order links (?shared=true) and public pages
 *   (login, register, catalogues, blog...): POST /presence/heartbeat/guest
 *   identified by a localStorage visitor id.
 *
 * Fire-and-forget — errors are silently ignored so presence tracking can
 * never break the user experience (same contract as trackActivity).
 */
const PresenceHeartbeat = () => {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  // Refs so the interval callback always sees current values without
  // re-creating the interval on every route change.
  const pathRef = useRef(router.pathname);
  pathRef.current = router.pathname;
  const sharedRef = useRef(router.query.shared === 'true');
  sharedRef.current = router.query.shared === 'true';
  const lastSentRef = useRef(0);

  // Guest pings only start once the session check has finished, so a
  // logged-in user is never briefly counted as a guest while /me resolves.
  const mode = user ? 'auth' : !loading ? 'guest' : null;

  useEffect(() => {
    if (!mode) return;

    const ping = () => {
      if (document.visibilityState !== 'visible') return;
      lastSentRef.current = Date.now();
      const req =
        mode === 'auth'
          ? axiosInstance.post('/presence/heartbeat', {
              current_page: pathRef.current,
            })
          : axiosInstance.post('/presence/heartbeat/guest', {
              visitor_id: getVisitorId(),
              current_page: pathRef.current,
              shared: sharedRef.current,
            });
      req.catch(() => {
        // Intentionally silent
      });
    };

    ping(); // announce immediately on load / login
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    // When the user returns to the tab after being away, ping right away
    // (but not if a regular ping just went out).
    const onVisibility = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastSentRef.current > 10_000
      ) {
        ping();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [mode]);

  // Lightweight page-change ping so "current page" stays fresh for admins,
  // throttled to at most one extra request per 10s.
  useEffect(() => {
    if (!mode) return;
    if (Date.now() - lastSentRef.current <= 10_000) return;
    if (document.visibilityState !== 'visible') return;
    lastSentRef.current = Date.now();
    const req =
      mode === 'auth'
        ? axiosInstance.post('/presence/heartbeat', {
            current_page: router.pathname,
          })
        : axiosInstance.post('/presence/heartbeat/guest', {
            visitor_id: getVisitorId(),
            current_page: router.pathname,
            shared: router.query.shared === 'true',
          });
    req.catch(() => {
      // Intentionally silent
    });
  }, [mode, router.pathname]);

  return null;
};

export default PresenceHeartbeat;
