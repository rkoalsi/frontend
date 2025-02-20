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
};

const Header: React.FC<HeaderProps> = ({ title, showBackButton = false }) => {
  const router = useRouter();
  const theme: any = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Box
      sx={{
        position: isMobile ? 'inherit' : 'relative',
        width: '100%',
        mb: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {showBackButton && (
        <IconButton
          onClick={() => router.push('/')}
          sx={{
            position: 'absolute',
            left: { xs: 8, sm: 16 },
            color: 'white',
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      )}
      <Typography
        variant='h4'
        fontWeight='bold'
        sx={{ color: 'white', textAlign: 'center' }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default Header;
