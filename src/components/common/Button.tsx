import React from 'react';
import { motion } from 'framer-motion';
import { Button as MUIButton, useTheme } from '@mui/material';

interface Props {
  onClick: () => void;
  text: string;
  color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  icon?: React.ReactNode;
  large?: boolean;
  disabled?: boolean;
}

function CustomButton({
  icon,
  onClick,
  text,
  color,
  large = false,
  disabled = false,
}: Props) {
  const theme = useTheme();

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: `0px 4px 12px ${theme.palette[color].main}55`,
      transition: {
        duration: 0.3,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={buttonVariants}
      whileHover={!disabled ? 'hover' : undefined}
      whileTap={!disabled ? 'tap' : undefined}
    >
      <MUIButton
        variant='contained'
        color={color}
        startIcon={icon ?? null}
        disabled={disabled}
        sx={{
          fontSize: large ? '1.2rem' : null,
          padding: large ? '12px 24px' : null,
          borderRadius: '8px',
          fontWeight: 'bold',
          textTransform: 'none',
          backgroundImage: `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
          '&:hover': {
            backgroundImage: `linear-gradient(135deg, ${theme.palette[color].dark}, ${theme.palette[color].main})`,
          },
          '&.Mui-disabled': {
            background: theme.palette.action.disabledBackground,
            color: theme.palette.text.disabled,
            opacity: 0.7,
          },
        }}
        fullWidth
        onClick={onClick}
      >
        {text}
      </MUIButton>
    </motion.div>
  );
}

export default CustomButton;
