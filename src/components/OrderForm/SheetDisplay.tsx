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
}) => {
  const theme: any = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  return (
    <Accordion
      sx={{
        m: 2,
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: theme.palette.background.paper,
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
        <Typography variant='h6' fontWeight='bold'>
          Google Sheet Template
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Paper
          elevation={4}
          sx={{
            p: 3,
            minWidth: isMobile ? '300px' : '800px',
            mx: 'auto',
            borderRadius: 2,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Box display='flex' flexDirection='column' gap={3}>
            <Box display='flex' alignItems='center' gap={1}>
              <InsertDriveFileIcon color='success' fontSize='large' />
              <Typography variant='h6' fontWeight='bold'>
                Order Form Google Sheet Template
              </Typography>
            </Box>
            <Alert severity='info' sx={{ borderRadius: '8px' }}>
              You can place the order directly below or generate a Google Sheet
              template to share with your customer for easy order input.
            </Alert>

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

            <Box
              display='flex'
              flexDirection={isMobile ? 'column' : 'row'}
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
                  flex: 1,
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
                  flex: 1,
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
                  flex: 1,
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
