import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import { LibraryBooks } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Props {}

function Catalogue(props: Props) {
  const {} = props;
  const [brands, setBrands] = useState([]);
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
  const getData = async () => {
    try {
      const resp = await axios.get(`${process.env.api_url}/catalogues`);
      console.log(resp.data);
      setBrands(resp?.data);
    } catch (error: any) {
      console.log(error);
      toast.error(error);
    }
  };
  useEffect(() => {
    getData();
  }, []);
  const handleDownload = async (url: string) => {
    window.location.href = url;
  };
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        padding: '16px',
        gap: '16px',
        color: 'white',
      }}
    >
      <Typography variant='h3' fontWeight={'bold'} color={'white'}>
        View Catalogues
      </Typography>
      {brands.map((b: any, index: number) => (
        <motion.div variants={buttonVariants} whileHover='hover' whileTap='tap'>
          <Button
            variant='contained'
            color={'primary'}
            sx={{
              fontSize: '1.2rem',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
            fullWidth
            onClick={() => handleDownload(b.image_url)}
          >
            {b.name} Catalogue
          </Button>
        </motion.div>
      ))}
    </Box>
  );
}

export default Catalogue;
