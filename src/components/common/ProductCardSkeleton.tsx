import React from 'react';
import { Card, Skeleton, Box } from '@mui/material';

interface ProductCardSkeletonProps {
  variant?: 'card' | 'row';
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ variant = 'card' }) => {
  if (variant === 'row') {
    return (
      <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
        <Skeleton variant="rectangular" width={100} height={100} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} width="60%" />
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} width="40%" />
          <Skeleton variant="text" sx={{ fontSize: '0.875rem' }} width="30%" />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rectangular" width={100} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
      </Box>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        {/* Image skeleton */}
        <Skeleton
          variant="rectangular"
          sx={{
            width: '100%',
            height: 200,
            mb: 2,
            borderRadius: 2
          }}
        />

        {/* Title skeleton */}
        <Skeleton
          variant="text"
          sx={{ fontSize: '1.25rem', mb: 1 }}
          width="90%"
        />
        <Skeleton
          variant="text"
          sx={{ fontSize: '1.25rem', mb: 2 }}
          width="60%"
        />

        {/* Details skeletons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(6)].map((_, index) => (
            <Box
              key={index}
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="30%" />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Footer section */}
      <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
        <Skeleton
          variant="rectangular"
          sx={{ height: 40, mb: 2, borderRadius: 1 }}
        />
        <Skeleton
          variant="rectangular"
          sx={{ height: 48, borderRadius: 1 }}
        />
      </Box>
    </Card>
  );
};

export const ProductGroupCardSkeleton: React.FC = () => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        {/* Group header */}
        <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} width="70%" />
          <Skeleton variant="text" sx={{ fontSize: '0.875rem' }} width="50%" />
        </Box>

        {/* Multiple product skeletons in group */}
        {[...Array(2)].map((_, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              gap: 2,
              p: 1.5,
              mb: 1,
              backgroundColor: 'action.hover',
              borderRadius: 1
            }}
          >
            <Skeleton variant="rectangular" width={80} height={80} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="60%" />
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
        <Skeleton variant="rectangular" sx={{ height: 48, borderRadius: 1 }} />
      </Box>
    </Card>
  );
};

export default ProductCardSkeleton;
