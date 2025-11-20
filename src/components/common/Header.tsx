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

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
};

const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, backUrl }) => {
  const router = useRouter();
  const theme: any = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleBack = () => {
    if (backUrl) {
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
            color: 'white',
            p: { xs: 0.75, sm: 1 },
            minWidth: { xs: 36, sm: 44 },
            minHeight: { xs: 36, sm: 44 },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: { xs: 18, sm: 22, md: 24 } }} />
        </IconButton>
      )}
      <Typography
        variant={isMobile ? 'h3' : 'h2'}
        fontWeight='bold'
        sx={{
          color: 'white',
          textAlign: 'center',
          fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          px: showBackButton ? { xs: 4, sm: 6 } : 0,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default Header;
