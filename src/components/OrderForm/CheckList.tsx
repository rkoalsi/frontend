import * as React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  Typography,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  RadioButtonUnchecked,
  CheckCircle,
  LocationOn,
} from '@mui/icons-material';

interface CheckListProps {
  values: any[];
  selectedValue: any;
  setSelectedValue: (value: any) => void;
  addressDetails?: Record<string, any>;
  addressType?: string; // 'Billing' | 'Shipping'
}

const STATUS_COLORS: Record<
  string,
  { bg: string; bgDark: string; color: string; colorDark: string; label: string }
> = {
  open: {
    bg: '#dcfce7',
    bgDark: 'rgba(76,175,80,0.2)',
    color: '#15803d',
    colorDark: '#66bb6a',
    label: 'Open',
  },
  closed: {
    bg: '#fee2e2',
    bgDark: 'rgba(217,83,79,0.2)',
    color: '#dc2626',
    colorDark: '#ef9a9a',
    label: 'Closed',
  },
  warehouse: {
    bg: '#dbeafe',
    bgDark: 'rgba(124,111,205,0.2)',
    color: '#1d4ed8',
    colorDark: '#90caf9',
    label: 'Warehouse',
  },
};

function AddressStatusChips({
  value,
  addressDetails,
  isDark,
  mt = 0.5,
}: {
  value: any;
  addressDetails: Record<string, any>;
  isDark: boolean;
  mt?: number;
}) {
  const detail = addressDetails[value.address_id];
  const s = detail?.status ? STATUS_COLORS[detail.status] : null;
  return (
    <Box display='flex' flexWrap='wrap' gap={0.75} mt={mt}>
      {value.phone && (
        <Chip
          label={value.phone}
          size='small'
          variant='outlined'
          sx={{ height: 22, fontSize: '0.72rem' }}
        />
      )}
      {s && (
        <Chip
          label={s.label}
          size='small'
          sx={{
            height: 22,
            fontSize: '0.72rem',
            fontWeight: 600,
            backgroundColor: isDark ? s.bgDark : s.bg,
            color: isDark ? s.colorDark : s.color,
          }}
        />
      )}
    </Box>
  );
}

