import {
  Box,
  Typography,
  Paper,
  styled,
  useTheme,
  Button,
  Container,
  useMediaQuery,
  Grid,
  alpha,
  Chip,
  Tooltip,
  IconButton,
  Skeleton,
  Stack,
  Avatar,
  Dialog,
  DialogContent,
  DialogActions,
  Drawer,
  Divider,
  InputBase,
} from '@mui/material';
import { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AuthContext, { hadSessionHint } from '../src/components/Auth';
import ProfileIncompleteBanner from '../src/components/ProfileIncompleteBanner';
import GuestLanding, { Brand } from '../src/components/marketing/GuestLanding';
import { useRouter } from 'next/router';
import {
  CalendarMonth,
  Campaign,
  Check,
  CheckCircle,
  ContentCopy,
  History,
  Insights,
  KeyboardReturn,
  MenuBook,
  NewReleases,
  OpenInNew,
  Payment,
  PictureAsPdf,
  Phishing,
  PlayCircle,
  Radar,
  Repeat,
  ShoppingCart,
  Link,
  LineAxis,
  Rocket,
  PersonAdd,
  Assignment,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  BarChart,
  ReceiptLong,
  Receipt,
  Key,
  Download,
  Badge,
  QrCode2,
  Close,
  Search as SearchIcon,
} from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';
import axiosInstance from '../src/util/axios';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerCreationRequestForm from '../src/components/CustomerCreationRequestForm';
import { toast } from 'react-toastify';
import CustomerTour, { TourStep } from '../src/components/common/CustomerTour';
import CatalogueShowcaseCard from '../src/components/catalogue/CatalogueShowcaseCard';
import HomeHeaderCard from '../src/components/home/HomeHeaderCard';
import NewBrandCallout from '../src/components/OrderForm/products/NewBrandCallout';
import type { BrandRailEntry } from '../src/util/brandAccent';
import CelebrationOverlay from '../src/components/home/CelebrationOverlay';
import { MenuItem, digitalCardItem, getMenuSectionsForRole } from '../src/util/homeMenu';
import {
  NavEntry,
  getFrequentIds,
  recordUsage,
  searchEntries,
  syncUsage,
} from '../src/util/navSearch';

const CUSTOMER_TOUR_STEPS: TourStep[] = [
  {
    target: null,
    title: 'Welcome to Pupscribe!',
    content: "You're all set! Let us quickly show you around so you know where everything is.",
  },
  {
    target: 'home-greeting',
    title: 'Your Home Page',
    content: "This is your home page. You'll see a personalised greeting here each time you log in.",
  },
  {
    target: 'home-new-order',
    title: 'Place a New Order',
    content: 'Tap here to browse our product catalogue and submit a new order for review.',
  },
  {
    target: 'home-orders-section',
    mobileTarget: 'home-orders-header',
    title: 'Quick Links',
    content: 'These cards give you quick access to your past orders, shipments, and your customer account dashboard.',
  },
  {
    target: 'home-catalogues',
    mobileTarget: 'home-catalogues-header',
    title: 'Brand Catalogues',
    content: 'Browse and open catalogues for all our brands right from here. Tap the copy icon to share a link.',
  },
];

// Matches the card page's own backdrop (NAVY_DEEP in pages/cards/[id].tsx) so
// the frame and the QR view sit on one continuous colour, with no grey band.
const CARD_FRAME_BG = '#252654';

// Staff share the marketplace copy of their card. The blog copy on
// barkbutler.in stays live for QR codes already in the wild, but we no longer
// hand that link out from here.
const cardPublicUrl = (slug?: string) => {
  if (!slug) return '';
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://marketplace.pupscribe.in';
  return `${origin}/cards/${slug}`;
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.primary.main,
  borderRadius: 16,
  border: `1px solid ${theme.palette.primary.dark}`,
  boxShadow: '0px 4px 20px rgba(0,0,0,0.25)',
}));

const ActionCard = styled(Button)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2, 1.5),
  borderRadius: 14,
  textTransform: 'none',
  minHeight: 96,
  width: '100%',
  transition: 'all 0.18s ease-in-out',
  backgroundColor: theme.palette.mode === 'dark'
    ? 'rgba(255,255,255,0.06)'
    : theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.palette.mode === 'light' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`,
  backdropFilter: 'blur(4px)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.12)'
      : theme.palette.action.hover,
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : theme.palette.primary.light}`,
  },
  '&:active': {
    transform: 'scale(0.97)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.75rem',
    marginBottom: theme.spacing(0.75),
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 600,
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: theme.spacing(1.5),
  paddingLeft: theme.spacing(0.5),
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      when: 'beforeChildren',
      staggerChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

const CatalogueCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    background: theme.palette.primary.main,
    opacity: 0,
    transition: 'opacity 0.2s ease',
    borderRadius: '3px 0 0 3px',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateX(2px)',
    borderColor: alpha(theme.palette.primary.main, 0.4),
    boxShadow: theme.shadows[2],
    '&::before': { opacity: 1 },
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.25, 1.5),
    gap: theme.spacing(1.25),
    borderRadius: 10,
  },
}));

const CatalogueIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  minWidth: '44px',
  borderRadius: 10,
  background: alpha(theme.palette.primary.main, 0.1),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
  [theme.breakpoints.down('sm')]: {
    width: '38px',
    height: '38px',
    minWidth: '38px',
    borderRadius: 8,
  },
}));

const CatalogueActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  backgroundColor: alpha(theme.palette.action.active, 0.05),
  borderRadius: 8,
  padding: theme.spacing(0.75),
  transition: 'all 0.2s ease',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.main,
  },
}));

// The menu definition itself now lives in src/util/homeMenu.tsx so the ⌘K
// palette can index the same list this page renders.

// Grouped menu items for better organization

/**
 * Shown only in the gap between "this browser had a session" and `/me` coming
 * back. Deliberately shaped like the real homepage (header card, then a card
 * grid) so the transition is a fill-in rather than a layout jump.
 */
const HomeBootSkeleton = () => (
  <Box sx={{ flex: 1, pt: { xs: 2.5, sm: 3.5 }, px: { xs: 2, sm: 2.5 }, width: '100%' }}>
    <Container maxWidth='lg' disableGutters>
      <Skeleton variant='rounded' height={132} sx={{ borderRadius: 3, mb: 3.5 }} />
      <Skeleton variant='rounded' height={44} sx={{ borderRadius: 2.5, mb: 2.5 }} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 1.5,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} variant='rounded' height={96} sx={{ borderRadius: 3.5 }} />
        ))}
      </Box>
    </Container>
  </Box>
);

