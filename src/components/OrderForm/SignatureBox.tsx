import { useRef, useState, useEffect } from 'react';
import SignaturePad from 'react-signature-canvas';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  Typography,
} from '@mui/material';
import axios from 'axios';
import Image from 'next/image';

interface SignatureBox {
  customer: any;
  order_id: any;
  signature: any;
  setSignatureUploaded: any;
}
const SignatureBox = ({
  customer,
  order_id,
  signature,
  setSignatureUploaded,
}: SignatureBox) => {
  const [signatureData, setSignatureData] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const sigPadRef = useRef<SignaturePad>(null);

  const clearSignature = () => {
    sigPadRef.current?.clear();
    setSignatureData(null);
  };

  const uploadSignature = async () => {
    const signatureImage = sigPadRef.current?.toDataURL();
    setSignatureData(signatureImage || null);
    if (!signatureImage) return;
    try {
      const blob = await (await fetch(signatureImage)).blob();
      const formData = new FormData();
      formData.append('signature', blob, 'signature.png');
      formData.append('customer_id', customer?._id);
      formData.append('order_id', order_id);

      const response = await axios.post(
        `${process.env.api_url}/customers/upload/sign`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Signature uploaded:', response.data);
      setData(response.data);
      setSignatureUploaded(true);
    } catch (error) {
      console.error('Error uploading signature:', error);
      alert('Failed to upload signature.');
    } finally {
      clearSignature();
    }
  };
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', padding: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', padding: 2 }}>
      {data || signature ? (
        <Box sx={{ marginTop: 2, border: '1px solid black', padding: '8px' }}>
          <Typography>{data?.message || 'Signature Uploaded'}</Typography>
          <Image
            alt={'Customer Signature'}
            src={`${data?.white_signature || signature}`}
            width={320}
            height={250}
          />
        </Box>
      ) : (
        <>
          <SignaturePad
            ref={sigPadRef}
            canvasProps={{
              width: 400,
              height: 200,
              style: { border: '1px solid #000', borderRadius: '8px' },
            }}
          />
          <Box sx={{ marginTop: 2 }}>
            <Button variant='outlined' color='error' onClick={clearSignature}>
              Retry
            </Button>
            <Button
              variant='contained'
              color='primary'
              sx={{ marginLeft: 2 }}
              onClick={async () => {
                setLoading(true);
                await uploadSignature();
                setLoading(false);
              }}
            >
              Confirm
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default SignatureBox;