export default function CheckList({
  values = [],
  selectedValue = null,
  setSelectedValue = () => {},
  addressDetails = {},
  addressType = 'Billing',
}: CheckListProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredValues, setFilteredValues] = React.useState(values);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Dark mode: billing = blue (#42a5f5), shipping = indigo/primary (current billing colour)
  // Light mode: billing = primary, shipping = secondary (unchanged)
  const isShipping = addressType === 'Shipping';
  const accentColor = isShipping
    ? isDark ? theme.palette.primary.main : theme.palette.secondary.main
    : isDark ? '#42a5f5' : theme.palette.primary.main;
  const accentBg = isShipping
    ? isDark ? 'rgba(124,111,205,0.1)' : 'rgba(97,73,152,0.05)'
    : isDark ? 'rgba(66,165,245,0.1)' : 'rgba(42,74,107,0.05)';
  const accentShadow = isShipping
    ? isDark ? '0 0 0 3px rgba(124,111,205,0.25)' : '0 0 0 3px rgba(97,73,152,0.12)'
    : isDark ? '0 0 0 3px rgba(66,165,245,0.25)' : '0 0 0 3px rgba(42,74,107,0.12)';

  // Use card layout on mobile AND tablet (sm+md). Desktop (lg+) uses list.
  const isCardLayout = useMediaQuery(theme.breakpoints.down('md'));

  React.useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredValues(
      values.filter((value: any) =>
        ['address', 'state', 'zip', 'city', 'attention'].some((key) =>
          value[key]?.toString().toLowerCase().includes(q)
        )
      )
    );
  }, [searchQuery, values]);

  React.useEffect(() => {
    if (filteredValues.length > 0) {
      const preselectedIndex = filteredValues.findIndex(
        (item: any) => item.address_id === selectedValue?.address_id
      );
      if (preselectedIndex !== -1) {
        setSelectedIndex(preselectedIndex);
        setSelectedValue(filteredValues[preselectedIndex]);
      } else {
        setSelectedIndex(0);
        setSelectedValue(filteredValues[0]);
      }
    } else {
      setSelectedIndex(null);
      setSelectedValue(null);
    }
  }, [filteredValues, selectedValue, setSelectedValue]);

  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
    setSelectedValue(filteredValues[index]);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search field */}
      <TextField
        placeholder='Search addresses…'
        variant='outlined'
        size='small'
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': { borderRadius: 2 },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Search sx={{ color: 'text.secondary', fontSize: 18 }} />
            </InputAdornment>
          ),
        }}
      />

      {filteredValues.length > 0 ? (
        isCardLayout ? (
          /* ────────────── Card layout (mobile + tablet) ────────────── */
          <Box display='flex' flexDirection='column' gap={1.5}>
            {filteredValues.map((value: any, index: number) => {
              const isSelected = selectedIndex === index;
              return (
                <Card
                  key={value.address_id || value.address}
                  variant='outlined'
                  onClick={(e) => handleListItemClick(e, index)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: isSelected ? accentColor : 'divider',
                    backgroundColor: isSelected ? accentBg : 'background.paper',
                    transition: 'border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease',
                    // No lift transform on touch devices — feels unnatural
                    boxShadow: isSelected ? accentShadow : 'none',
                  }}
                >
                  <CardContent
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      '&:last-child': { pb: { xs: 2, sm: 2.5 } },
                    }}
                  >
                    <Box display='flex' alignItems='flex-start' gap={1.5}>
                      {/* Radio icon */}
                      <Box pt={0.3} flexShrink={0}>
                        {isSelected ? (
                          <CheckCircle
                            sx={{
                              color: accentColor,
                              fontSize: { xs: 24, sm: 22 },
                            }}
                          />
                        ) : (
                          <RadioButtonUnchecked
                            sx={{
                              color: 'text.disabled',
                              fontSize: { xs: 24, sm: 22 },
                            }}
                          />
                        )}
                      </Box>

                      {/* Address text */}
                      <Box flex={1} minWidth={0}>
                        {value.attention && (
                          <Typography
                            variant='subtitle1'
                            fontWeight={700}
                            color='text.primary'
                            sx={{ fontSize: { xs: '0.95rem', sm: '1rem' }, mb: 0.4 }}
                          >
                            {value.attention}
                          </Typography>
                        )}
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ fontSize: { xs: '0.82rem', sm: '0.85rem' }, mb: 0.2 }}
                        >
                          {[value.address, value.street2].filter(Boolean).join(', ')}
                        </Typography>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ fontSize: { xs: '0.82rem', sm: '0.85rem' } }}
                        >
                          {[value.city, value.state, value.zip].filter(Boolean).join(', ')}
                        </Typography>

                        <AddressStatusChips
                          value={value}
                          addressDetails={addressDetails}
                          isDark={isDark}
                          mt={1}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          /* ────────────── List layout (desktop only) ────────────── */
          <List component='nav' aria-label='address list' sx={{ p: 0 }}>
            {filteredValues.map((value: any, index: number) => {
              const isSelected = selectedIndex === index;
              return (
                <ListItemButton
                  key={value.address_id || value.address}
                  onClick={(e) => handleListItemClick(e, index)}
                  selected={isSelected}
                  sx={{
                    mb: 1.5,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: isSelected ? accentColor : 'divider',
                    backgroundColor: isSelected ? accentBg : 'background.paper',
                    transition: 'all 0.18s ease',
                    '&.Mui-selected': {
                      backgroundColor: accentBg,
                      '&:hover': { backgroundColor: accentBg },
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateX(3px)',
                    },
                    p: 2,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {isSelected ? (
                      <CheckCircle sx={{ color: accentColor }} />
                    ) : (
                      <RadioButtonUnchecked sx={{ color: 'text.disabled' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box>
                        {value.attention && (
                          <Typography
                            variant='subtitle1'
                            fontWeight={700}
                            color='text.primary'
                            mb={0.4}
                          >
                            {value.attention}
                          </Typography>
                        )}
                        <Typography variant='body2' color='text.secondary' mb={0.2}>
                          {[value.address, value.street2].filter(Boolean).join(', ')}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {[value.city, value.state, value.zip].filter(Boolean).join(', ')}
                        </Typography>
                        <AddressStatusChips
                          value={value}
                          addressDetails={addressDetails}
                          isDark={isDark}
                          mt={0.75}
                        />
                      </Box>
                    }
                    primaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )
      ) : (
        /* Empty state */
        <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
          py={5}
          gap={1}
        >
          <LocationOn sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography fontWeight={600} color='text.secondary' textAlign='center'>
            No match for &ldquo;{searchQuery}&rdquo;
          </Typography>
        </Box>
      )}
    </Box>
  );
}
