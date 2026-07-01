import { useContext, useEffect, useState } from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import { useRouter } from 'next/router';
import AuthContext from './Auth';
import axiosInstance from '../util/axios';

/**
 * Reflects a self-registered B2B customer's onboarding state on the home page:
 *  - approved (has customer_id) → success "you can start ordering"
 *  - rejected                   → warning, prompt to update & resubmit
 *  - pending (submitted)        → info "awaiting approval"
 *  - incomplete                 → warning, prompt to complete details
 * No-op for internal users (not self_registered).
 */
const ProfileIncompleteBanner = () => {
  const { user }: any = useContext(AuthContext);
  const router = useRouter();
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const selfReg = Boolean(user?.self_registered);
  const approved = Boolean(user?.customer_id);

  useEffect(() => {
    // Only need the request status to tell "rejected" apart from "incomplete".
    if (!selfReg || approved) {
      setLoaded(true);
      return;
    }
    let active = true;
    axiosInstance
      .get('/customer_creation_requests/mine')
      .then((r) => { if (active) setRequestStatus(r.data.request?.status || null); })
      .catch(() => {})
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [selfReg, approved]);

  if (!user || !selfReg) return null;

  const goToProfile = (
    <Button
      color='inherit'
      size='small'
      variant='outlined'
      onClick={() => router.push('/customer/account')}
    >
      Go to profile
    </Button>
  );

  let content: React.ReactNode = null;

  if (approved) {
    content = (
      <Alert severity='success' sx={{ borderRadius: 2 }}>
        <AlertTitle>Account approved</AlertTitle>
        Your business details have been accepted — you can now place orders.
      </Alert>
    );
  } else if (!loaded) {
    return null; // avoid flashing the wrong message before status loads
  } else if (requestStatus === 'rejected') {
    content = (
      <Alert severity='warning' sx={{ borderRadius: 2 }} action={goToProfile}>
        <AlertTitle>Your details weren’t approved</AlertTitle>
        Please review and update your business details in your profile, then resubmit.
      </Alert>
    );
  } else if (user.profile_completed || requestStatus === 'pending') {
    content = (
      <Alert severity='info' sx={{ borderRadius: 2 }}>
        <AlertTitle>Awaiting approval</AlertTitle>
        Your business details have been submitted. We’ll activate your account shortly —
        you’ll be able to place orders once approved.
      </Alert>
    );
  } else {
    content = (
      <Alert severity='warning' sx={{ borderRadius: 2 }} action={goToProfile}>
        <AlertTitle>Finish setting up your account</AlertTitle>
        Add your shop and tax details in your profile to start placing orders.
      </Alert>
    );
  }

  return <Box sx={{ mb: 3 }}>{content}</Box>;
};

export default ProfileIncompleteBanner;
