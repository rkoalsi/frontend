import * as React from 'react';
import Head from 'next/head';
import { AppProps } from 'next/app';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../src/theme';
import { AuthProvider } from '../src/components/Auth';
import Layout from '../src/components/Layout';
import AdminLayout from '../src/components/AdminLayout'; // Import AdminLayout
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import react-toastify styles

export default function MyApp(props: AppProps) {
  const { Component, pageProps } = props;

  const isAdminRoute = props.router?.pathname.startsWith('/admin');

  return (
    <AppCacheProvider {...props}>
      <AuthProvider>
        <Head>
          <meta name='viewport' content='initial-scale=1, width=device-width' />
        </Head>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastContainer position='top-left' autoClose={1000} />
          {isAdminRoute ? (
            <AdminLayout>
              <Component {...pageProps} />
            </AdminLayout>
          ) : (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
        </ThemeProvider>
      </AuthProvider>
    </AppCacheProvider>
  );
}
