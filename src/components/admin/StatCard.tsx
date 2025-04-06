// src/components/StatCard.tsx
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
} from '@mui/material';
import { useRouter } from 'next/router';
import { JSX } from 'react';

interface SubStat {
  label: string;
  value: number;
  color: string;
}

interface CardProps {
  label: string;
  route: string;
  value?: number;
  subStats?: SubStat[];
  icon?: JSX.Element;
}

const StatCard: React.FC<CardProps> = ({
  label,
  route,
  value,
  subStats,
  icon,
}) => {
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push(`/admin/${route}`)}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-3px)',
        },
        transition: 'all 0.3s ease',
        height: '100%',
      }}
    >
      <CardContent>
        <Box display='flex' alignItems='center' mb={2}>
          {icon && <Box mr={1}>{icon}</Box>}
          <Typography
            variant='h6'
            color='primary'
            sx={{ fontWeight: 'bold', flexGrow: 1 }}
          >
            {label}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {subStats ? (
          <Grid container spacing={2}>
            {subStats.map((sub, idx) => (
              <Box>
                <Box textAlign='center'>
                  <Typography variant='body2' color='textSecondary'>
                    {sub.label}
                  </Typography>
                  <Typography
                    variant='h5'
                    color={sub.color}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {sub.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Grid>
        ) : (
          <Box textAlign='center'>
            <Typography
              variant='h4'
              color='success.main'
              sx={{ fontWeight: 'bold' }}
            >
              {value}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
