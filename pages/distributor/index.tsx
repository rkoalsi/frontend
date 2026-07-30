'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Divider,
  Button,
  Alert,
} from '@mui/material';
import {
  Inventory2,
  ReceiptLong,
  Public,
  LocalOffer,
  ArrowForward,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import { headerGradient } from '../../src/util/surfaces';

interface Dashboard {
  brand_name: string;
  products_total: number;
  products_active: number;
  states_served: number;
  categories: string[];
  orders_30d: number;
  units_30d: number;
  agreed_margin: string | null;
  status: string;
}

const StatCard = ({ icon, label, value, hint }: any) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      height: '100%',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'text.secondary' }}>
      {icon}
      <Typography variant='caption' sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Typography>
    </Box>
    <Typography variant='h4' sx={{ fontWeight: 600, lineHeight: 1 }}>
      {value}
    </Typography>
    {hint && (
      <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
        {hint}
      </Typography>
    )}
  </Paper>
);

const DistributorDashboard = () => {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, me] = await Promise.all([
          axiosInstance.get('/distributor_portal/dashboard'),
          axiosInstance.get('/distributor_portal/me'),
        ]);
        setData(dash.data);
        setProfile(me.data.distributor);
      } catch {
        toast.error('Could not load your dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <Alert severity='error'>Your dashboard is unavailable right now.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 2,
          mb: 3,
          background: headerGradient,
          color: '#fff',
        }}
      >
        <Typography variant='overline' sx={{ opacity: 0.85, letterSpacing: 1.2 }}>
          Distributor Portal
        </Typography>
        <Typography variant='h4' sx={{ fontWeight: 700, mt: 0.5 }}>
          {data.brand_name || profile?.company_name || 'Your brand'}
        </Typography>
        <Typography variant='body2' sx={{ opacity: 0.9, mt: 0.5 }}>
          {profile?.company_name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {(data.categories || []).map((c) => (
            <Chip
              key={c}
              label={c}
              size='small'
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
            />
          ))}
        </Box>
      </Paper>

      {/* The margin an admin has signed off. Absent until that step is built,
          so say so plainly rather than showing the distributor's own proposal
          as though it were agreed. */}
      {!data.agreed_margin && (
        <Alert severity='info' sx={{ mb: 3 }}>
          Your commercial terms are still being finalised. Your agreed margin will appear
          here once it has been confirmed by the Pupscribe team.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          icon={<Inventory2 fontSize='small' />}
          label='Products'
          value={data.products_total}
          hint={`${data.products_active} active`}
        />
        <StatCard
          icon={<ReceiptLong fontSize='small' />}
          label='Orders (30d)'
          value={data.orders_30d}
          hint={`${data.units_30d} units`}
        />
        <StatCard
          icon={<Public fontSize='small' />}
          label='States Served'
          value={data.states_served}
        />
        <StatCard
          icon={<LocalOffer fontSize='small' />}
          label='Agreed Margin'
          value={data.agreed_margin || '—'}
          hint={data.agreed_margin ? undefined : 'Pending confirmation'}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
            Your Products
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            The {data.brand_name} catalogue as we currently hold it.
          </Typography>
          <Button
            endIcon={<ArrowForward />}
            onClick={() => router.push('/distributor/products')}
            variant='outlined'
            size='small'
          >
            View products
          </Button>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
            Orders
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Orders placed by retailers that include your products.
          </Typography>
          <Button
            endIcon={<ArrowForward />}
            onClick={() => router.push('/distributor/orders')}
            variant='outlined'
            size='small'
          >
            View orders
          </Button>
        </Paper>
      </Box>

      <Paper
        elevation={0}
        sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 2 }}
      >
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1.5 }}>
          Registered Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          {[
            ['Contact Person', profile?.contact_person_name],
            ['Email', profile?.email],
            ['Phone', profile?.phone],
            ['GST Number', profile?.gst_number],
            ['PAN', profile?.pan_number],
            ['Proposed Margin', profile?.proposed_margin],
          ].map(([label, value]) => (
            <Box key={label as string}>
              <Typography variant='caption' color='text.secondary'>
                {label}
              </Typography>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>
                {value || '—'}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
          Distribution states
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.75 }}>
          {(profile?.distribution_states || []).map((s: string) => (
            <Chip key={s} label={s} size='small' variant='outlined' />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default DistributorDashboard;
