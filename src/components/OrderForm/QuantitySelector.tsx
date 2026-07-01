import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, IconButton, TextField, useMediaQuery,   useTheme } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

interface QuantitySelectorProps {
  quantity: number;
  max: number;
  onChange: (newQuantity: number) => void;
  disabled?: boolean;
  step?: number;
}

// Debounce window before a typed value is pushed to the parent while the
// field is still focused. Blur/Enter flush immediately, so this only affects
// live-typing updates.
const COMMIT_DELAY = 400;

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  max,
  onChange,
  disabled = false,
  step = 1,
}) => {
  const theme = useTheme()
  const [inputValue, setInputValue] = useState<string>(quantity ? quantity.toString() : '');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Track focus + latest quantity so the debounced commit and the prop-sync
  // effect don't fight the user's keystrokes.
  const isFocusedRef = useRef(false);
  const quantityRef = useRef(quantity);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync the visible text from the parent, but never while the user is
  // actively editing (otherwise clamping would overwrite mid-typed values).
  useEffect(() => {
    quantityRef.current = quantity;
    if (isFocusedRef.current) return;
    setInputValue(quantity ? quantity.toString() : '');
  }, [quantity]);

  // Clear any pending debounced commit on unmount.
  useEffect(() => () => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
  }, []);

  // Parse + clamp a raw string to a valid multiple of `step` within `max`.
  // Returns null for empty/invalid input (so we don't force a value).
  const clamp = useCallback((raw: string): number | null => {
    let n = parseInt(raw, 10);
    if (isNaN(n)) return null;
    if (n < step) {
      n = step;
    } else if (n > max) {
      n = Math.floor(max / step) * step;
      if (n < step) n = step;
    } else {
      n = Math.round(n / step) * step;
      if (n > max) n = Math.floor(max / step) * step;
      if (n < step) n = step;
    }
    return n;
  }, [max, step]);

  const handleIncrease = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (e && 'touches' in e) {
      e.preventDefault();
    }
    const next = Math.ceil((quantity + 1) / step) * step;
    if (next <= max) {
      onChange(next);
    }
  }, [quantity, max, step, onChange]);

  const handleDecrease = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (e && 'touches' in e) {
      e.preventDefault();
    }
    const prev = Math.max(step, Math.floor((quantity - 1) / step) * step);
    if (prev < quantity) {
      onChange(prev);
    }
  }, [quantity, step, onChange]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      // Allow only numbers
      if (!/^\d*$/.test(value)) return;
      setInputValue(value);

      // Push the value to the parent shortly after the user stops typing, so
      // the quantity updates without needing to blur / click elsewhere.
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      if (value === '') return;
      commitTimerRef.current = setTimeout(() => {
        const next = clamp(value);
        if (next != null && next !== quantityRef.current) onChange(next);
      }, COMMIT_DELAY);
    },
    [clamp, onChange]
  );

  const handleInputBlur = useCallback(() => {
    isFocusedRef.current = false;
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    const next = clamp(inputValue);
    if (next == null) {
      // Empty / invalid — restore the last known good value instead of forcing one.
      setInputValue(quantity ? quantity.toString() : '');
      return;
    }
    setInputValue(next.toString());
    if (next !== quantity) onChange(next);
  }, [inputValue, clamp, onChange, quantity]);

  return (
    <Box
      display='flex'
      alignItems='center'
      justifyContent='center'
      p={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 1,
        },
      }}
    >
      <IconButton
        onClick={handleDecrease}
        disabled={disabled || quantity <= step}
        aria-label='Decrease quantity'
        size={isMobile ? 'medium' : 'small'}
        sx={{
          minWidth: isMobile ? 44 : 36,
          minHeight: isMobile ? 44 : 36,
          padding: isMobile ? 1.5 : 1,
          borderRadius: '8px 0 0 8px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'primary.lighter',
            color: 'primary.main',
          },
          '&:disabled': {
            color: 'action.disabled',
          },
        }}
      >
        <Remove fontSize={isMobile ? 'medium' : 'small'} />
      </IconButton>
      <TextField
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={(e) => {
          isFocusedRef.current = true;
          // Select all text on focus for easier editing
          e.target.select();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            (event.target as HTMLInputElement).blur();
          }
        }}
        variant='outlined'
        size='small'
        slotProps={{
          input: {
            inputMode: 'numeric',
            style: {
              textAlign: 'center',
              width: isMobile ? '60px' : isTablet ? '70px' : '80px',
              // 16px minimum on mobile prevents iOS Safari from auto-zooming
              // the page when the input gains focus.
              fontSize: '16px',
              fontWeight: 600,
              padding: 0,
              height: isMobile ? '44px' : '36px',
            },
          },
          htmlInput: {
            pattern: '[0-9]*',
            max: max,
            'aria-label': 'Quantity',
            style: {
              textAlign: 'center',
              padding: isMobile ? '12px 8px' : '8px 6px',
            },
          },
        }}
        disabled={disabled}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            '& fieldset': {
              border: 'none',
              borderLeft: '1px solid',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
            '&:hover fieldset': {
              borderColor: 'divider',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'divider',
            },
          },
          '& input': {
            textAlign: 'center',
            fontWeight: 600,
            color: 'text.primary',
            cursor: 'text',
          },
        }}
      />
      <IconButton
        onClick={handleIncrease}
        disabled={disabled || quantity + step > max}
        aria-label='Increase quantity'
        size={isMobile ? 'medium' : 'small'}
        sx={{
          minWidth: isMobile ? 44 : 36,
          minHeight: isMobile ? 44 : 36,
          padding: isMobile ? 1.5 : 1,
          borderRadius: '0 8px 8px 0',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'primary.lighter',
            color: 'primary.main',
          },
          '&:disabled': {
            color: 'action.disabled',
          },
        }}
      >
        <Add fontSize={isMobile ? 'medium' : 'small'} />
      </IconButton>
    </Box>
  );
};

export default QuantitySelector;
