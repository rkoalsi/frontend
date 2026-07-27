import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  TextField,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  styled,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTheme } from '@mui/material/styles';
import { ShoppingCart, Refresh } from '@mui/icons-material';

const StyledButton = styled(Button)(({ theme }: any) => ({
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 12,
  padding: '10px 20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
}));

const SheetsDisplay = ({
  open = false,
  onClose = () => {},
  googleSheetsLink = '',
  createSheet = () => {},
  updateCart = () => {},
  recreateSheet = () => {},
  downloadXlsx = () => {},
  loading = false,
  xlsxLoading = false,
  sort = '',
}: any) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  // Full-screen on phones, centred dialog from tablets up.
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
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        fullWidth
        maxWidth='sm'
        slotProps={{
          paper: {
            sx: {
              borderRadius: isMobile ? 0 : 3,
              m: isMobile ? 0 : 2,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: { xs: 2, sm: 3 },
            py: 1.75,
            background: isDark
              ? 'linear-gradient(135deg, #2a2a38 0%, #1c1c28 100%)'
              : 'linear-gradient(135deg, #4633B8 0%, #37279C 100%)',
            color: 'white',
          }}
        >
          <InsertDriveFileIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: '#4CAF50', flexShrink: 0 }} />
          <Typography
            component='span'
            fontWeight={700}
            sx={{ fontSize: { xs: '1rem', sm: '1.15rem' }, lineHeight: 1.3, flex: 1, minWidth: 0 }}
          >
            {isMobile ? 'Order Sheet' : 'Order Google Sheet Template'}
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label='Close'
            size='small'
            sx={{ color: 'rgba(255,255,255,0.9)', '&:hover': { color: '#fff' } }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display='flex' flexDirection='column' gap={2.5}>
            <Alert severity='info' sx={{ borderRadius: 2 }}>
              You can place the order by adding products to cart below or generate a Google Sheet
              template to share with your customer for easy order input.
            </Alert>

            {googleSheetsLink ? (
              <>
                <Box
                  sx={{
                    backgroundColor: 'action.hover',
                    px: 2.5,
                    py: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant='subtitle2' fontWeight={700} color='text.primary'>
                    Current Sort Order:{' '}
                    <Typography component='span' fontWeight={500} color='text.secondary'>
                      {sort}
                    </Typography>
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  variant='outlined'
                  value={googleSheetsLink}
                  InputProps={{
                    readOnly: true,
                    sx: {
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      borderRadius: 2,
                    },
                  }}
                />

                <Box
                  sx={{
                    display: 'grid',
                    // Single column on phones so the labels never truncate.
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: { xs: 1.25, sm: 2 },
                  }}
                >
                  <StyledButton
                    variant='contained'
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyToClipboard}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': { bgcolor: theme.palette.primary.dark },
                    }}
                  >
                    Copy Link
                  </StyledButton>

                  <StyledButton
                    variant='outlined'
                    startIcon={<OpenInNewIcon />}
                    onClick={openGoogleSheet}
                    sx={{
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        backgroundColor: 'action.hover',
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
                  >
                    Update Cart
                  </StyledButton>

                  <StyledButton
                    variant='contained'
                    color='warning'
                    startIcon={<Refresh />}
                    onClick={recreateSheet}
                    disabled={loading}
                  >
                    Recreate Sheet
                  </StyledButton>

                  <StyledButton
                    variant='contained'
                    startIcon={<DownloadIcon />}
                    onClick={downloadXlsx}
                    disabled={xlsxLoading}
                    sx={{
                      gridColumn: { sm: '1 / -1' },
                      bgcolor: '#2e7d32',
                      color: 'white',
                      '&:hover': { bgcolor: '#1b5e20' },
                    }}
                  >
                    {xlsxLoading ? 'Downloading...' : 'Download XLSX'}
                  </StyledButton>
                </Box>
              </>
            ) : (
              /* No sheet generated for this order yet */
              <Box display='flex' flexDirection='column' alignItems='center' gap={2} py={2}>
                <Typography variant='body2' color='text.secondary' textAlign='center'>
                  No Google Sheet has been generated for this order yet.
                </Typography>
                <StyledButton
                  variant='contained'
                  color='secondary'
                  disabled={loading}
                  onClick={createSheet}
                  startIcon={!loading ? <InsertDriveFileIcon /> : undefined}
                >
                  {loading ? <CircularProgress size={22} color='inherit' /> : 'Generate Order Sheet'}
                </StyledButton>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
};

export default SheetsDisplay;
