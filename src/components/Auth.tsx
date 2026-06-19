import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import axiosInstance from '../util/axios';

interface UserPermissions {
  menu_items: Array<{
    text: string;
    icon: string;
    path: string;
    allowed_roles: string[];
  }>;
  dashboard_sections: string[];
}

interface AuthContextType {
  user: any;
  loading: boolean;
  permissions: UserPermissions | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkRouteAccess: (routePath: string) => Promise<boolean>;
  checkPermission: (resource: string, action?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const router = useRouter();

  const fetchUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('Fetching user permissions...');
      
      // Use axiosInstance which already has the base URL and auth header configured
      const response = await axiosInstance.get('/permissions/user-permissions');
      
      console.log('Permissions response:', response.data);
      
      // Set the permissions - THIS WAS COMMENTED OUT!
      setPermissions({
        menu_items: response.data.menu_items,
        dashboard_sections: response.data.dashboard_sections,
      });
      
      console.log('Permissions set successfully');
      
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // If token is invalid, logout
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logout();
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const base = `${process.env.api_url}`;
      // withCredentials so the browser stores the HttpOnly cookie set by the server
      const res = await axios.post(
        `${base}/users/login`,
        { email, password },
        { withCredentials: true }
      );

      // Issue 6: use the user object returned by the server — no JWT decoding needed
      const { user, access_token } = res.data;
      setUser(user);

      // Keep token in localStorage only as a fallback for header-based auth
      // (HttpOnly cookie is the authoritative session credential)
      if (access_token) {
        localStorage.setItem('token', access_token);
      }

      // Fetch permissions immediately — no setTimeout race condition
      await fetchUserPermissions();

      router.push('/');
      toast.success('You have successfully logged in');
    } catch (error) {
      console.error('Login failed', error);
      toast.error('Invalid Email or Password');
    }
  };

  const logout = async () => {
    setUser(null);
    setPermissions(null);
    localStorage.removeItem('token');
    // Ask the backend to clear the HttpOnly cookie
    try {
      await axiosInstance.post('/users/logout');
    } catch {
      // best-effort
    }
    router.push('/login');
    toast.info('You have been logged out');
  };

  const checkRouteAccess = async (routePath: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.post('/permissions/check-route-access', {
        route_path: routePath
      });
      return response.data.can_access;
    } catch (error) {
      console.error('Error checking route access:', error);
      return false;
    }
  };

  const checkPermission = async (resource: string, action: string = 'read'): Promise<boolean> => {
    try {
      const response = await axiosInstance.post('/permissions/check-permission', {
        resource,
        action
      });
      return response.data.has_permission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  useEffect(() => {
    const { shared = '', id } = router.query;
    const allowedSharedRoute = '/orders/new/[id]';

    // Shared order-form links are accessible without authentication
    if (shared === 'true') {
      const isExactMatch = router.pathname === allowedSharedRoute && !!id;
      if (!isExactMatch) {
        if (router.pathname !== '/login') router.replace('/login');
        setLoading(false);
        return;
      }
      setLoading(false);
      return;
    }

    // Pages that are intentionally public — never check session here
    // NOTE: /orders/new/[id] is NOT here — authenticated users (salesperson/admin)
    // visit that route too and need /me to be called so `user` gets populated.
    // The shared-link case is handled by the `shared === 'true'` block above.
    const PUBLIC_PATHS = [
      '/login',
      '/forgot_password',
      '/reset_password',
      '/catalogues/all_products',
      '/catalogues',
    ];
    if (PUBLIC_PATHS.includes(router.pathname)) {
      setLoading(false);
      return;
    }

    // Issue 8: validate session via the /me endpoint (cookie is sent automatically).
    // Only call /me when we don't already have a user loaded — avoids a network
    // request on every client-side navigation.
    if (!user) {
      axiosInstance
        .get('/users/me')
        .then((res) => {
          setUser(res.data.user);
          fetchUserPermissions();
        })
        .catch(() => {
          // 403/401 → axios interceptor redirects to /login
          // Don't do anything else here to avoid double-redirect
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [router.query, router.pathname]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        loading, 
        permissions, 
        checkRouteAccess, 
        checkPermission 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;