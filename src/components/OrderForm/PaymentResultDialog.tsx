import React from 'react';
import { Dialog, Box, Typography, Button } from '@mui/material';
import { keyframes } from '@mui/system';

/**
 * Animated payment result popup.
 *
 * Shows an animated check (success) or cross (failure) drawn with SVG stroke
 * animation, plus a short message. Used by the Review screen after Razorpay
 * Checkout returns.
 */

export type PaymentResult = 'success' | 'failure';

// Circle outline draws itself, then the tick/cross strokes in.
const drawCircle = keyframes`
  from { stroke-dashoffset: 166; }
  to   { stroke-dashoffset: 0; }
`;
const drawStroke = keyframes`
  from { stroke-dashoffset: 60; }
  to   { stroke-dashoffset: 0; }
`;
const popIn = keyframes`
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

export default function PaymentResultDialog({
  open,
  result,
  message,
  onClose,
}: {
  open: boolean;
  result: PaymentResult | null;
  message?: string;
  onClose: () => void;
}) {
  const isSuccess = result === 'success';
  const color = isSuccess ? '#16a34a' : '#dc2626';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { borderRadius: 4, p: 1, minWidth: { xs: 280, sm: 360 } } } }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          px: 3,
          py: 4,
          gap: 1,
        }}
      >
        <Box
          component="svg"
          width="96"
          height="96"
          viewBox="0 0 56 56"
          aria-hidden
          sx={{ animation: `${popIn} 0.45s ease-out` }}
        >
          <Box
            component="circle"
            cx="28"
            cy="28"
            r="26"
            fill="none"
            stroke={color}
            strokeWidth="3"
            sx={{
              strokeDasharray: 166,
              strokeDashoffset: 166,
              animation: `${drawCircle} 0.5s ease-out forwards`,
            }}
          />
          {isSuccess ? (
            <Box
              component="path"
              d="M16 29 L25 38 L41 19"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{
                strokeDasharray: 60,
                strokeDashoffset: 60,
                animation: `${drawStroke} 0.35s 0.45s ease-out forwards`,
              }}
            />
          ) : (
            <>
              <Box
                component="path"
                d="M19 19 L37 37"
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                sx={{
                  strokeDasharray: 60,
                  strokeDashoffset: 60,
                  animation: `${drawStroke} 0.3s 0.45s ease-out forwards`,
                }}
              />
              <Box
                component="path"
                d="M37 19 L19 37"
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                sx={{
                  strokeDasharray: 60,
                  strokeDashoffset: 60,
                  animation: `${drawStroke} 0.3s 0.7s ease-out forwards`,
                }}
              />
            </>
          )}
        </Box>

        <Typography variant="h6" fontWeight={800} color={color} mt={1}>
          {isSuccess ? 'Payment Successful' : 'Payment Failed'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message ||
            (isSuccess
              ? 'Your payment was received and the order has been confirmed.'
              : 'Your payment could not be completed. Please try again.')}
        </Typography>

        <Button
          variant="contained"
          color={isSuccess ? 'success' : 'error'}
          onClick={onClose}
          sx={{ mt: 2, textTransform: 'none', fontWeight: 700, borderRadius: 24, px: 4 }}
        >
          {isSuccess ? 'Done' : 'Close'}
        </Button>
      </Box>
    </Dialog>
  );
}
