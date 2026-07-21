import { Paper, Box, Typography, Button, useTheme } from '@mui/material';
import { EmailOutlined, WhatsApp, SupportAgentOutlined } from '@mui/icons-material';

interface ContactSupportProps {
  /** Optional context appended to the prefilled message (e.g. shop name / phone). */
  context?: string;
}

/**
 * A simple "get in touch with us" channel for customers — email + WhatsApp.
 * Channels are configured via env (support_email / support_whatsapp).
 */
const ContactSupport = ({ context }: ContactSupportProps) => {
  const theme = useTheme();
  const email = process.env.support_email || '';
  // Normalise to wa.me format (international, no +). Assume India for bare 10-digit.
  const rawWa = (process.env.support_whatsapp || '').replace(/\D/g, '');
  const whatsapp = rawWa.length === 10 ? `91${rawWa}` : rawWa;

  if (!email && !whatsapp) return null;

  const subject = encodeURIComponent('Support request — Pupscribe Marketplace');
  const body = encodeURIComponent(
    `Hi Pupscribe team,\n\nI need help with my account.${context ? `\n\n(${context})` : ''}\n\nThanks,`
  );
  const mailHref = `mailto:${email}?subject=${subject}&body=${body}`;
  const waText = encodeURIComponent(`Hi Pupscribe team, I need help with my account.${context ? ` (${context})` : ''}`);
  const waHref = `https://wa.me/${whatsapp}?text=${waText}`;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        mt: 4,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'grey.50',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <SupportAgentOutlined fontSize='small' color='primary' />
        <Typography variant='subtitle1' fontWeight={600}>Need help?</Typography>
      </Box>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        Have a question about your account or an order? Get in touch with our team.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
        {email && (
          <Button
            component='a'
            href={mailHref}
            variant='outlined'
            startIcon={<EmailOutlined />}
            fullWidth
            sx={{ textTransform: 'none', borderRadius: '10px', justifyContent: 'center' }}
          >
            Email us
          </Button>
        )}
        {whatsapp && (
          <Button
            component='a'
            href={waHref}
            target='_blank'
            rel='noopener noreferrer'
            variant='outlined'
            color='success'
            startIcon={<WhatsApp />}
            fullWidth
            sx={{ textTransform: 'none', borderRadius: '10px', justifyContent: 'center' }}
          >
            WhatsApp us
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ContactSupport;
