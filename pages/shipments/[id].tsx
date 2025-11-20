import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Typography,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';
import Header from '../../src/components/common/Header';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InventoryIcon from '@mui/icons-material/Inventory';

const ShipmentDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user }: any = useContext(AuthContext);
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchShipment = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${process.env.api_url}/shipments/${id}`
      );
      setShipment(response.data);
    } catch (err) {
      console.error(err);
      setError('Error fetching shipment details');
      toast.error('Error fetching shipment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipment();
  }, [id]);

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'delivered') return 'success';
    if (statusLower === 'shipped') return 'primary';
    return 'default';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Header title='Shipment' showBackButton backUrl='/shipments' />
        <Alert severity='error' sx={{ mt: 2 }}>{error}</Alert>
        <Button variant='contained' size='small' sx={{ mt: 2 }} onClick={fetchShipment}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!shipment) {
    return (
      <Box sx={{ p: 2 }}>
        <Header title='Shipment' showBackButton backUrl='/shipments' />
        <Alert severity='warning'>Shipment not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1.5 : 2, maxWidth: '600px', mx: 'auto' }}>
      <Header title={`Shipment ${shipment.shipment_number || ''}`} showBackButton backUrl='/shipments' />

      {/* Main Info Card */}
      <Card elevation={0} sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box>
              <Typography variant='h6' fontWeight={600} sx={{ lineHeight: 1.2 }}>
                {shipment.shipment_number || 'N/A'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                SO: {shipment.salesorder_number || 'N/A'}
                {shipment.invoice_number && ` • INV: ${shipment.invoice_number}`}
              </Typography>
            </Box>
            <Chip
              label={(shipment.status || 'Unknown').charAt(0).toUpperCase() + (shipment.status || 'Unknown').slice(1).toLowerCase()}
              color={getStatusColor(shipment.status)}
              size='small'
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Details */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ width: 'calc(50% - 6px)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <PersonIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.disabled' }} />
                <Typography variant='caption' color='text.secondary'>Customer</Typography>
              </Box>
              <Typography variant='body2' fontWeight={500}>
                {shipment.customer_name || '-'}
              </Typography>
            </Box>

            <Box sx={{ width: 'calc(50% - 6px)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <CalendarTodayIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.disabled' }} />
                <Typography variant='caption' color='text.secondary'>Date</Typography>
              </Box>
              <Typography variant='body2' fontWeight={500}>
                {formatDate(shipment.date)}
              </Typography>
            </Box>

            {shipment.carrier && (
              <Box sx={{ width: 'calc(50% - 6px)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <LocalShippingIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.disabled' }} />
                  <Typography variant='caption' color='text.secondary'>Carrier</Typography>
                </Box>
                <Typography variant='body2' fontWeight={500}>
                  {shipment.carrier}
                </Typography>
              </Box>
            )}

            {shipment.tracking_number && (
              <Box sx={{ width: 'calc(50% - 6px)' }}>
                <Typography variant='caption' color='text.secondary'>Tracking #</Typography>
                <Typography variant='body2' fontWeight={500} sx={{ wordBreak: 'break-all' }}>
                  {shipment.tracking_number}
                </Typography>
              </Box>
            )}

            {shipment.total && (
              <Box sx={{ width: 'calc(50% - 6px)' }}>
                <Typography variant='caption' color='text.secondary'>Total</Typography>
                <Typography variant='body2' fontWeight={600} color='primary.main'>
                  ₹{Number(shipment.total).toLocaleString()}
                </Typography>
              </Box>
            )}

            {shipment.invoice_number && (
              <Box sx={{ width: 'calc(50% - 6px)' }}>
                <Typography variant='caption' color='text.secondary'>Invoice</Typography>
                <Typography variant='body2' fontWeight={500}>
                  {shipment.invoice_number}
                </Typography>
              </Box>
            )}

            {shipment.shipping_charge && (
              <Box sx={{ width: 'calc(50% - 6px)' }}>
                <Typography variant='caption' color='text.secondary'>Shipping</Typography>
                <Typography variant='body2' fontWeight={500}>
                  ₹{Number(shipment.shipping_charge).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Shipping Address */}
          {shipment.shipping_address && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <LocationOnIcon sx={{ fontSize: 14, mr: 0.5, mt: 0.3, color: 'text.disabled' }} />
                <Box>
                  <Typography variant='caption' color='text.secondary'>Shipping Address</Typography>
                  <Typography variant='body2'>
                    {typeof shipment.shipping_address === 'string'
                      ? shipment.shipping_address
                      : [
                          shipment.shipping_address.address,
                          shipment.shipping_address.city,
                          shipment.shipping_address.state,
                          shipment.shipping_address.zip,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      {shipment.line_items && shipment.line_items.length > 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <InventoryIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant='subtitle2' fontWeight={600}>
                Items ({shipment.line_items.length})
              </Typography>
            </Box>

            {shipment.line_items.map((item: any, index: number) => (
              <Box
                key={index}
                sx={{
                  py: 1,
                  borderBottom: index < shipment.line_items.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, mr: 1 }}>
                    <Typography variant='body2' fontWeight={500} sx={{ lineHeight: 1.3 }}>
                      {item.name || item.item_name || '-'}
                    </Typography>
                    {item.sku && (
                      <Typography variant='caption' color='text.secondary'>
                        SKU: {item.sku}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant='body2' fontWeight={500}>
                      x{item.quantity || item.quantity_shipped || '-'}
                    </Typography>
                    {item.amount && (
                      <Typography variant='caption' color='text.secondary'>
                        ₹{Number(item.amount).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ShipmentDetail;
