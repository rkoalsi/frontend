import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const login = async (email: any, password: any) => {
    try {
      const base = `${process.env.api_url}`;
      const res = await axios.post(`${base}/users/login`, {
        email,
        password,
      });
      const { access_token } = res.data;
      const decodedUser: any = jwtDecode(access_token as string);
      setUser(decodedUser);
      localStorage.setItem('token', access_token);
      router.push('/');
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    router.push('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const { shared = '', id } = router.query; // Extract shared and id from query

    const allowedSharedRoute = '/orders/new/[id]'; // Define the exact allowed route

    if (shared === 'true') {
      // Ensure route matches exactly /orders/new/[id] with an id present
      const isExactMatch = router.pathname === allowedSharedRoute && !!id;
      if (!isExactMatch) {
        // Redirect to /login if route is not allowed and prevent navigating to the same URL
        if (router.pathname !== '/login') {
          router.replace('/login');
        }
        return;
      }
      // Allow access if the route is valid
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
      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    }
    setLoading(false);
  }, [router.query, router.pathname]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
