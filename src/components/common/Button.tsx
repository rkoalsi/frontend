import React from 'react';
import { motion } from 'framer-motion';
import { Button as MUIButton } from '@mui/material';

interface Props {
  onClick: any;
  text: any;
  color: string;
  icon?: any;
  large?: boolean;
}

function CustomButton(props: Props) {
  const { icon, onClick, text, color, large = false }: any = props;
  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
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
    <motion.div variants={buttonVariants} whileHover='hover' whileTap='tap'>
      <MUIButton
        variant='contained'
        color={color}
        startIcon={icon ?? null}
        sx={{
          fontSize: large ? '1.2rem' : null,
          padding: large ? '12px 24px' : null,
          borderRadius: '8px',
          fontWeight: large ? 'bold' : null,
          textTransform: large ? null : 'none',
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
