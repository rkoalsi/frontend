import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/router';
import { brand } from '../../theme';

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
  /** Navigate to the previous page in history (router.back()) instead of pushing a URL. */
  useBack?: boolean;
};

const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, backUrl, useBack = false }) => {
  const router = useRouter();
  const theme: any = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';

  const handleBack = () => {
    if (useBack) {
      router.back();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      router.push('/');
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        mb: { xs: 1.5, sm: 2 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: { xs: 40, sm: 48 },
      }}
    >
      {showBackButton && (
        <IconButton
          onClick={handleBack}
          sx={{
            position: 'absolute',
            left: { xs: -8, sm: 0, md: 8 },
            color: 'text.primary',
            p: { xs: 0.75, sm: 1 },
            minWidth: { xs: 36, sm: 44 },
            minHeight: { xs: 36, sm: 44 },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: { xs: 18, sm: 22, md: 24 } }} />
        </IconButton>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.25 },
          px: showBackButton ? { xs: 4, sm: 6 } : 0,
        }}
      >
        {/* Brand triangle "ear" motif */}
        <Box
          aria-hidden
          sx={{
            width: { xs: 14, sm: 18 },
            height: { xs: 14, sm: 18 },
            flex: 'none',
            backgroundColor: isDark ? brand.dkYellow : brand.yellow,
            clipPath: 'polygon(50% 6%, 97% 90%, 3% 90%)',
            borderRadius: '3px',
            transform: 'rotate(8deg)',
          }}
        />
        <Typography
          variant={isMobile ? 'h4' : 'h3'}
          sx={{
            color: 'text.primary',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
};

export default Header;
