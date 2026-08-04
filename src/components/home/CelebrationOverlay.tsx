import { useMemo } from 'react';
import { Box, Button, Dialog, Typography, useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { BRAND_YELLOW } from '../common/Topbar';

/**
 * The one-off celebration moment — fires when a rep beats last month, sets a
 * personal best, or crosses a round number. The backend decides *whether* one
 * is owed (see routes/motivation.py); this only renders it and reports back
 * that it was shown, so it never fires twice for the same achievement.
 *
 * Confetti is hand-rolled from framer-motion rather than pulling in a canvas
 * library — it runs a few times a month per user, on a dialog that's already
 * mounted, and isn't worth a dependency.
 */

type Celebration = {
  key: string;
  title: string;
  message: string;
  emoji: string;
};

const CONFETTI_COLORS = ['#D92681', BRAND_YELLOW, '#6A5AD1', '#10b981', '#0ea5e9', '#f97316'];
const CONFETTI_COUNT = 42;

const Confetti = () => {
  // Positions are randomised once per mount — regenerating them on re-render
  // would make the pieces jump mid-flight.
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.4 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 120,
        size: 6 + Math.random() * 7,
        rotation: Math.random() * 720 - 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: Math.random() > 0.65,
      })),
    []
  );

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: '110%', x: p.drift, opacity: [0, 1, 1, 0], rotate: p.rotation }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.7,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : 2,
          }}
        />
      ))}
    </Box>
  );
};

type Props = {
  celebration: Celebration | null;
  onDismiss: () => void;
};

const CelebrationOverlay = ({ celebration, onDismiss }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!celebration) return null;

  return (
    <Dialog
      open
      onClose={onDismiss}
      maxWidth='xs'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          m: isMobile ? 2 : 3,
        },
      }}
    >
      <Confetti />
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          px: 3,
          pt: 4,
          pb: 3,
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        >
          <Typography component='div' sx={{ fontSize: '3.5rem', lineHeight: 1 }}>
            {celebration.emoji}
          </Typography>
        </motion.div>

        <Typography variant='h6' fontWeight={800} sx={{ mt: 2, lineHeight: 1.3 }}>
          {celebration.title}
        </Typography>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ mt: 1, fontSize: '0.88rem', lineHeight: 1.55 }}
        >
          {celebration.message}
        </Typography>

        <Button
          onClick={onDismiss}
          variant='contained'
          fullWidth
          sx={{ mt: 3, borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.1 }}
        >
          Thanks! 🎉
        </Button>
      </Box>
    </Dialog>
  );
};

export default CelebrationOverlay;
