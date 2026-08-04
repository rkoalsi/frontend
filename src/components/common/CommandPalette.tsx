import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Chip,
  Dialog,
  InputBase,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Search, History as HistoryIcon } from '@mui/icons-material';
import AuthContext from '../Auth';
import { getMenuSectionsForRole } from '../../util/homeMenu';
import { NavEntry, getFrequentIds, recordUsage, searchEntries } from '../../util/navSearch';

/**
 * ⌘K / Ctrl+K jump-to-anything, mounted in Layout and AdminLayout.
 *
 * Indexes two sources so one shortcut covers the whole app: the homepage action
 * grid (role-filtered, same definition the grid itself renders) and the user's
 * admin sidebar entries, which are permission-driven and come from the DB.
 * That means a new admin page is searchable the moment it's granted, with no
 * change here.
 *
 * Not mounted for customers — four destinations don't need a palette.
 */

type PaletteEntry = NavEntry & { color?: string };

const CommandPalette = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, permissions }: any = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const role = user?.role;
  const enabled = !!user && role !== 'customer';

  const entries = useMemo<PaletteEntry[]>(() => {
    if (!enabled) return [];

    // Homepage actions. Only path-backed ones — a palette result has to be able
    // to navigate somewhere, and modal-only actions (new order, create customer)
    // live on the home grid where their dialogs are mounted.
    const home: PaletteEntry[] = getMenuSectionsForRole(role).flatMap((section) =>
      section.items
        .filter((item) => !!item.path)
        .map((item) => ({
          id: item.action,
          label: item.text,
          group: section.title,
          keywords: item.keywords,
          path: item.path,
          color: item.color,
        }))
    );

    // Admin sidebar — whatever this user's permissions actually grant.
    const admin: PaletteEntry[] = (permissions?.menu_items ?? [])
      .filter((item: any) => item?.path)
      .map((item: any) => ({
        id: item.path,
        label: item.text,
        group: `Admin · ${item.category || 'Other'}`,
        path: item.path,
      }));

    // The same destination can appear in both lists; the home entry wins
    // because it carries the search keywords.
    const seen = new Set(home.map((e) => e.path));
    return [...home, ...admin.filter((e) => !seen.has(e.path))];
  }, [enabled, role, permissions]);

  const frequentIds = useMemo(() => (open ? getFrequentIds(5) : []), [open]);

  /** With no query, lead with the user's own most-used destinations. */
  const results = useMemo(() => {
    if (query.trim()) return searchEntries(entries, query).slice(0, 40);
    const byId = new Map(entries.map((e) => [e.id, e]));
    const frequent = frequentIds.map((id) => byId.get(id)).filter(Boolean) as PaletteEntry[];
    const rest = entries.filter((e) => !frequentIds.includes(e.id));
    return [...frequent, ...rest].slice(0, 40);
  }, [entries, query, frequentIds]);

  const showFrequentHeader = !query.trim() && frequentIds.length > 0;

  useEffect(() => setActiveIndex(0), [query]);

  // ⌘K / Ctrl+K to open, anywhere. Ignored while typing in a field so it can't
  // hijack a shortcut the user meant for the page.
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const go = (entry?: PaletteEntry) => {
    if (!entry?.path) return;
    recordUsage(entry.id);
    close();
    router.push(entry.path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[activeIndex]);
    } else if (e.key === 'Escape') {
      close();
    }
  };

  // Keep the keyboard cursor in view when arrowing past the fold.
  useEffect(() => {
    const node = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!enabled) return null;

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth='sm'
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          alignSelf: 'flex-start',
          mt: { xs: 6, sm: 10 },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
        <InputBase
          autoFocus
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder='Search pages and actions…'
          inputProps={{ 'aria-label': 'Search pages and actions' }}
          // 16px keeps iOS Safari from zooming the viewport on focus.
          sx={{ fontSize: '1rem', '& input': { fontSize: '16px', py: 0.25 } }}
        />
        {!isMobile && (
          <Chip
            label='ESC'
            size='small'
            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, color: 'text.secondary' }}
          />
        )}
      </Box>

      <Box ref={listRef} sx={{ maxHeight: { xs: '60vh', sm: 420 }, overflowY: 'auto', py: 0.5 }}>
        {results.length === 0 ? (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ px: 2, py: 4, textAlign: 'center' }}
          >
            Nothing matches “{query}”.
          </Typography>
        ) : (
          results.map((entry, index) => {
            const isFrequent = showFrequentHeader && frequentIds.includes(entry.id);
            const active = index === activeIndex;
            return (
              <Box
                key={`${entry.group}-${entry.id}`}
                data-index={index}
                onClick={() => go(entry)}
                onMouseEnter={() => setActiveIndex(index)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mx: 1,
                  px: 1.5,
                  py: 1.1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: entry.color || 'text.disabled',
                  }}
                />
                <Typography variant='body2' sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
                  {entry.label}
                </Typography>
                {isFrequent && (
                  <HistoryIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                )}
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ fontSize: '0.68rem', flexShrink: 0 }}
                  noWrap
                >
                  {entry.group}
                </Typography>
              </Box>
            );
          })
        )}
      </Box>
    </Dialog>
  );
};

export default CommandPalette;
