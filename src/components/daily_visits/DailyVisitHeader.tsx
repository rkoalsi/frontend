import { CardHeader, Typography } from '@mui/material';

interface DailyVisitHeaderProps {
  createdAt: string;
}

const DailyVisitHeader = ({ createdAt }: DailyVisitHeaderProps) => {
  const date = new Date(createdAt);
  return (
    <CardHeader
      title={<Typography variant='h5'>Daily Visit Details</Typography>}
      subheader={
        <Typography variant='subtitle1' color='text.secondary'>
          Date: {date.toLocaleDateString()} | Time: {date.toLocaleTimeString()}
        </Typography>
      }
    />
  );
};

export default DailyVisitHeader;
