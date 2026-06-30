import React from 'react';
import { Dialog, Box, Typography, Button, CircularProgress } from '@mui/material';
import { keyframes } from '@mui/system';

/**
 * Animated payment result popup.
 *
 * While the payment is being confirmed it shows a spinner ("processing"). Once
 * the server resolves it shows an animated check (success) or cross (failure)
 * drawn with SVG stroke animation, plus a short message. Used by the Review
 * screen after Razorpay Checkout returns.
 */

export type PaymentResult = 'processing' | 'success' | 'failure';

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
  0%   { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

// Compact icon — large enough to read, not overwhelming.
const ICON = 64;

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
  const isProcessing = result === 'processing';
  const isSuccess = result === 'success';
  const color = isSuccess ? '#16a34a' : '#dc2626';

  const heading = isProcessing
    ? 'Processing Payment'
    : isSuccess
    ? 'Payment Successful'
    : 'Payment Failed';

  const defaultMessage = isProcessing
    ? 'Please wait while we confirm your payment and create your order. This can take a few moments — don’t close this window.'
    : isSuccess
    ? 'Your payment was received and the order has been confirmed.'
    : 'Your payment could not be completed. Please try again.';

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onClose}
      slotProps={{ paper: { sx: { borderRadius: 4, p: 1, minWidth: { xs: 280, sm: 360 } } } }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          px: 3,
          py: 3.5,
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: ICON,
            height: ICON,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isProcessing ? (
            <CircularProgress size={ICON - 16} thickness={4} />
          ) : (
            <Box
              component="svg"
              width={ICON}
              height={ICON}
              viewBox="0 0 56 56"
              aria-hidden
              sx={{ animation: `${popIn} 0.4s ease-out` }}
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
          )}
        </Box>

        <Typography
          variant="subtitle1"
          fontWeight={800}
          color={isProcessing ? 'text.primary' : color}
          mt={1}
        >
          {heading}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message || defaultMessage}
        </Typography>

        {!isProcessing && (
          <Button
            variant="contained"
            color={isSuccess ? 'success' : 'error'}
            onClick={onClose}
            sx={{ mt: 2, textTransform: 'none', fontWeight: 700, borderRadius: 24, px: 4 }}
          >
            {isSuccess ? 'Done' : 'Close'}
          </Button>
        )}
      </Box>
    </Dialog>
  );
}
