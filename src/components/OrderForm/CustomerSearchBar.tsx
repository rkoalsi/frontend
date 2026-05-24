import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  styled,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import axios from 'axios';
import AuthContext from '../Auth';
import { Person, Business, Search, CheckCircle } from '@mui/icons-material';

interface SearchResult {
  _id: string;
  contact_name: string;
  company_name?: string;
  cf_sales_person?: string;
  salesperson_name?: string;
}

interface SearchBarProps {
  label: string;
  onChange: (value: SearchResult | null) => void;
  value?: any;
  disabled?: boolean;
  initialValue?: any;
  onChangeReference?: (value: any | null) => void;
  reference?: any;
  ref_no?: boolean;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 4px 20px rgba(0,0,0,0.3)'
      : '0 2px 12px rgba(0,0,0,0.08)',
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    borderRadius: 12,
  },
}));

// Dropdown paper — slightly wider and better styled
const DropdownPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0,0,0,0.5)'
      : '0 8px 32px rgba(0,0,0,0.12)',
  overflow: 'hidden',
}));

const CustomerSearchBar: React.FC<SearchBarProps> = ({
  label = 'Search',
  onChange,
  disabled,
  initialValue,
  onChangeReference,
  reference,
  ref_no = true,
}) => {
  const { user }: any = useContext(AuthContext);
  const isAdmin = user?.role?.includes('admin');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SearchResult | null>(
    initialValue || null
  );

  // For the text field: show company_name (if present) else contact_name.
  // The full details are shown in the dropdown and in the selected-customer card.
  const getDisplayName = (customer: any) => {
    if (!customer) return '';
    return customer.company_name || customer.contact_name || '';
  };

  const [inputValue, setInputValue] = useState<string>(
    initialValue ? getDisplayName(initialValue) : ''
  );

  useEffect(() => {
    if (initialValue) {
      const displayName = getDisplayName(initialValue);
      if (!selectedOption || selectedOption._id !== initialValue._id) {
        setSelectedOption(initialValue);
        setOptions([initialValue]);
      }
      if (inputValue !== displayName) {
        setInputValue(displayName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  const handleSearch = async (value: string) => {
    if (!value) return;
    setLoading(true);
    try {
      const base = `${process.env.api_url}`;
      const response = await axios.get(`${base}/customers`, {
        params: isAdmin
          ? { role: 'admin', name: value }
          : { user_code: user.code, name: value },
      });
      setOptions(response.data.customers);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
      return;
    }
  }

  const handleOptionSelect = (event: any, value: SearchResult | null) => {
    setSelectedOption(value);
    onChange(value);
  };

  const isCompanyCustomer =
    selectedOption?.cf_sales_person?.includes('Company customers') ||
    selectedOption?.salesperson_name?.includes('Company customers');

  return (
    <StyledPaper>
      {/* Section header */}
      <Box display='flex' alignItems='center' mb={2.5}>
        <Person
          sx={{
            mr: 1,
            color: 'primary.main',
            fontSize: { xs: 24, sm: 28 },
          }}
        />
        <Typography
          variant='h6'
          fontWeight={600}
          color='text.primary'
          sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
        >
          Customer Information
        </Typography>
      </Box>

      <Box display='flex' flexDirection='column' width='100%' gap={2.5}>
        {/* ── Autocomplete ── */}
        <Autocomplete
          disabled={disabled}
          freeSolo
          options={options}
          // What shows in the text field (compact — company or contact name)
          getOptionLabel={(option: any) =>
            typeof option === 'string' ? option : getDisplayName(option) || 'Unknown'
          }
          isOptionEqualToValue={(option: SearchResult, value: SearchResult) =>
            option._id === value._id
          }
          value={selectedOption}
          inputValue={inputValue}
          onInputChange={(_event, newInputValue) => {
            if (newInputValue !== inputValue) {
              setInputValue(newInputValue);
              handleSearch(newInputValue);
            }
          }}
          onChange={(e, value: any) => handleOptionSelect(e, value)}
          // Custom dropdown paper
          PaperComponent={(props) => <DropdownPaper {...props} />}
          // ── Custom dropdown option — stacked labeled rows ──
          renderOption={(props, option: any) => {
            const { key, ...rest } = props as any;
            return (
              <Box
                component='li'
                key={key}
                {...rest}
                sx={{
                  py: { xs: 1.5, sm: 1.25 },
                  px: { xs: 2, sm: 2 },
                  alignItems: 'flex-start',
                  '&:not(:last-child)': {
                    borderBottom: `1px solid ${
                      isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                    }`,
                  },
                  '&.Mui-focused, &:hover': {
                    backgroundColor: isDark
                      ? 'rgba(124,111,205,0.15)'
                      : 'rgba(42,74,107,0.06)',
                  },
                  minHeight: { xs: 'auto', sm: 'auto' },
                }}
              >
                {/* Person icon */}
                <Box
                  sx={{
                    width: { xs: 36, sm: 32 },
                    height: { xs: 36, sm: 32 },
                    borderRadius: '50%',
                    bgcolor: isDark
                      ? 'rgba(124,111,205,0.2)'
                      : 'rgba(42,74,107,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    flexShrink: 0,
                  }}
                >
                  <Person
                    sx={{
                      color: 'primary.main',
                      fontSize: { xs: 18, sm: 16 },
                    }}
                  />
                </Box>

                {/* Name rows — no labels, just the names */}
                <Box flex={1} minWidth={0}>
                  {(() => {
                    const sameNames =
                      option.contact_name &&
                      option.company_name &&
                      option.contact_name.trim().toLowerCase() ===
                        option.company_name.trim().toLowerCase();
                    return sameNames ? (
                      <Typography
                        variant='body2'
                        fontWeight={700}
                        color='text.primary'
                        sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' }, wordBreak: 'break-word', lineHeight: 1.3 }}
                      >
                        {option.contact_name}
                      </Typography>
                    ) : (
                      <>
                        <Typography
                          variant='body2'
                          fontWeight={700}
                          color='text.primary'
                          sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' }, wordBreak: 'break-word', lineHeight: 1.3, mb: 0.25 }}
                        >
                          {option.contact_name || '—'}
                        </Typography>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ fontSize: { xs: '0.82rem', sm: '0.8rem' }, wordBreak: 'break-word', lineHeight: 1.3 }}
                        >
                          {option.company_name}
                        </Typography>
                      </>
                    );
                  })()}

                  {/* Salesperson chip — only if present */}
                  {option.salesperson_name && (
                    <Chip
                      label={option.salesperson_name}
                      size='small'
                      variant='outlined'
                      sx={{
                        mt: 0.75,
                        height: 20,
                        fontSize: '0.62rem',
                        fontWeight: 500,
                        borderColor: 'divider',
                        color: 'text.secondary',
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              variant='outlined'
              fullWidth
              placeholder='Type to search customers…'
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <Search
                    sx={{
                      color: 'text.disabled',
                      mr: 0.5,
                      fontSize: { xs: 20, sm: 18 },
                    }}
                  />
                ),
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color='primary' size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: { xs: '1rem', sm: '0.95rem' },
                  // Larger touch target on mobile
                  '& input': {
                    py: { xs: 1.5, sm: 1 },
                  },
                },
              }}
            />
          )}
          sx={{
            '& .MuiAutocomplete-popupIndicator': {
              color: 'primary.main',
            },
          }}
        />

        {/* ── Selected customer summary card ── */}
        {selectedOption && !disabled && (
          <Box
            sx={{
              borderRadius: 2,
              border: `1.5px solid`,
              borderColor: 'primary.main',
              bgcolor: isDark
                ? 'rgba(124,111,205,0.08)'
                : 'rgba(42,74,107,0.04)',
              px: { xs: 2, sm: 2.5 },
              py: { xs: 1.5, sm: 1.75 },
            }}
          >
            {/* Header row */}
            <Box display='flex' alignItems='center' gap={1} mb={1.25}>
              <CheckCircle
                sx={{ color: 'success.main', fontSize: { xs: 18, sm: 16 } }}
              />
              <Typography
                variant='caption'
                fontWeight={700}
                color='success.main'
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: { xs: '0.65rem', sm: '0.62rem' },
                }}
              >
                Customer Selected
              </Typography>
            </Box>

            <Divider sx={{ mb: 1.25 }} />

            {/* Name fields */}
            <Box display='flex' flexDirection='column' gap={0.75}>
              {(() => {
                const sel = selectedOption as any;
                const sameNames =
                  sel.contact_name &&
                  sel.company_name &&
                  sel.contact_name.trim().toLowerCase() ===
                    sel.company_name.trim().toLowerCase();
                return sameNames ? (
                  <Box display='flex' gap={{ xs: 1.5, sm: 2 }} alignItems='baseline'>
                    <Typography
                      variant='caption'
                      color='text.disabled'
                      fontWeight={600}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontSize: '0.62rem',
                        width: { xs: 90, sm: 100 },
                        flexShrink: 0,
                      }}
                    >
                      Name
                    </Typography>
                    <Typography
                      variant='body2'
                      fontWeight={700}
                      color='text.primary'
                      sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' } }}
                    >
                      {sel.contact_name}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box display='flex' gap={{ xs: 1.5, sm: 2 }} alignItems='baseline'>
                      <Typography
                        variant='caption'
                        color='text.disabled'
                        fontWeight={600}
                        sx={{
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          fontSize: '0.62rem',
                          width: { xs: 90, sm: 100 },
                          flexShrink: 0,
                        }}
                      >
                        Contact Name
                      </Typography>
                      <Typography
                        variant='body2'
                        fontWeight={700}
                        color='text.primary'
                        sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' } }}
                      >
                        {sel.contact_name || '—'}
                      </Typography>
                    </Box>
                    <Box display='flex' gap={{ xs: 1.5, sm: 2 }} alignItems='baseline'>
                      <Typography
                        variant='caption'
                        color='text.disabled'
                        fontWeight={600}
                        sx={{
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          fontSize: '0.62rem',
                          width: { xs: 90, sm: 100 },
                          flexShrink: 0,
                        }}
                      >
                        Company
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: { xs: '0.875rem', sm: '0.85rem' } }}
                      >
                        {sel.company_name || '—'}
                      </Typography>
                    </Box>
                  </>
                );
              })()}

              {(selectedOption as any).salesperson_name && (
                <Box display='flex' gap={{ xs: 1.5, sm: 2 }} alignItems='center'>
                  <Typography
                    variant='caption'
                    color='text.disabled'
                    fontWeight={600}
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontSize: '0.62rem',
                      width: { xs: 90, sm: 100 },
                      flexShrink: 0,
                    }}
                  >
                    Sales Rep
                  </Typography>
                  <Chip
                    label={(selectedOption as any).salesperson_name}
                    size='small'
                    sx={{
                      height: 22,
                      fontSize: { xs: '0.72rem', sm: '0.68rem' },
                      fontWeight: 600,
                      bgcolor: isDark
                        ? 'rgba(124,111,205,0.2)'
                        : 'rgba(42,74,107,0.1)',
                      color: 'primary.main',
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* ── Reference Number (Company customers only) ── */}
        {selectedOption &&
          ref_no &&
          isCompanyCustomer && (
            <Box>
              <Box display='flex' alignItems='center' mb={1.5}>
                <Business
                  sx={{ mr: 1, color: 'secondary.main', fontSize: { xs: 22, sm: 24 } }}
                />
                <Typography
                  variant='subtitle2'
                  fontWeight={600}
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
                >
                  Reference Information
                </Typography>
              </Box>
              <TextField
                disabled={disabled}
                label='Reference Number'
                onChange={onChangeReference}
                value={reference || ''}
                fullWidth
                variant='outlined'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: { xs: '0.5rem', sm: '0.95rem' },
                  },
                }}
              />
            </Box>
          )}
      </Box>
    </StyledPaper>
  );
};

export default CustomerSearchBar;
