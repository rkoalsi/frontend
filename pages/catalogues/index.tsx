import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import CustomButton from '../../src/components/common/Button';
import { LibraryBooks } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Props {}

function Catalogue(props: Props) {
  const {} = props;
  const [brands, setBrands] = useState([]);

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
        <CustomButton
          color={'primary'}
          onClick={() => handleDownload(b.image_url)}
          text={`${b.name} Catalogue`}
        />
      ))}
    </Box>
  );
}

export default Catalogue;
