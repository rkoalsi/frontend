import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
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
      const res = await axios.post(`${base}/users/login`, {
        email,
        password,
      });
      const { access_token, user_data } = res.data;
      
      // Decode token to get user info
      const decodedUser: any = jwtDecode(access_token as string);
      setUser(decodedUser);
      localStorage.setItem('token', access_token);
      
      // Fetch user permissions after login
      setTimeout(async () => {
        await fetchUserPermissions();
      }, 100);
      
      router.push('/');
      toast.success(`You have successfully logged in`);
    } catch (error) {
      console.error('Login failed', error);
      toast.error(`Invalid Email or Password`);
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions(null);
    localStorage.removeItem('token');
    router.push('/login');
    toast.info(`You have been logged out`);
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
    const token = localStorage.getItem('token');
    const { shared = '', id } = router.query;

    const allowedSharedRoute = '/orders/new/[id]';

    if (shared === 'true') {
      const isExactMatch = router.pathname === allowedSharedRoute && !!id;
      if (!isExactMatch) {
        if (router.pathname !== '/login') {
          router.replace('/login');
        }
        return;
      }
      setLoading(false);
      return;
    }

    if (token) {
      try {
        const decodedUser: any = jwtDecode(token);
        if (decodedUser.exp * 1000 < Date.now()) {
          console.log('Token expired');
          logout();
          return;
        }
        setUser(decodedUser);
        fetchUserPermissions();
      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    }
    setLoading(false);
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