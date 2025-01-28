import React, { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, TextField } from '@mui/material';
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
  const [inputValue, setInputValue] = useState<string>(quantity.toString());

  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  const handleIncrease = useCallback(() => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  }, [quantity, max, onChange]);

  const handleDecrease = useCallback(() => {
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

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    }
  }, []);

  return (
    <Box display='flex' alignItems='center' justifyContent={'center'}>
      <IconButton
        onClick={handleDecrease}
        disabled={disabled || quantity <= 1}
        aria-label='Decrease quantity'
        size='small'
      >
        <Remove />
      </IconButton>
      <TextField
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyPress={handleKeyPress}
        variant='outlined'
        size='small'
        inputProps={{
          inputMode: 'numeric',
          pattern: '[0-9]*',
          max: max,
          style: { textAlign: 'center', width: '60px' },
          'aria-label': 'Quantity',
        }}
        disabled={disabled}
        sx={{ mx: 1 }}
      />
      <IconButton
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
        aria-label='Increase quantity'
        size='small'
      >
        <Add />
      </IconButton>
    </Box>
  );
};

export default QuantitySelector;