const Home = ({ brands = [], authed = false }: { brands?: Brand[]; authed?: boolean }) => {
  const router = useRouter();
  const { user, loading: authLoading }: any = useContext(AuthContext);
  // Read once on mount: localStorage during render would break SSR hydration.
  const [hadSession, setHadSession] = useState(false);
  useEffect(() => setHadSession(hadSessionHint()), []);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Phones and tablets get a full-screen card sheet; md+ gets a centred dialog.
  const isCardDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [showCustomerRequestForm, setShowCustomerRequestForm] = useState(false);
  const [catalogues, setCatalogues] = useState<any[]>([]);
  const [cataloguesLoading, setCataloguesLoading] = useState(false);
  const [newBrands, setNewBrands] = useState<BrandRailEntry[]>([]);
  const [newBrandCounts, setNewBrandCounts] = useState<{
    [brand: string]: { [category: string]: number };
  }>({});
  // Drives the transient "Copied" tick on a catalogue card's copy button.
  const [copiedCatalogueKey, setCopiedCatalogueKey] = useState<string | null>(null);

  const isCustomer = user?.role === 'customer';
  const isSalesPerson = user?.role === 'sales_person' || user?.role === 'sales_admin';

  const [perfData, setPerfData] = useState<any>(null);
  const [celebration, setCelebration] = useState<any>(null);
  const [myCard, setMyCard] = useState<any>(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardView, setCardView] = useState<'card' | 'qr'>('card');
  const [cardFrameLoaded, setCardFrameLoaded] = useState(false);

  // Digital business card linked to this staff account (managed in /admin/cards).
  useEffect(() => {
    if (isCustomer || !user?._id) return;
    let cancelled = false;
    axiosInstance
      .get('/cards/mine')
      .then((res) => {
        if (!cancelled) setMyCard(res.data?.card || null);
      })
      .catch(() => {
        /* non-critical */
      });
    return () => {
      cancelled = true;
    };
  }, [isCustomer, user?._id]);

  const copyCardLink = useCallback(
    (slug?: string) => {
      const url = cardPublicUrl(slug);
      if (!url) return;
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success('Card link copied!'))
        .catch(() => toast.error('Failed to copy link'));
    },
    []
  );

  const downloadCardQr = useCallback((slug?: string) => {
    const canvas = document.getElementById('home-card-qr') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${slug || 'card'}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const fetchPerformance = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data: res } = await axiosInstance.get('/orders/my-performance', {
        params: { user_id: user._id },
      });
      setPerfData(res);
      // Held back a beat so the page has painted before the confetti lands —
      // a modal that appears mid-render reads as a glitch, not a reward.
      if (res?.celebration) {
        setTimeout(() => setCelebration(res.celebration), 900);
      }
    } catch {
      // non-critical
    }
  }, [user]);

  useEffect(() => {
    if (isSalesPerson) fetchPerformance();
  }, [isSalesPerson, fetchPerformance]);

  /** Dismissing is what marks it seen — the same milestone never fires twice. */
  const dismissCelebration = useCallback(() => {
    const key = celebration?.key;
    setCelebration(null);
    if (!key) return;
    axiosInstance
      .post('/orders/my-performance/celebration_seen', { key })
      .catch(() => {
        /* worst case it shows once more next load */
      });
  }, [celebration]);

  // Fetch catalogues for customer role
  const fetchCatalogues = useCallback(async () => {
    setCataloguesLoading(true);
    try {
      const resp = await axios.get(`${process.env.api_url}/catalogues`);
      setCatalogues(resp?.data || []);
    } catch (error) {
      console.error('Error fetching catalogues:', error);
    } finally {
      setCataloguesLoading(false);
    }
  }, []);

  // Brands that have just joined the catalogue, for the announcement near the
  // top of the customer home. Counts are only fetched once a new brand actually
  // exists — that is rare, and the home page should not pay for a second
  // catalogue request to render nothing. Both responses are short-cached.
  const fetchNewBrands = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/products/brands');
      const flagged: BrandRailEntry[] = (data?.brands || [])
        .filter((b: any) => b.is_new)
        .map((b: any) => ({
          brand: b.brand,
          url: b.image ?? b.url ?? null,
          description: b.description ?? null,
          color: b.color ?? null,
          is_new: true,
        }));
      setNewBrands(flagged);
      if (flagged.length) {
        const counts = await axiosInstance.get('/products/counts');
        setNewBrandCounts(counts.data || {});
      }
    } catch (error) {
      // The home page is useful without the announcement; stay quiet.
      console.error('Error fetching new brands:', error);
    }
  }, []);

  useEffect(() => {
    if (isCustomer) {
      fetchCatalogues();
      fetchNewBrands();
    }
  }, [isCustomer, fetchCatalogues, fetchNewBrands]);

  const handleOpenCatalogue = useCallback((url: string, name: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(`Opening ${name} catalogue`);
  }, []);

  const handleCopyLink = useCallback(
    (event: React.MouseEvent, url: string, name: string) => {
      event.stopPropagation();
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast.success(`${name} catalogue link copied!`);
        })
        .catch(() => {
          toast.error('Failed to copy link');
        });
    },
    []
  );

  const handleShareAllCatalogues = useCallback(() => {
    if (catalogues.length === 0) return;
    const allProductsLink = `All Products Catalogue: ${window.location.origin}/catalogues/all_products`;
    const brandLinks = catalogues
      .map((b: any) => `${b.name} Catalogue: ${b.image_url}`)
      .join('\n\n');
    navigator.clipboard
      .writeText(`${allProductsLink}\n\n${brandLinks}`)
      .then(() => toast.success('All catalogue links copied to clipboard!'))
      .catch(() => toast.error('Failed to copy links'));
  }, [catalogues]);

  // Inject a "My Digital Card" card into Resources once one exists for this
  // staff account. Opens the card in a modal (see below) rather than navigating.
  const filteredMenuSections = useMemo(() => {
    const sections = getMenuSectionsForRole(user?.role);
    if (isCustomer || !myCard?.slug) return sections;
    const resources = sections.find((s) => s.title === 'Resources');
    if (resources) {
      resources.items = [...resources.items, digitalCardItem];
      return sections;
    }
    return [...sections, { title: 'Resources', items: [digitalCardItem] }];
  }, [user?.role, myCard?.slug, isCustomer]);

  // ---- Search + frequently used -------------------------------------------
  // Both are staff-only: customers have four cards, which search would only
  // get in the way of.
  const showNavAids = !!user && !isCustomer;
  const [menuQuery, setMenuQuery] = useState('');
  const [frequentIds, setFrequentIds] = useState<string[]>([]);

  const allItems = useMemo(
    () => filteredMenuSections.flatMap((s) => s.items),
    [filteredMenuSections]
  );

  /** Same scoring the ⌘K palette uses, so a query behaves identically in both. */
  const searchResults = useMemo(() => {
    if (!menuQuery.trim()) return [];
    const entries: (NavEntry & { item: MenuItem })[] = allItems.map((item) => ({
      id: item.action,
      label: item.text,
      group: '',
      keywords: item.keywords,
      item,
    }));
    return searchEntries(entries, menuQuery).map((e) => e.item);
  }, [allItems, menuQuery]);

  const frequentItems = useMemo(() => {
    if (!showNavAids || menuQuery.trim()) return [];
    const byAction = new Map(allItems.map((i) => [i.action, i]));
    return frequentIds.map((id) => byAction.get(id)).filter(Boolean) as MenuItem[];
  }, [showNavAids, menuQuery, frequentIds, allItems]);

  // Pull the user's merged counts from the server, then recompute the row.
  // Reading after mount (rather than during render) keeps SSR hydration clean.
  useEffect(() => {
    if (!showNavAids) return;
    setFrequentIds(getFrequentIds(5));
    syncUsage((url, body) => axiosInstance.post(url, body)).then(() =>
      setFrequentIds(getFrequentIds(5))
    );
  }, [showNavAids]);

  // `brand` lands the new order's product step straight on that brand — the
  // order form reads ?brand= off the URL. Everything else is the normal new
  // order path, onboarding gate included.
  const handleNewOrder = async (brand?: string) => {
    // Self-registered B2B customers must finish onboarding before ordering.
    if (user?.self_registered && !user?.customer_id) {
      toast.info('Please complete your business details in your profile to start ordering');
      router.push('/customer/account');
      return;
    }
    try {
      const resp = await axios.post(`${process.env.api_url}/orders/`, {
        created_by: user?._id,
        status: 'draft',
      });
      const { data = {} } = resp;
      const { _id = '' } = data;
      const query = brand ? `?brand=${encodeURIComponent(brand)}` : '';
      router.push(`/orders/new/${_id}${query}`);
    } catch (error) {
      console.error('Error creating new order:', error);
    }
  };

  const handleNavigation = (action: string) => {
    // Feeds the "Frequently used" row and the palette's default ordering.
    recordUsage(action);
    switch (action) {
      case 'newOrder':
        handleNewOrder();
        break;
      case 'create_customer':
        setShowCustomerRequestForm(true);
        break;
      case 'my_customer_requests':
        router.push('/customer_requests');
        break;
      case 'pastOrder':
        router.push('/orders/past');
        break;
      case 'paymentsDue':
        router.push('/orders/past/payment_due');
        break;
      case 'catalogues':
        router.push('/catalogues');
        break;
      case 'training':
        router.push('/training');
        break;
      case 'announcements':
        router.push('/announcements');
        break;
      case 'dailyVisits':
        router.push('/daily_visits');
        break;
      case 'expenses':
        router.push('/expenses');
        break;
      case 'cheques':
        router.push('/cheques');
        break;
      case 'hooks':
        router.push('/hooks');
        break;
      case 'potential_customers':
        router.push('/potential_customers');
        break;
      case 'expected_reorder':
        router.push('/expected_reorder');
        break;
      case 'targeted_customer':
        router.push('/targeted_customer');
        break;
      case 'return_orders':
        router.push('/return_orders');
        break;
      case 'external_links':
        router.push('/external_links');
        break;
      case 'customer_analytics':
        router.push('/customer_analytics');
        break;
      case 'customer_logins':
        router.push('/customer_logins');
        break;
      case 'customer_orders':
        router.push('/customer_orders');
        break;
      // case 'check_in':
      //   router.push('/check_in');
      //   break;
      case 'shipments':
        router.push('/shipments');
        break;
      case 'new_arrivals':
        router.push('/catalogues/all_products');
        break;
      case 'my_digital_card':
        // Always open on the card itself; the QR flip is opt-in each time.
        setCardView('card');
        setCardFrameLoaded(false);
        setCardModalOpen(true);
        break;
      default:
        router.push(action);
        break;
    }
  };

  // Swipe-down-to-close for the phone/tablet sheet. The card body is an
  // iframe, so its touch events never reach this document — the drag has to
  // live on the header strip (handle + name row), which is also where a thumb
  // naturally lands.
  const cardDragStartRef = useRef<number | null>(null);
  const cardDragYRef = useRef(0);
  const [cardDragY, setCardDragY] = useState(0);
  const [cardDragging, setCardDragging] = useState(false);

  const handleCardDragStart = (e: React.TouchEvent) => {
    cardDragStartRef.current = e.touches[0].clientY;
    setCardDragging(true);
  };

  const handleCardDragMove = (e: React.TouchEvent) => {
    if (cardDragStartRef.current === null) return;
    // Downward only — dragging up shouldn't stretch the sheet.
    const dy = Math.max(0, e.touches[0].clientY - cardDragStartRef.current);
    cardDragYRef.current = dy;
    setCardDragY(dy);
  };

  const handleCardDragEnd = () => {
    if (cardDragStartRef.current === null) return;
    const dy = cardDragYRef.current;
    cardDragStartRef.current = null;
    cardDragYRef.current = 0;
    setCardDragging(false);
    setCardDragY(0);
    if (dy > 120) setCardModalOpen(false);
  };

  // Header + body + actions for the digital card, shared by the phone/tablet
  // sheet and the desktop dialog below.
  const digitalCardPanel = (
    <>
      <Box
        onTouchStart={isCardDesktop ? undefined : handleCardDragStart}
        onTouchMove={isCardDesktop ? undefined : handleCardDragMove}
        onTouchEnd={isCardDesktop ? undefined : handleCardDragEnd}
        onTouchCancel={isCardDesktop ? undefined : handleCardDragEnd}
        sx={{
          px: 2.5,
          pt: isCardDesktop ? 2 : 1.5,
          pb: 1.5,
          flexShrink: 0,
          touchAction: isCardDesktop ? undefined : 'none',
        }}
      >
        {!isCardDesktop && (
          /* Grab handle — also the swipe-down target */
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'divider',
              mx: 'auto',
              mb: 1.5,
            }}
          />
        )}

        <Stack direction='row' spacing={1.5} alignItems='center'>
          <Avatar src={myCard?.photo_url} sx={{ width: 44, height: 44 }}>
            {myCard?.name?.[0]}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction='row' alignItems='center' spacing={0.75}>
              <Typography fontWeight={700} noWrap>
                {myCard?.name || 'My card'}
              </Typography>
              {myCard?.is_active === false && (
                <Chip size='small' label='Hidden' sx={{ height: 20 }} />
              )}
            </Stack>
            {(myCard?.title || myCard?.company) && (
              <Typography variant='caption' color='text.secondary' noWrap display='block'>
                {[myCard?.title, myCard?.company].filter(Boolean).join(' · ')}
              </Typography>
            )}
          </Box>
          <Tooltip title={cardView === 'qr' ? 'Show card' : 'Show QR code'}>
            <IconButton
              onClick={() => setCardView(cardView === 'qr' ? 'card' : 'qr')}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}
            >
              {cardView === 'qr' ? <Badge fontSize='small' /> : <QrCode2 fontSize='small' />}
            </IconButton>
          </Tooltip>
          <Tooltip title='Close'>
            <IconButton onClick={() => setCardModalOpen(false)}>
              <Close fontSize='small' />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ flex: 1, minHeight: 0, position: 'relative', bgcolor: CARD_FRAME_BG }}>
        {cardView === 'card' ? (
          <>
            {myCard?.slug && (
              <Box
                component='iframe'
                key={myCard.slug}
                src={`${cardPublicUrl(myCard.slug)}?src=app`}
                title='My digital card'
                onLoad={() => setCardFrameLoaded(true)}
                sx={{ width: '100%', height: '100%', border: 0, display: 'block' }}
              />
            )}
            {!cardFrameLoaded && (
              <Skeleton
                variant='rectangular'
                sx={{ position: 'absolute', inset: 0, height: '100%' }}
              />
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', p: 3, overflowY: 'auto', height: '100%' }}>
            {myCard?.slug && (
              <Box
                sx={{
                  p: 2,
                  display: 'inline-block',
                  bgcolor: '#fff',
                  borderRadius: 2.5,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                }}
              >
                <QRCodeCanvas
                  id='home-card-qr'
                  value={`${cardPublicUrl(myCard.slug)}?src=qr`}
                  size={200}
                  level='M'
                />
              </Box>
            )}
            <Typography
              variant='caption'
              sx={{ display: 'block', mt: 1.5, wordBreak: 'break-all', color: 'rgba(255,255,255,0.7)' }}
            >
              {cardPublicUrl(myCard?.slug).replace(/^https?:\/\//, '')}
            </Typography>
            <Button
              startIcon={<Download />}
              onClick={() => downloadCardQr(myCard?.slug)}
              sx={{ mt: 1.5, textTransform: 'none', color: '#fff' }}
            >
              Download QR
            </Button>
          </Box>
        )}
      </Box>

      <Divider />

      <Stack
        direction='row'
        spacing={1}
        sx={{
          p: 2,
          pb: isCardDesktop ? 2 : 'calc(16px + env(safe-area-inset-bottom))',
          flexShrink: 0,
        }}
      >
        <Button
          variant='contained'
          startIcon={<ContentCopy />}
          onClick={() => copyCardLink(myCard?.slug)}
          sx={{ flex: 1 }}
        >
          Copy link
        </Button>
        <Tooltip title='Open in new tab'>
          <IconButton
            component='a'
            href={cardPublicUrl(myCard?.slug)}
            target='_blank'
            rel='noopener noreferrer'
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}
          >
            <OpenInNew fontSize='small' />
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  );

  // While `/users/me` is still in flight we don't yet know which homepage this
  // is. `authed` comes from the session cookie on the SSR request, so this
  // branch is what the server paints too — that's what actually removes the
  // flash. `hadSession` is the client-side fallback for the case where the page
  // was served from cache without the cookie check.
  //
  // Both are gated on `authLoading`, so a cookie that turns out to be expired
  // falls through to the landing page as soon as /me fails rather than leaving
  // a permanent skeleton.
  if (!user && authLoading && (authed || hadSession)) return <HomeBootSkeleton />;

  // Logged-out visitors get the marketing landing rather than a redirect to
  // /login. `/` is the URL Google shows for brand searches, and it used to
  // server-render as an empty shell because the dashboard is auth-gated.
  // Declared after every hook above, so hook order is unaffected.
  if (!user) return <GuestLanding brands={brands} />;

  return (
    <Box
      sx={{
        flex: 1,
        pt: { xs: 2.5, sm: 3.5 },
        pb: { xs: 5, sm: 5 },
        px: { xs: 2, sm: 2.5 },
        mx: { xs: -2, sm: -3 },
        width: '100%',
      }}
    >
      {/* Both roles get room to breathe on desktop. Customers were previously
          pinned to `sm`, which rendered as a phone-width column stranded in the
          middle of a 1440px screen. */}
      <Container maxWidth={isCustomer ? 'lg' : 'md'} disableGutters>
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          <ProfileIncompleteBanner />

          <HomeHeaderCard
            firstName={user?.first_name}
            isCustomer={isCustomer}
            isSalesPerson={isSalesPerson}
            perfData={perfData}
            onViewDetails={() => router.push('/orders/performance')}
          />

          {/* A brand that has just joined the catalogue. Same component and the
              same per-brand dismissal as the one above the order form's product
              grid — waving it away in either place settles it in both. The CTA
              opens a new draft order landed on that brand. */}
          {isCustomer && (
            <NewBrandCallout
              entries={newBrands}
              onSelectBrand={handleNewOrder}
              countOf={(brand) =>
                Object.values(newBrandCounts[brand] || {}).reduce((a, b) => a + b, 0)
              }
              ctaLabel='Start an order'
              sx={{ mt: 0, mb: { xs: 2, md: 2.5 } }}
            />
          )}

          {/* Search + shortcuts — staff only. The search box filters the grid
              below in place; ⌘K opens the same index app-wide. */}
          {showNavAids && (
            <Box sx={{ mb: 2.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.75,
                  py: 1.1,
                  borderRadius: 2.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 1,
                  '&:focus-within': { borderColor: 'primary.main' },
                }}
              >
                <SearchIcon sx={{ fontSize: 19, color: 'text.secondary', flexShrink: 0 }} />
                <InputBase
                  fullWidth
                  value={menuQuery}
                  onChange={(e) => setMenuQuery(e.target.value)}
                  placeholder='Search for a page or action…'
                  inputProps={{ 'aria-label': 'Search pages and actions' }}
                  // 16px stops iOS Safari zooming the viewport on focus.
                  sx={{ '& input': { fontSize: '16px', py: 0 } }}
                />
                {menuQuery ? (
                  <IconButton
                    size='small'
                    onClick={() => setMenuQuery('')}
                    aria-label='Clear search'
                    sx={{ p: 0.25 }}
                  >
                    <Close sx={{ fontSize: 17 }} />
                  </IconButton>
                ) : (
                  !isMobile && (
                    <Chip
                      label='⌘K'
                      size='small'
                      sx={{
                        height: 20,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: 'text.secondary',
                        flexShrink: 0,
                      }}
                    />
                  )
                )}
              </Box>
            </Box>
          )}

          {/* Frequently used — built from the user's own click history, so it
              only appears once there's enough of it to be worth the space. */}
          {frequentItems.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <SectionTitle>Frequently Used</SectionTitle>
              <Grid container spacing={1.5}>
                {frequentItems.map((item) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`freq-${item.action}`}>
                    <motion.div variants={itemVariants} whileTap={{ scale: 0.95 }}>
                      <ActionCard
                        onClick={() => handleNavigation(item.action)}
                        sx={{ '& .MuiSvgIcon-root': { color: item.color } }}
                      >
                        {item.icon}
                        <Typography
                          sx={{
                            fontWeight: 500,
                            textAlign: 'center',
                            lineHeight: 1.3,
                            fontSize: '0.78rem',
                          }}
                        >
                          {item.text}
                        </Typography>
                      </ActionCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Search results replace the grouped sections while a query is active. */}
          {menuQuery.trim() ? (
            <Box sx={{ mb: 2.5 }}>
              <SectionTitle>
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              </SectionTitle>
              {searchResults.length === 0 ? (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ px: 0.5, py: 3, textAlign: 'center' }}
                >
                  Nothing matches “{menuQuery}”.
                </Typography>
              ) : (
                <Grid container spacing={1.5}>
                  {searchResults.map((item) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`res-${item.action}`}>
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <ActionCard
                          onClick={() => handleNavigation(item.action)}
                          sx={{ '& .MuiSvgIcon-root': { color: item.color } }}
                        >
                          {item.icon}
                          <Typography
                            sx={{
                              fontWeight: 500,
                              textAlign: 'center',
                              lineHeight: 1.3,
                              fontSize: '0.78rem',
                            }}
                          >
                            {item.text}
                          </Typography>
                        </ActionCard>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          ) : (
            /* Menu Sections */
            <>
              {filteredMenuSections.map((section, sectionIndex) => (
            <Box
              key={section.title}
              sx={{ mb: 2.5 }}
              {...(sectionIndex === 0 ? { 'data-tour': 'home-orders-section' } : {})}
            >
              <SectionTitle {...(sectionIndex === 0 ? { 'data-tour': 'home-orders-header' } : {})}>
                {section.title}
              </SectionTitle>
              <Grid container spacing={1.5}>
                {section.items.map((item, index) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                    <motion.div
                      variants={itemVariants}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ActionCard
                        {...((item as any).tourId ? { 'data-tour': (item as any).tourId } : {})}
                        onClick={() => handleNavigation(item.action)}
                        sx={{
                          '& .MuiSvgIcon-root': {
                            color: item.color,
                          },
                        }}
                      >
                        {item.icon}
                        <Typography
                          sx={{
                            fontWeight: 500,
                            textAlign: 'center',
                            lineHeight: 1.3,
                            fontSize: '0.78rem',
                          }}
                        >
                          {item.text}
                        </Typography>
                      </ActionCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
              ))}
            </>
          )}

          {/* Catalogues List for Customer Role */}
          {isCustomer && (
            <Box data-tour='home-catalogues' sx={{ mb: 3 }}>
              <Box data-tour='home-catalogues-header' display='flex' alignItems='center' justifyContent='space-between' mb={1.5} px={0.5}>
                <SectionTitle sx={{ mb: 0 }}>
                  Brand Catalogues
                </SectionTitle>
                <Box display='flex' alignItems='center' gap={0.5}>
                  <Typography
                    onClick={() => router.push('/catalogues')}
                    variant='caption'
                    color='primary.main'
                    fontWeight={700}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    View all →
                  </Typography>
                  <Tooltip title='Copy all catalogue links' arrow>
                    <span>
                      <IconButton
                        size='small'
                        onClick={handleShareAllCatalogues}
                        disabled={cataloguesLoading || catalogues.length === 0}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) },
                        }}
                      >
                        <ContentCopy sx={{ fontSize: '16px' }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
              {cataloguesLoading ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: 'repeat(4, 1fr)',
                    },
                    gap: 2,
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Paper
                      key={i}
                      elevation={0}
                      sx={{
                        borderRadius: '20px',
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {/* Mirrors the dense showcase card: logo plate, then copy. */}
                      <Skeleton variant='rectangular' height={104} sx={{ transform: 'none' }} />
                      <Box sx={{ p: 2, pt: 1.5 }}>
                        <Skeleton variant='text' width='35%' height={14} />
                        <Skeleton variant='text' width='70%' height={26} />
                        <Skeleton variant='text' width='55%' height={18} />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <AnimatePresence mode='wait'>
                  <motion.div
                    variants={containerVariants}
                    initial='hidden'
                    animate='visible'
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {/* All Products Catalogue */}
                      <motion.div variants={itemVariants}>
                        <CatalogueCard
                          elevation={0}
                          onClick={() => router.push('/catalogues/all_products')}
                          sx={{
                            '&::before': { opacity: 1, background: theme.palette.secondary.main },
                            borderColor: alpha(theme.palette.secondary.main, 0.3),
                            bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.08 : 0.04),
                          }}
                        >
                          <CatalogueIconWrapper
                            sx={{
                              background: alpha(theme.palette.secondary.main, 0.12),
                              border: `1px solid ${alpha(theme.palette.secondary.main, 0.25)}`,
                            }}
                          >
                            <NewReleases
                              sx={{
                                fontSize: { xs: '20px', sm: '24px' },
                                color: 'secondary.main',
                              }}
                            />
                          </CatalogueIconWrapper>
                          <Box flex={1} minWidth={0}>
                            <Box display='flex' alignItems='center' gap={1}>
                              <Typography
                                variant='body1'
                                fontWeight='700'
                                color='text.primary'
                                noWrap
                              >
                                All Products
                              </Typography>
                              <Chip
                                label='Latest'
                                size='small'
                                color='secondary'
                                variant='outlined'
                                sx={{ fontWeight: 600, height: '20px', fontSize: '0.65rem', flexShrink: 0 }}
                              />
                            </Box>
                            <Typography variant='caption' color='text.secondary' noWrap>
                              Browse all products across brands
                            </Typography>
                          </Box>
                          <Box display='flex' gap={0.5} onClick={(e) => e.stopPropagation()} flexShrink={0}>
                            <Tooltip title='Copy link' arrow>
                              <CatalogueActionButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const url = `${window.location.origin}/catalogues/all_products`;
                                  navigator.clipboard
                                    .writeText(url)
                                    .then(() => toast.success('All Products link copied!'))
                                    .catch(() => toast.error('Failed to copy link'));
                                }}
                                size='small'
                              >
                                <ContentCopy sx={{ fontSize: '16px' }} />
                              </CatalogueActionButton>
                            </Tooltip>
                            <Tooltip title='Open catalogue' arrow>
                              <CatalogueActionButton
                                onClick={() => router.push('/catalogues/all_products')}
                                size='small'
                              >
                                <OpenInNew sx={{ fontSize: '16px' }} />
                              </CatalogueActionButton>
                            </Tooltip>
                          </Box>
                        </CatalogueCard>
                      </motion.div>

                      {/* Brand Catalogues — the same showcase card /catalogues
                          uses, in its compact variant, so a customer arriving
                          from the "new catalogue" notification sees one
                          consistent thing in both places. */}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)',
                          },
                          gap: 2,
                        }}
                      >
                        {catalogues.map((b: any, index: number) => {
                          const key = b._id || `catalogue-${index}`;
                          return (
                            <motion.div key={key} variants={itemVariants} style={{ minWidth: 0 }}>
                              <CatalogueShowcaseCard
                                dense
                                name={b.name}
                                imageUrl={b.image_url}
                                brandDetails={b.brand_details || []}
                                createdAt={b.created_at}
                                updatedAt={b.updated_at}
                                index={index + 1}
                                isCopied={copiedCatalogueKey === key}
                                onOpen={handleOpenCatalogue}
                                onCopy={(e, url, name) => {
                                  handleCopyLink(e, url, name);
                                  setCopiedCatalogueKey(key);
                                  setTimeout(
                                    () => setCopiedCatalogueKey((k) => (k === key ? null : k)),
                                    1400
                                  );
                                }}
                              />
                            </motion.div>
                          );
                        })}
                      </Box>
                    </Box>
                  </motion.div>
                </AnimatePresence>
              )}
            </Box>
          )}
        </motion.div>
      </Container>

      {/* My Digital Card — opens straight onto the live card (loaded from
          /cards/[slug]) so sharing it is one tap, not two. The QR is a flip
          away. Full screen on phones/tablets; a centred panel from md up,
          where a bottom sheet looked lost against the desktop layout. */}
      <Drawer
        anchor='bottom'
        open={cardModalOpen && !isCardDesktop}
        onClose={() => setCardModalOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            height: '100dvh',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            // Follows the thumb while dragging, springs back if the swipe was
            // too short to close.
            transform: cardDragY ? `translateY(${cardDragY}px)` : undefined,
            transition: cardDragging ? 'none' : 'transform .25s ease',
          },
        }}
      >
        {digitalCardPanel}
      </Drawer>

      <Dialog
        open={cardModalOpen && isCardDesktop}
        onClose={() => setCardModalOpen(false)}
        maxWidth='lg'
        fullWidth
        PaperProps={{
          sx: {
            height: '88vh',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {digitalCardPanel}
      </Dialog>

      {/* Customer Creation Request Form Dialog */}
      <CustomerCreationRequestForm
        open={showCustomerRequestForm}
        onClose={() => setShowCustomerRequestForm(false)}
      />

      {isCustomer && (
        <CustomerTour
          tourKey='home'
          tourSeen={user?.tour_seen?.home === true}
          steps={CUSTOMER_TOUR_STEPS}
        />
      )}

      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />
    </Box>
  );
};

export default Home;

// `/` is the marketing page for logged-out visitors, and its brand wall is
// rendered server-side so the brand names ship in the HTML for crawlers.
// Logged-in users get the dashboard, so the fetch is skipped when the auth
// cookie is present — no API call and no cache header on their requests.
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  // A session cookie means this request belongs to a logged-in user, so tell the
  // page that up front. Without it the server rendered the guest landing markup
  // — which the browser paints before any JS runs — and the real homepage only
  // replaced it once /users/me came back. No client-side hook can fix that,
  // because the flash happens before hydration.
  //
  // Presence of the cookie is not proof it's valid, and this is not treated as
  // authentication: it only picks which placeholder to paint. /users/me is
  // still what actually establishes the session.
  if (req.cookies?.access_token) return { props: { authed: true } };

  // Vary on the cookie: the same URL serves the dashboard to logged-in users,
  // so a shared cache must not hand this guest HTML to them.
  res.setHeader('Vary', 'Cookie');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');

  let brands: Brand[] = [];
  try {
    const { data } = await axios.get(
      `${process.env.api_url || 'http://localhost:8000/api'}/products/brands`,
      { timeout: 8000 }
    );
    brands = (data?.brands || []).filter((b: Brand) => b?.image);
  } catch {
    // The brand wall is supporting content — never let it break the page.
  }
  return { props: { brands } };
};
