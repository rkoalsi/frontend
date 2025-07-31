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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTheme } from '@emotion/react';
import { ShoppingCart } from '@mui/icons-material';

const SheetsDisplay = ({
  googleSheetsLink = '',
  updateCart = () => {},
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
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: theme.palette.background.paper,
        maxWidth: '100%', // Prevent overflow
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
        sx={{
          px: 2,
          py: 1,
          bgcolor: theme.palette.secondary.dark,
          color: 'white',
          borderRadius: '8px',
        }}
      >
        <Box display='flex' alignItems='center' gap={1}>
          <InsertDriveFileIcon color='success' fontSize='large' />
          <Typography variant='h6' fontWeight='bold'>
            Order Form Google Sheet Template
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            width: getResponsiveWidth(),
            maxWidth: getResponsiveMaxWidth(),
            mx: 'auto',
            borderRadius: 2,
            backgroundColor: theme.palette.background.default,
            boxSizing: 'border-box', // Include padding in width calculation
          }}
        >
          <Box display='flex' flexDirection='column' gap={3}>
            <Alert severity='info' sx={{ borderRadius: '8px' }}>
              You can place the order directly below or generate a Google Sheet
              template to share with your customer for easy order input.
            </Alert>
            <Typography>Current Sort Order: {sort}</Typography>
            <TextField
              fullWidth
              variant='outlined'
              value={googleSheetsLink}
              InputProps={{
                readOnly: true,
                sx: {
                  bgcolor: '#f5f5f5',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  borderRadius: '8px',
                },
              }}
            />
            <Alert severity='warning' sx={{ borderRadius: '8px' }}>
              On Creation of google Sheet, images will not show. Click on "Allow
              Access" on the sheet to display images on sheet.
            </Alert>

            <Box
              display='flex'
              flexDirection={isMobile ? 'column' : isTablet ? 'column' : 'row'}
              gap={2}
            >
              <Button
                variant='contained'
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyToClipboard}
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '24px',
                  flexGrow: { xs: 1, md: 1 },
                  flexShrink: 0,
                  bgcolor: theme.palette.primary.dark,
                  color: 'white',
                }}
              >
                Copy Link
              </Button>

              <Button
                variant='outlined'
                onClick={openGoogleSheet}
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '24px',
                  flexGrow: { xs: 1, md: 1 },
                  flexShrink: 0,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                }}
              >
                Open in Google Sheets
              </Button>
              <Button
                variant='contained'
                color='secondary'
                startIcon={<ShoppingCart />}
                onClick={updateCart}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '24px',
                  flexGrow: { xs: 1, md: 1 },
                  flexShrink: 0,
                  bgcolor: theme.palette.secondary.main,
                }}
              >
                Update Cart
              </Button>
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