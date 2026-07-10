import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
import ErrorBoundary from '../src/components/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-quill/dist/quill.snow.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ColorModeProvider, useColorMode } from '../src/context/ColorModeContext';
import { event, isPublicPath, pageview } from '../src/util/gtag';
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

const PAGE_TITLES: Record<string, string> = {
  // Root
  '/': 'Home',
  '/login': 'Login',
  '/forgot_password': 'Forgot Password',
  '/reset_password': 'Reset Password',
  '/customer_requests': 'Customer Requests',
  // Admin
  '/admin': 'Admin Dashboard',
  '/admin/announcements': 'Announcements',
  '/admin/attendance': 'Attendance',
  '/admin/billed_customers': 'Billed Customers',
  '/admin/blog_posts': 'Blog Posts',
  '/admin/brand_leads': 'Brand Leads',
  '/admin/brands': 'Brands',
  '/admin/career_applications': 'Career Applications',
  '/admin/careers': 'Careers',
  '/admin/catalogue_leads': 'Catalogue Leads',
  '/admin/catalogues': 'Catalogues',
  '/admin/chats': 'Chats',
  '/admin/chatbot_customers': 'Chatbot Customers',
  '/admin/contact_submissions': 'Contact Submissions',
  '/admin/customer_activity': 'Customer Activity',
  '/admin/customer_analytics': 'Customer Analytics',
  '/admin/customer_management': 'Customer Management',
  '/admin/customer_requests': 'Customer Requests',
  '/admin/customers': 'Customers',
  '/admin/daily_visits': 'Daily Visits',
  '/admin/employee_management': 'Employee Management',
  '/admin/expected_reorders': 'Expected Reorders',
  '/admin/external_links': 'External Links',
  '/admin/linktree': 'Link Tree',
  '/admin/hooks': 'Hooks',
  '/admin/hooks_categories': 'Hook Categories',
  '/admin/inventory_aging': 'Slow Movers & Dead Stock',
  '/admin/leads': 'Leads',
  '/admin/orders': 'Orders',
  '/admin/payments_due': 'Payments Due',
  '/admin/permissions': 'Permissions',
  '/admin/potential_customers': 'Potential Customers',
  '/admin/products': 'Products',
  '/admin/return_orders': 'Return Orders',
  '/admin/sales_people': 'Sales People',
  '/admin/shipments': 'Shipments',
  '/admin/targeted_customers': 'Targeted Customers',
  '/admin/templates': 'WhatsApp Templates',
  '/admin/segments': 'Customer Segments',
  '/admin/campaigns': 'WhatsApp Campaigns',
  '/admin/whatsapp_analytics': 'WhatsApp Analytics',
  '/admin/training': 'Training',
  '/admin/unbilled_customers': 'Unbilled Customers',
  // Customer portal
  '/customer': 'Dashboard',
  '/customer/account': 'My Account',
  '/customer/analytics': 'Analytics',
  '/customer/credit-notes': 'Credit Notes',
  '/customer/invoices': 'Invoices',
  '/customer/orders': 'My Orders',
  '/customer/orders/[id]': 'Order Details',
  '/customer/payments': 'Payments',
  '/customer/shipments': 'Shipments',
  // Salesperson / field pages
  '/announcements': 'Announcements',
  '/catalogues': 'Catalogues',
  '/catalogues/all_products': 'All Products',
  // '/check_in': 'Check In',
  '/customer_analytics': 'Customer Analytics',
  '/customer_analytics/[id]': 'Customer Analytics',
  '/customer_margins': 'Customer Margins',
  '/daily_visits': 'Daily Visits',
  '/daily_visits/[id]': 'Daily Visit',
  '/expected_reorder': 'Expected Reorders',
  '/external_links': 'External Links',
  '/hooks': 'Hooks',
  '/orders/new/[id]': 'New Order',
  '/orders/past': 'Past Orders',
  '/orders/past/[id]': 'Order Details',
  '/orders/past/payment_due': 'Payment Due',
  '/orders/past/payment_due/[id]': 'Payment Due Details',
  '/potential_customers': 'Potential Customers',
  '/return_orders': 'Return Orders',
  '/shipments': 'Shipments',
  '/shipments/[id]': 'Shipment Details',
  '/targeted_customer': 'Targeted Customers',
  '/training': 'Training',
};

function getPageTitle(pathname: string): string {
  const label = PAGE_TITLES[pathname] ?? 'Pupscribe';
  return label === 'Pupscribe' ? 'Pupscribe' : `${label} | Pupscribe`;
}

export default function MyApp(props: AppProps) {
  useNetworkStatus();
  const { Component, pageProps } = props;
  const router = useRouter();

  // GA4: report a page_view only on public pages (initial load + client-side nav).
  React.useEffect(() => {
    if (!router.isReady || !isPublicPath(router.pathname)) return;
    pageview(router.asPath);
  }, [router.isReady, router.pathname, router.asPath]);

  // GA4: scroll-depth tracking on public pages — fires once per page as the
  // user passes each threshold.
  React.useEffect(() => {
    if (!isPublicPath(router.pathname)) return;
    const thresholds = [25, 50, 75, 100];
    const fired = new Set<number>();
    const onScroll = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) return;
      const percent = Math.min(
        100,
        Math.round((el.scrollTop / scrollable) * 100)
      );
      thresholds.forEach((t) => {
        if (percent >= t && !fired.has(t)) {
          fired.add(t);
          event('scroll_depth', { percent: t, page_path: router.asPath });
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [router.pathname, router.asPath]);

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
              <title>{getPageTitle(router.pathname)}</title>
              <meta name='viewport' content='initial-scale=1, width=device-width' />
            </Head>
            <ThemeWrapper>
              <ToastContainer position='top-left' autoClose={1000} />
              <LayoutComponent>
                <ErrorBoundary key={router.pathname}>
                  <Component {...pageProps} />
                </ErrorBoundary>
              </LayoutComponent>
            </ThemeWrapper>
          </AuthProvider>
        </ColorModeProvider>
      </AppCacheProvider>
    </QueryClientProvider>
  );
}
