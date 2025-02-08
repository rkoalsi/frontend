import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import { LibraryBooks } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Props {}

function Catalogue(props: Props) {
  const {} = props;
  const [brands, setBrands] = useState([
    {
      brand: 'FOFOS X Barkbutler',
      url: `https://d3bkzibc2zbgda.cloudfront.net/catalogues/fofos.pdf`,
    },
    {
      brand: 'Truelove',
      url: `https://d3bkzibc2zbgda.cloudfront.net/catalogues/truelove.pdf`,
    },
    {
      brand: 'Joyser',
      url: `https://d3bkzibc2zbgda.cloudfront.net/catalogues/joyser.pdf`,
    },
    {
      brand: 'Petfest',
      url: `https://d3bkzibc2zbgda.cloudfront.net/catalogues/petfest.pdf`,
    },
    // { brand: 'Zippy Paws', url: `https://d3bkzibc2zbgda.cloudfront.net/catalogues/zippy_paws.pdf`  },
  ]);
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
      const resp = await axios.get(`${process.env.api_url}/products/brands`);
      // setBrands(resp?.data?.brands);
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
      {brands.map((b: any, index: number) => (
        <motion.div variants={buttonVariants} whileHover='hover' whileTap='tap'>
          <Button
            variant='contained'
            color={index % 2 == 0 ? 'primary' : 'secondary'}
            sx={{
              fontSize: '1.2rem',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
            fullWidth
            onClick={() => handleDownload(b.url)}
          >
            {b.brand} Catalogue
          </Button>
        </motion.div>
      ))}
    </Box>
  );
}

export default Catalogue;
