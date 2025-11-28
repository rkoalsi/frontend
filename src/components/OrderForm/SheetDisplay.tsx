import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  TextField,
  Paper,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  styled,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTheme } from '@emotion/react';
import { ShoppingCart, Refresh } from '@mui/icons-material';

const StyledButton = styled(Button)(({ theme }: any) => ({
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 12,
  padding: '10px 24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
}));

const SheetsDisplay = ({
  googleSheetsLink = '',
  updateCart = () => {},
  recreateSheet = () => {},
  loading = false,
  sort = '',
}: any) => {
  const theme: any = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(googleSheetsLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const openGoogleSheet = () => {
    window.open(googleSheetsLink, '_blank');
  };

  // Responsive width logic
  const getResponsiveWidth = () => {
    if (isMobile) return '100%';
    if (isTablet) return '100%';
    return '800px';
  };

  const getResponsiveMaxWidth = () => {
    if (isMobile) return '100%';
    if (isTablet) return '600px';
    return '800px';
  };

  return (
    <Accordion
      sx={{
        m: 2,
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        backgroundColor: '#ffffff',
        maxWidth: '100%',
        '&:before': {
          display: 'none',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
        sx={{
          px: 3,
          py: 1.5,
          background: 'linear-gradient(135deg, #6B5B95 0%, #554474 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          '&.Mui-expanded': {
            minHeight: 56,
          },
        }}
      >
        <Box display='flex' alignItems='center' gap={1.5}>
          <InsertDriveFileIcon sx={{ fontSize: 32, color: '#4CAF50' }} />
          <Typography variant='h6' fontWeight={700}>
            Order Form Google Sheet Template
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: '#fafafa' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3, md: 3.5 },
            width: getResponsiveWidth(),
            maxWidth: getResponsiveMaxWidth(),
            mx: 'auto',
            borderRadius: 3,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box',
          }}
        >
          <Box display='flex' flexDirection='column' gap={3}>
            <Alert
              severity='info'
              sx={{
                borderRadius: 2,
                border: '1px solid #2196F3',
                backgroundColor: '#E3F2FD',
                '& .MuiAlert-icon': {
                  color: '#1976D2',
                },
              }}
            >
              You can place the order directly below or generate a Google Sheet
              template to share with your customer for easy order input.
            </Alert>
            <Box
              sx={{
                backgroundColor: '#f1f5f9',
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                border: '1px solid #cbd5e1',
              }}
            >
              <Typography variant='subtitle2' fontWeight={700} color='text.primary'>
                Current Sort Order: <Typography component='span' fontWeight={500} color='text.secondary'>{sort}</Typography>
              </Typography>
            </Box>
            <TextField
              fullWidth
              variant='outlined'
              value={googleSheetsLink}
              InputProps={{
                readOnly: true,
                sx: {
                  bgcolor: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                  },
                },
              }}
            />
            <Alert
              severity='warning'
              sx={{
                borderRadius: 2,
                border: '1px solid #FF9800',
                backgroundColor: '#FFF3E0',
                '& .MuiAlert-icon': {
                  color: '#F57C00',
                },
              }}
            >
              On Creation of google Sheet, images will not show. Click on "Allow
              Access" on the sheet to display images on sheet.
            </Alert>

            <Box
              display='flex'
              flexDirection={isMobile ? 'column' : 'row'}
              gap={2}
              flexWrap='wrap'
            >
              <StyledButton
                variant='contained'
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyToClipboard}
                sx={{
                  flexGrow: 1,
                  flexBasis: isMobile ? '100%' : 'calc(50% - 8px)',
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
              >
                Copy Link
              </StyledButton>

              <StyledButton
                variant='outlined'
                onClick={openGoogleSheet}
                sx={{
                  flexGrow: 1,
                  flexBasis: isMobile ? '100%' : 'calc(50% - 8px)',
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: '#f0f7ff',
                  },
                }}
              >
                Open in Google Sheets
              </StyledButton>

              <StyledButton
                variant='contained'
                color='secondary'
                startIcon={<ShoppingCart />}
                onClick={updateCart}
                disabled={loading}
                sx={{
                  flexGrow: 1,
                  flexBasis: isMobile ? '100%' : 'calc(50% - 8px)',
                }}
              >
                Update Cart
              </StyledButton>

              <StyledButton
                variant='contained'
                color='warning'
                startIcon={<Refresh />}
                onClick={recreateSheet}
                disabled={loading}
                sx={{
                  flexGrow: 1,
                  flexBasis: isMobile ? '100%' : 'calc(50% - 8px)',
                }}
              >
                Recreate Sheet
              </StyledButton>
            </Box>
          </Box>
        </Paper>
      </AccordionDetails>
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity='success' variant='filled' sx={{ borderRadius: '8px' }}>
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </Accordion>
  );
};

export default SheetsDisplay;