import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

export function useNetworkStatus() {
  const toastIdRef = useRef<ReturnType<typeof toast> | null>(null);

  useEffect(() => {
    const handleOffline = () => {
      if (!toastIdRef.current || !toast.isActive(toastIdRef.current)) {
        toastIdRef.current = toast.error('No internet connection. Please check your network.', {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          toastId: 'network-offline',
        });
      }
    };

    const handleOnline = () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      toast.success('Internet connection restored.', { autoClose: 3000 });
    };

    const handleConnectionChange = () => {
      const conn = (navigator as any).connection;
      if (!conn) return;
      const slowTypes = ['slow-2g', '2g'];
      if (slowTypes.includes(conn.effectiveType)) {
        if (!toastIdRef.current || !toast.isActive(toastIdRef.current)) {
          toastIdRef.current = toast.warning('Weak or slow internet connection detected.', {
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            toastId: 'network-slow',
          });
        }
      } else {
        if (toastIdRef.current && toast.isActive(toastIdRef.current)) {
          toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
        }
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', handleConnectionChange);
    }

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    } else if (conn) {
      handleConnectionChange();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (conn) {
        conn.removeEventListener('change', handleConnectionChange);
      }
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);
}
