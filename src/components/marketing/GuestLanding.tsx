import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { ClosingCta, FeatureGrid, MarketingHero, accent } from './marketplace';

/**
 * What a logged-out visitor sees at `/`.
 *
 * `/` is the URL Google surfaces for brand searches ("pupscribe marketplace"),
 * but it used to be the auth-gated dashboard: guests were redirected to /login
 * client-side, so the server returned an almost-empty shell (~7KB) with nothing
 * to index. This renders real content there instead.
 *
 * It is deliberately shorter than /wholesale-pet-supplies — hero, features and
 * the CTA only — so the two pages are not duplicates competing with each other,
 * and it links through for the full story.
 */
const GuestLanding = () => {
  const router = useRouter();

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', pb: { xs: 6, md: 10 } }}>
      <MarketingHero
        secondary={{ label: 'See how it works', href: '/wholesale-pet-supplies' }}
        ctaLocation='home_hero'
      />

      <FeatureGrid />

      <Box sx={{ textAlign: 'center', mt: { xs: 4, md: 5 } }}>
        <Typography sx={{ fontSize: 15, mb: 2 }} color='text.secondary'>
          Brands we distribute, who orders here, what you can buy and the full FAQ:
        </Typography>
        <Button
          variant='outlined'
          size='large'
          onClick={() => router.push('/wholesale-pet-supplies')}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            px: 3.5,
            py: 1.4,
            minHeight: 48,
            fontSize: 15,
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderColor: 'divider',
            '&:hover': { borderColor: accent('indigo'), bgcolor: 'background.paper' },
          }}
        >
          Wholesale pet supplies for retailers
        </Button>
      </Box>

      <ClosingCta ctaLocation='home_cta' />
    </Box>
  );
};

export default GuestLanding;
