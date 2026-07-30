'use client';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const Field = ({ label, value }: { label: string; value?: string }) => (
  <Box>
    <Typography variant='caption' color='text.secondary'>
      {label}
    </Typography>
    <Typography variant='body2' sx={{ fontWeight: 500 }}>
      {value || '—'}
    </Typography>
  </Box>
);

const addressLines = (a: any) => {
  if (!a) return [];
  const street = [a.address, a.street2].filter(Boolean).join(' ');
  const city = [a.city, a.state].filter(Boolean).join(', ');
  return [street, a.zip ? `${city} - ${a.zip}` : city, a.country].filter(Boolean);
};

const DistributorProfile = () => {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/distributor_portal/me')
      .then((r) => setMe(r.data.distributor))
      .catch(() => toast.error('Could not load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!me) return null;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
        Profile
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Your registered company and contact details. To change any of these, contact
        your Pupscribe account manager.
      </Typography>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}
      >
        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
          {me.company_name}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Brand — {me.brand_name}
        </Typography>
        <Divider sx={{ mb: 2.5 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2.5,
          }}
        >
          <Field label='Contact person' value={me.contact_person_name} />
          <Field label='Email' value={me.email} />
          <Field label='Phone' value={me.phone} />
          <Field label='GST number' value={me.gst_number} />
          <Field label='PAN' value={me.pan_number} />
          <Field label='Proposed margin' value={me.proposed_margin} />
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}
      >
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2 }}>
          Commercial terms
        </Typography>
        <Divider sx={{ mb: 2.5 }} />
        {me.agreed_margin ? (
          <Field label='Agreed margin' value={me.agreed_margin} />
        ) : (
          <Alert severity='info'>
            Your agreed margin has not been confirmed yet. The figure on your application
            ({me.proposed_margin || '—'}) is a proposal, not a final term.
          </Alert>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}
      >
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2 }}>
          Addresses
        </Typography>
        <Divider sx={{ mb: 2.5 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3,
          }}
        >
          {[
            ['Billing address', me.billing_address],
            ['Ship-from address', me.ship_from_address],
          ].map(([label, addr]: any) => (
            <Box key={label}>
              <Typography variant='caption' color='text.secondary'>
                {label}
              </Typography>
              {addressLines(addr).length ? (
                addressLines(addr).map((l: string, i: number) => (
                  <Typography key={i} variant='body2'>
                    {l}
                  </Typography>
                ))
              ) : (
                <Typography variant='body2'>—</Typography>
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2 }}>
          Coverage
        </Typography>
        <Divider sx={{ mb: 2.5 }} />
        <Typography variant='caption' color='text.secondary'>
          Categories
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.75, mb: 2 }}>
          {(me.categories || []).map((c: string) => (
            <Chip key={c} label={c} size='small' />
          ))}
          {!(me.categories || []).length && <Typography variant='body2'>—</Typography>}
        </Box>
        <Typography variant='caption' color='text.secondary'>
          Distribution states
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.75 }}>
          {(me.distribution_states || []).map((s: string) => (
            <Chip key={s} label={s} size='small' variant='outlined' />
          ))}
          {!(me.distribution_states || []).length && (
            <Typography variant='body2'>—</Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DistributorProfile;
