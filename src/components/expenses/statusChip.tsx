import { Chip } from '@mui/material';

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'secondary' | 'default' | 'primary' | 'success' | 'error'> = {
  'Pending Review': 'warning',
  'Pending Second Review': 'warning',
  'Pending Payment': 'info',
  'Draft': 'secondary',
  'Submitted': 'primary',
  'Completed': 'success',
  'Rejected': 'error',
};

export default function StatusChip({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'default';
  return <Chip label={status} color={color} size="small" />;
}
