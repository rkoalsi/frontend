import * as React from 'react';
import Head from 'next/head';
import { AppProps } from 'next/app';
import { useNetworkStatus } from '../src/util/useNetworkStatus';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../src/theme';
import { AuthProvider } from '../src/components/Auth';
import Layout from '../src/components/Layout';
import AdminLayout from '../src/components/AdminLayout';
import CustomerLayout from '../src/components/CustomerLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-quill/dist/quill.snow.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ColorModeProvider, useColorMode } from '../src/context/ColorModeContext';
import axios from 'axios';

// Global axios defaults: send cookies and Authorization header on every request
// This covers pages that use raw `axios` directly (not axiosInstance).
axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { mode } = useColorMode();
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function MyApp(props: AppProps) {
  useNetworkStatus();
  const { Component, pageProps } = props;

  const isAdminRoute = props.router?.pathname.startsWith('/admin');
  const isCustomerRoute =
    props.router?.pathname === '/customer' ||
    props.router?.pathname.startsWith('/customer/');

  const getLayoutComponent = () => {
    if (isAdminRoute) return AdminLayout;
    if (isCustomerRoute) return CustomerLayout;
    return Layout;
  };

  const LayoutComponent = getLayoutComponent();

  return (
    <QueryClientProvider client={queryClient}>
      <AppCacheProvider {...props}>
        <ColorModeProvider>
          <AuthProvider>
            <Head>
              <meta name='viewport' content='initial-scale=1, width=device-width' />
            </Head>
            <ThemeWrapper>
              <ToastContainer position='top-left' autoClose={1000} />
              <LayoutComponent>
                <Component {...pageProps} />
              </LayoutComponent>
            </ThemeWrapper>
          </AuthProvider>
        </ColorModeProvider>
      </AppCacheProvider>
    </QueryClientProvider>
  );
}
