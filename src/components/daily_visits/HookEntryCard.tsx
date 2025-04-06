import { Check, Delete } from '@mui/icons-material';
import {
  Box,
  Paper,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Tooltip,
  MenuItem,
  IconButton,
  TextField,
} from '@mui/material';
import { memo } from 'react';

interface HookEntryCardProps {
  entry: any;
  index: number;
  updateEntry: (index: number, field: string, value: any) => void;
  removeEntry: (index: number) => void;
  hookCategories: { id: string; name: string }[];
  toggleEditEntry: (index: number) => void;
  selectedCategoryIds: any;
}
const HookEntryCard = memo(function HookEntryCard({
  entry,
  index,
  updateEntry,
  removeEntry,
  hookCategories,
  toggleEditEntry,
  selectedCategoryIds,
}: HookEntryCardProps) {
  const availableCategories = hookCategories.filter(
    (cat: any) =>
      !selectedCategoryIds.includes(cat.id) || cat.id === entry.category_id
  );
  return (
    <Paper
      variant='outlined'
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        position: 'relative',
      }}
    >
      {entry.editing ? (
        <Grid container spacing={2} alignItems='center'>
          <Grid>
            <FormControl fullWidth variant='outlined'>
              <InputLabel>Category</InputLabel>
              <Select
                label='Category'
                value={entry.category_id || entry.category_id}
                onChange={(e) => {
                  updateEntry(index, 'category_id', e.target.value);
                }}
              >
                {availableCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid>
            <TextField
              label='Hooks Available'
              type='number'
              fullWidth
              variant='outlined'
              value={entry.hooksAvailable}
              onChange={(e) =>
                updateEntry(index, 'hooksAvailable', e.target.value)
              }
            />
          </Grid>
          <Grid>
            <TextField
              label='Total Hooks'
              type='number'
              fullWidth
              variant='outlined'
              value={entry.totalHooks}
              onChange={(e) => updateEntry(index, 'totalHooks', e.target.value)}
            />
          </Grid>
          <Grid>
            <Stack direction='row' spacing={1}>
              <Tooltip title='Done Editing'>
                <IconButton onClick={() => toggleEditEntry(index)}>
                  <Check color='primary' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Delete'>
                <IconButton onClick={() => removeEntry(index)}>
                  <Delete color='error' />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      ) : (
        <Box>
          <Typography variant='subtitle1' fontWeight='bold'>
            {hookCategories.find((cat: any) => cat.id === entry.category_id)
              ?.name || 'No Category Selected'}
          </Typography>
          <Typography variant='body2'>
            Hooks Available: {entry.hooksAvailable}
          </Typography>
          <Typography variant='body2'>
            Total Hooks: {entry.totalHooks}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button
              variant='outlined'
              size='small'
              onClick={() => toggleEditEntry(index)}
            >
              Edit
            </Button>
            <Button
              variant='text'
              size='small'
              color='error'
              onClick={() => removeEntry(index)}
            >
              Delete
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
});

export default HookEntryCard;
