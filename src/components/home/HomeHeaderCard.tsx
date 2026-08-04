import { useEffect, useState } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { BarChart, ExpandMore, TrendingFlat, TrendingUp } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * The homepage header. For customers and non-sales staff it's just the greeting.
 *
 * For sales roles it also absorbs what used to be a second, separate performance
 * card: the daily motivation line, a one-line stat summary, and the full
 * this-month-vs-last breakdown behind a disclosure. Three stacked cards pushed
 * the actual action grid below the fold on a phone, which is the opposite of
 * what a homepage is for — so the numbers collapse and the state sticks.
 */

const PERF_OPEN_KEY = 'pupscribe:home:perfOpen';

const inr = (n: number) =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0)}`;

const greetingFor = (hours: number) =>
  hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';

type Props = {
  firstName?: string;
  isCustomer: boolean;
  isSalesPerson: boolean;
  perfData: any;
  onViewDetails: () => void;
};

/**
 * Progress against the same point in last month — never rendered in red.
 *
 * Two deliberate choices here. The baseline is last month *to date*, not the
 * whole of last month, so nobody opens the app on the 3rd to a -80%. And when
 * a rep is behind, we don't show the shortfall as a negative percentage in
 * error red: we show the gap as something to close. Same number, framed as a
 * target instead of a failure. Green is reserved for genuinely being ahead.
 */
const TrendPill = ({
  current,
  previous,
  format,
  verbose,
}: {
  current: number;
  previous: number | null | undefined;
  format?: (n: number) => string;
  verbose?: boolean;
}) => {
  const fmt = format || ((n: number) => String(Math.round(n)));

  if (previous === null || previous === undefined || previous <= 0) {
    return (
      <Typography variant='caption' color='text.disabled' sx={{ fontSize: '0.65rem' }}>
        {verbose ? 'No comparison for last month' : 'New ground'}
      </Typography>
    );
  }

  const ahead = current > previous;
  if (ahead) {
    const pct = Math.round(((current - previous) / previous) * 100);
    return (
      <Box display='flex' alignItems='center' gap={0.5}>
        <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} />
        <Typography
          variant='caption'
          sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.65rem' }}
        >
          +{pct}%{verbose ? ' vs same time last month' : ''}
        </Typography>
      </Box>
    );
  }

  const gap = previous - current;
  return (
    <Box display='flex' alignItems='center' gap={0.5}>
      <TrendingFlat sx={{ fontSize: 14, color: 'text.secondary' }} />
      <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem' }}>
        {gap === 0
          ? verbose
            ? 'Level with last month'
            : 'On par'
          : `${fmt(gap)} to go${verbose ? ' to match last month' : ''}`}
      </Typography>
    </Box>
  );
};

const HomeHeaderCard = ({
  firstName,
  isCustomer,
  isSalesPerson,
  perfData,
  onViewDetails,
}: Props) => {
  const theme = useTheme();
  const now = new Date();
  const [perfOpen, setPerfOpen] = useState(false);

  // Read after mount — localStorage during render breaks SSR hydration.
  useEffect(() => {
    try {
      setPerfOpen(window.localStorage.getItem(PERF_OPEN_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const togglePerf = () => {
    setPerfOpen((open) => {
      try {
        window.localStorage.setItem(PERF_OPEN_KEY, open ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !open;
    });
  };

  const motivation = perfData?.motivation;
  const showPerf = isSalesPerson && !!perfData;
  const count = perfData?.this_month?.total_count ?? 0;
  const value = perfData?.this_month?.total_value ?? 0;

  return (
    <Box
      data-tour='home-greeting'
      mb={3.5}
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: 1,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.65rem',
            fontWeight: 600,
          }}
        >
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Typography>
        <Typography
          variant='h5'
          component='h1'
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.35rem', sm: '1.6rem' },
            mt: 0.25,
            lineHeight: 1.3,
          }}
        >
          {greetingFor(now.getHours())}, {firstName} 👋
        </Typography>

        {/* Sales roles get today's motivation line here instead of the generic
            blurb — it's the same slot, so the card costs no extra height. */}
        <AnimatePresence mode='wait'>
          {showPerf && motivation?.text ? (
            <motion.div
              key={motivation.text}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
            >
              <Box
                sx={{
                  mt: 1.25,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.07),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                }}
              >
                <Box component='span' sx={{ fontSize: '1rem', lineHeight: 1.45 }}>
                  {motivation.emoji}
                </Box>
                <Typography
                  variant='body2'
                  sx={{ fontSize: '0.82rem', lineHeight: 1.45, fontWeight: 500 }}
                >
                  {motivation.text}
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, fontSize: '0.82rem' }}>
              {isCustomer
                ? 'Browse catalogues and manage your orders.'
                : 'Manage orders, customers, and more — all in one place.'}
            </Typography>
          )}
        </AnimatePresence>
      </Box>

      {showPerf && (
        <>
          {/* Always-visible summary strip. Tapping the row toggles the detail;
              the "View details" link still goes through to the full page. */}
          <Box
            onClick={togglePerf}
            role='button'
            tabIndex={0}
            aria-expanded={perfOpen}
            aria-label='My performance summary'
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePerf();
              }
            }}
            sx={{
              px: 2.5,
              py: 1.25,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              transition: 'background-color .18s ease',
              '&:hover': { bgcolor: 'action.selected' },
            }}
          >
            <BarChart sx={{ fontSize: 17, color: 'primary.main', flexShrink: 0 }} />
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, minWidth: 0, flex: 1 }}>
              <Typography variant='body2' fontWeight={700} sx={{ fontSize: '0.82rem' }}>
                {count}
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.72rem' }}>
                {count === 1 ? 'order' : 'orders'}
              </Typography>
              <Typography variant='caption' color='text.disabled' sx={{ px: 0.25 }}>
                ·
              </Typography>
              <Typography variant='body2' fontWeight={700} sx={{ fontSize: '0.82rem' }} noWrap>
                {inr(value)}
              </Typography>
              <Box sx={{ ml: 0.5, display: { xs: 'none', sm: 'block' } }}>
                <TrendPill
                  current={value}
                  previous={perfData?.last_month_to_date?.total_value}
                  format={inr}
                />
              </Box>
            </Box>
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ fontSize: '0.68rem', display: { xs: 'none', sm: 'block' } }}
            >
              {perfData?.period?.this_month_label}
            </Typography>
            <IconButton
              size='small'
              aria-hidden
              tabIndex={-1}
              sx={{
                p: 0.25,
                transform: perfOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform .2s ease',
              }}
            >
              <ExpandMore sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          <Collapse in={perfOpen} timeout='auto' unmountOnExit>
            <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                {[
                  {
                    label: 'Orders',
                    display: String(count),
                    current: count,
                    previous: perfData?.last_month_to_date?.total_count,
                    format: (n: number) => String(Math.round(n)),
                  },
                  {
                    label: 'Value',
                    display: inr(value),
                    current: value,
                    previous: perfData?.last_month_to_date?.total_value,
                    format: inr,
                  },
                ].map(({ label, display, current, previous, format }) => (
                  <Box key={label} sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1.5 }}>
                    <Typography variant='caption' color='text.secondary' fontWeight={600}>
                      {label}
                    </Typography>
                    <Typography variant='h6' fontWeight={700} sx={{ lineHeight: 1.2, my: 0.25 }}>
                      {display}
                    </Typography>
                    <TrendPill current={current} previous={previous} format={format} verbose />
                  </Box>
                ))}
              </Box>
              <Typography
                onClick={onViewDetails}
                variant='caption'
                color='primary.main'
                fontWeight={600}
                sx={{
                  display: 'inline-block',
                  mt: 1.5,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                View full performance →
              </Typography>
            </Box>
          </Collapse>
        </>
      )}
    </Box>
  );
};

export default HomeHeaderCard;
