import React, { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, TextField, useMediaQuery,   useTheme } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

interface QuantitySelectorProps {
  quantity: number;
  max: number;
  onChange: (newQuantity: number) => void;
  disabled?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  max,
  onChange,
  disabled = false,
}) => {
  const theme = useTheme()
  const [inputValue, setInputValue] = useState<string>(quantity.toString());
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  const handleIncrease = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (quantity < max) {
      onChange(quantity + 1);
    }
  }, [quantity, max, onChange]);

  const handleDecrease = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (quantity > 1) {
      onChange(quantity - 1);
    }
  }, [quantity, onChange]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      // Allow only numbers
      if (/^\d*$/.test(value)) {
        setInputValue(value);
      }
    },
    []
  );

  const handleInputBlur = useCallback(() => {
    let newQuantity = parseInt(inputValue, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    } else if (newQuantity > max) {
      newQuantity = max;
    }
    if (newQuantity !== quantity) {
      onChange(newQuantity);
    } else {
      // Reset inputValue to reflect any adjustments
      setInputValue(newQuantity.toString());
    }
  }, [inputValue, max, onChange, quantity]);

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
        onTouchEnd={handleDecrease}
        disabled={disabled || quantity <= 1}
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
              fontSize: isMobile ? '15px' : '16px',
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
          },
        }}
      />
      <IconButton
        onClick={handleIncrease}
        onTouchEnd={handleIncrease}
        disabled={disabled || quantity >= max}
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
