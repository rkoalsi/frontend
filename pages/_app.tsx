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
import PresenceHeartbeat from '../src/components/PresenceHeartbeat';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-quill/dist/quill.snow.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ColorModeProvider, useColorMode } from '../src/context/ColorModeContext';
import { event, isPublicPath, pageview, trackedPath } from '../src/util/gtag';
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
  '/admin/active_users': 'Active Users',
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
  '/admin/cards': 'Business Cards',
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
  const seo = PAGE_SEO[pathname];
  if (seo) return seo.title;
  const label = PAGE_TITLES[pathname] ?? 'Pupscribe';
  return label === 'Pupscribe' ? 'Pupscribe' : `${label} | Pupscribe`;
}

// SEO for the public (indexable) pages. Everything else is behind auth and is
// marked noindex — only these pages should ever appear in Google results.
const SITE_URL = 'https://marketplace.pupscribe.in';

// Public, but deliberately kept out of the index: sign-in and password-reset
// screens have no search value and are thin, near-identical pages. On a young
// subdomain they compete for crawl budget with the pages that matter and read
// as low-value, so they get `noindex, follow` — crawlable (links still pass)
// but never indexed. They are also excluded from public/sitemap.xml.
const NOINDEX_PUBLIC_PATHS = ['/login', '/forgot_password', '/reset_password'];
const DEFAULT_SEO_DESCRIPTION =
  'Pupscribe Marketplace — the online wholesale ordering portal for pet ' +
  'retailers in India. Sign up with just your WhatsApp number to browse the ' +
  'full catalogue of pet food, treats, toys and accessories, check live stock ' +
  'and order direct from the distributor.';
const PAGE_SEO: Record<string, { title: string; description: string }> = {
  // The root URL is what Google surfaces for brand searches, and it now renders
  // the marketing landing (src/components/marketing/GuestLanding) for logged-out
  // visitors, so there is real content behind this title and description.
  //
  // Titles and descriptions carry the terms buyers actually search — "wholesale",
  // "distributor", "for pet retailers" — plus the one-line objection remover:
  // signing up needs nothing but a WhatsApp number.
  '/': {
    title:
      'Wholesale Pet Supplies for Retailers | Order Direct from the Distributor | Pupscribe Marketplace',
    description:
      'Order wholesale pet food, treats, toys and accessories direct from ' +
      'Pupscribe, the distributor. Live stock, invoices, shipment tracking and ' +
      'WhatsApp order updates. Sign up with just a WhatsApp number.',
  },
  '/login': {
    title: 'Login | Pupscribe Marketplace — Wholesale Pet Supplies Ordering',
    description:
      'Sign in to Pupscribe Marketplace to place wholesale pet supply orders, ' +
      'check live stock and track your deliveries. New here? Register your pet ' +
      'store or create a bulk-buyer account in minutes.',
  },
  '/register': {
    title:
      'Register Your Pet Store | Wholesale Pet Supplies Supplier for Retailers | Pupscribe',
    description:
      'Register your pet shop with Pupscribe in under a minute — all you need ' +
      'is a WhatsApp number. Order pet food, treats, toys and accessories at ' +
      'wholesale rates, with GST invoicing and live stock across every brand.',
  },
  '/distributors': {
    title:
      'Become a Distribution Partner | Pet Food, Cat Litter & Grooming Distributors | Pupscribe',
    description:
      'Pupscribe is onboarding pet food distributors, dog and cat food ' +
      'distributors, cat litter distributors and grooming (dog/cat shampoo) ' +
      'distributors across India — and any other pet category. Register your ' +
      'brand to distribute through the Pupscribe Marketplace.',
  },
  '/catalogues': {
    title:
      'Pet Product Catalogues | Wholesale Pet Food, Treats & Accessories | Pupscribe',
    description:
      'Browse Pupscribe brand catalogues — wholesale dog food, cat food, treats, ' +
      'toys, grooming and pet accessories available to retailers and bulk buyers ' +
      'across India.',
  },
  '/catalogues/all_products': {
    title:
      'All Products | Wholesale Pet Supplies Price List for Retailers | Pupscribe',
    description:
      'Explore the full Pupscribe range of pet food, treats, chews, toys, ' +
      'grooming products and accessories available to order wholesale by pet ' +
      'shops, breeders and bulk buyers in India.',
  },
  '/forgot_password': {
    title: 'Forgot Password | Pupscribe Marketplace',
    description: DEFAULT_SEO_DESCRIPTION,
  },
  '/reset_password': {
    title: 'Reset Password | Pupscribe Marketplace',
    description: DEFAULT_SEO_DESCRIPTION,
  },
};

// Organization + WebSite structured data so Google associates the
// "Pupscribe Marketplace" name with this domain.
const STRUCTURED_DATA = JSON.stringify([
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pupscribe Marketplace',
    alternateName: ['Pupscribe B2B Marketplace', 'Pupscribe Order Portal'],
    url: SITE_URL,
    description: DEFAULT_SEO_DESCRIPTION,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pupscribe',
    url: 'https://pupscribe.in',
    sameAs: [SITE_URL],
    description:
      'Pupscribe is a pet product distributor in India, supplying pet food, ' +
      'treats, toys, grooming products and accessories to pet retailers and ' +
      'bulk buyers through its online marketplace.',
    areaServed: { '@type': 'Country', name: 'India' },
    knowsAbout: [
      'Wholesale pet supplies',
      'Pet food distribution',
      'Bulk pet product ordering',
      'Pet retail supply',
    ],
  },
]);

export default function MyApp(props: AppProps) {
  useNetworkStatus();
  const { Component, pageProps } = props;
  const router = useRouter();

  // GA4: report a page_view on every page (initial load + client-side nav).
  // trackedPath() reduces authenticated routes to their route pattern so no
  // order/customer IDs are sent.
  React.useEffect(() => {
    if (!router.isReady) return;
    pageview(trackedPath(router.pathname, router.asPath));
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

  // Public digital business cards render on their own — no nav, no sidebar.
  const isBareRoute = props.router?.pathname === '/cards/[id]';

  const getLayoutComponent = () => {
    if (isBareRoute) return React.Fragment;
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
              {NOINDEX_PUBLIC_PATHS.includes(router.pathname) ? (
                // Public utility screens: crawlable so their links still count,
                // but never indexed. Description kept for link previews.
                <>
                  <meta name='robots' content='noindex, follow' />
                  <meta
                    name='description'
                    content={
                      PAGE_SEO[router.pathname]?.description ??
                      DEFAULT_SEO_DESCRIPTION
                    }
                  />
                </>
              ) : isPublicPath(router.pathname) || router.pathname === '/' ? (
                <>
                  <meta
                    name='description'
                    content={
                      PAGE_SEO[router.pathname]?.description ??
                      DEFAULT_SEO_DESCRIPTION
                    }
                  />
                  <link rel='canonical' href={`${SITE_URL}${router.pathname}`} />
                  <meta property='og:site_name' content='Pupscribe Marketplace' />
                  <meta property='og:type' content='website' />
                  <meta property='og:title' content={getPageTitle(router.pathname)} />
                  <meta
                    property='og:description'
                    content={
                      PAGE_SEO[router.pathname]?.description ??
                      DEFAULT_SEO_DESCRIPTION
                    }
                  />
                  <meta property='og:url' content={`${SITE_URL}${router.pathname}`} />
                  <script
                    type='application/ld+json'
                    dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }}
                  />
                </>
              ) : (
                // Authenticated pages: keep them out of search results.
                <meta name='robots' content='noindex, nofollow' />
              )}
            </Head>
            <PresenceHeartbeat />
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
