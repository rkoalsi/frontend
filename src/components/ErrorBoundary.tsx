import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught a render error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2,
            p: 3,
            textAlign: 'center',
          }}
        >
          <ErrorOutlineIcon color='error' sx={{ fontSize: 56 }} />
          <Typography variant='h6'>Something went wrong</Typography>
          <Typography variant='body2' color='text.secondary'>
            This page hit an unexpected error. You can try again or reload the
            page.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant='contained' onClick={this.handleRetry}>
              Try Again
            </Button>
            <Button variant='outlined' onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
