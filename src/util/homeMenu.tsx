import {
  Assignment,
  Badge,
  CalendarMonth,
  Campaign,
  History,
  Insights,
  KeyboardReturn,
  Key,
  Link as LinkIcon,
  LineAxis,
  MenuBook,
  NewReleases,
  Payment,
  PersonAdd,
  Phishing,
  PlayCircle,
  Radar,
  Receipt,
  ReceiptLong,
  Repeat,
  Rocket,
  ShoppingCart,
} from '@mui/icons-material';
import type { ReactElement } from 'react';

/**
 * The homepage action grid, lifted out of pages/index.tsx so the command
 * palette and the homepage search can share one definition. Anything added
 * here shows up in all three surfaces automatically.
 */

export type MenuItem = {
  icon: ReactElement;
  text: string;
  color: string;
  action: string;
  restricted?: boolean;
  tourId?: string;
  /** Extra search terms — how people actually say it, not what the label says. */
  keywords?: string[];
  /** Route the palette can navigate to directly. Omitted for modal actions. */
  path?: string;
};

export type MenuSection = {
  title: string;
  restricted?: boolean;
  items: MenuItem[];
};

/** Actions allowed for customer role (scalable - add more as needed) */
export const customerAllowedActions = ['newOrder', 'pastOrder', 'shipments', 'customer'];

/**
 * Roles allowed to see restricted cards (Payments Due, Return Orders, Shipments,
 * and the entire Daily and Customers sections). Other staff roles (e.g.
 * marketing_manager, hr) do not see these.
 */
export const privilegedRoles = [
  'admin',
  'sales_admin',
  'sales_person',
  'catalogue_manager',
  'warehouse',
];

/** Grouped menu items for better organization */
export const menuSections: MenuSection[] = [
  {
    title: 'Orders',
    items: [
      {
        icon: <ShoppingCart />,
        text: 'Create New Order',
        color: '#6A5AD1',
        action: 'newOrder',
        tourId: 'home-new-order',
        keywords: ['new order', 'place order', 'order form', 'sell', 'cart', 'book'],
      },
      {
        icon: <NewReleases />,
        text: 'New Arrivals',
        color: '#e11d48',
        action: 'new_arrivals',
        path: '/catalogues/all_products',
        keywords: ['latest', 'new products', 'all products', 'launches'],
      },
      {
        icon: <History />,
        text: 'Past Orders',
        color: '#8b5cf6',
        action: 'pastOrder',
        path: '/orders/past',
        keywords: ['history', 'previous orders', 'old orders', 'drafts'],
      },
      {
        icon: <Payment />,
        text: 'Payments Due',
        color: '#ef4444',
        action: 'paymentsDue',
        path: '/orders/past/payment_due',
        restricted: true,
        keywords: ['dues', 'outstanding', 'receivables', 'pending payment', 'balance', 'collection'],
      },
      {
        icon: <KeyboardReturn />,
        text: 'Return Orders',
        color: '#f59e0b',
        action: 'return_orders',
        path: '/return_orders',
        restricted: true,
        keywords: ['returns', 'credit note', 'refund', 'send back'],
      },
      {
        icon: <Rocket />,
        text: 'Shipments',
        color: '#10b981',
        action: 'shipments',
        path: '/shipments',
        restricted: true,
        keywords: ['delivery', 'dispatch', 'tracking', 'courier', 'logistics'],
      },
      {
        icon: <LineAxis />,
        text: 'Customer Dashboard',
        color: '#64748b',
        action: 'customer',
        path: '/customer',
        keywords: ['my account', 'dashboard'],
      },
    ],
  },
  {
    title: 'Daily',
    restricted: true,
    items: [
      {
        icon: <CalendarMonth />,
        text: 'Daily Visits',
        color: '#06b6d4',
        action: 'dailyVisits',
        path: '/daily_visits',
        keywords: ['shop visit', 'field', 'check in', 'beat', 'route'],
      },
      {
        icon: <ReceiptLong />,
        text: 'Expense Estimates',
        color: '#f97316',
        action: 'expenses',
        path: '/expenses',
        keywords: ['claim', 'reimbursement', 'travel', 'bills', 'trip'],
      },
      {
        icon: <Receipt />,
        text: 'Cheques',
        color: '#7c3aed',
        action: 'cheques',
        path: '/cheques',
        keywords: ['check', 'payment received', 'deposit', 'bank'],
      },
    ],
  },
  {
    title: 'Customers',
    restricted: true,
    items: [
      {
        icon: <PersonAdd />,
        text: 'Create New Customer',
        color: '#22c55e',
        action: 'create_customer',
        keywords: ['add customer', 'onboard', 'new account', 'register shop', 'signup'],
      },
      {
        icon: <Key />,
        text: 'Customer Logins',
        color: '#6366f1',
        action: 'customer_logins',
        path: '/customer_logins',
        keywords: ['password', 'credentials', 'access', 'share login'],
      },
      {
        icon: <ShoppingCart />,
        text: 'Customer Orders',
        color: '#0ea5e9',
        action: 'customer_orders',
        path: '/customer_orders',
        keywords: ['their orders', 'by customer', 'shop orders'],
      },
      {
        icon: <LineAxis />,
        text: 'Customer Analytics',
        color: '#64748b',
        action: 'customer_analytics',
        path: '/customer_analytics',
        keywords: ['reports', 'sales data', 'insights', 'numbers', 'stats'],
      },
      {
        icon: <Repeat />,
        text: 'Expected Reorders',
        color: '#14b8a6',
        action: 'expected_reorder',
        path: '/expected_reorder',
        keywords: ['repeat', 'due to order', 'follow up', 'replenish'],
      },
      {
        icon: <Assignment />,
        text: 'My Customer Requests',
        color: '#6A5AD1',
        action: 'my_customer_requests',
        path: '/customer_requests',
        keywords: ['requests', 'pending approval', 'new customer status'],
      },
      {
        icon: <Insights />,
        text: 'Potential Customers',
        color: '#ec4899',
        action: 'potential_customers',
        path: '/potential_customers',
        keywords: ['leads', 'prospects', 'pipeline'],
      },
      {
        icon: <Phishing />,
        text: 'Set Customer Hooks',
        color: '#a855f7',
        action: 'hooks',
        path: '/hooks',
        keywords: ['hooks', 'tags', 'notes'],
      },
      {
        icon: <Radar />,
        text: 'Targeted Customers',
        color: '#f97316',
        action: 'targeted_customer',
        path: '/targeted_customer',
        keywords: ['targets', 'focus list', 'campaign'],
      },
    ],
  },
  {
    title: 'Resources',
    items: [
      {
        icon: <Campaign />,
        text: 'Announcements',
        color: '#f59e0b',
        action: 'announcements',
        path: '/announcements',
        restricted: true,
        keywords: ['news', 'updates', 'notice'],
      },
      {
        icon: <MenuBook />,
        text: 'Catalogues',
        color: '#0d9488',
        action: 'catalogues',
        path: '/catalogues',
        keywords: ['catalog', 'brochure', 'pdf', 'brands', 'price list'],
      },
      {
        icon: <LinkIcon />,
        text: 'External Links',
        color: '#6b7280',
        action: 'external_links',
        path: '/external_links',
        restricted: true,
        keywords: ['links', 'tools', 'greythr', 'drive'],
      },
      {
        icon: <PlayCircle />,
        text: 'Training Videos',
        color: '#d946ef',
        action: 'training',
        path: '/training',
        restricted: true,
        keywords: ['learn', 'videos', 'how to', 'onboarding'],
      },
    ],
  },
];

/** The digital-card item, injected into Resources once the user has a card. */
export const digitalCardItem: MenuItem = {
  icon: <Badge />,
  text: 'My Digital Card',
  color: '#0ea5e9',
  action: 'my_digital_card',
  keywords: ['business card', 'vcard', 'qr', 'share contact'],
};

/**
 * Role-filtered sections. Customers get a short allow-list with no Resources;
 * non-privileged staff lose the restricted sections and items.
 */
export const getMenuSectionsForRole = (userRole?: string): MenuSection[] => {
  if (userRole === 'customer') {
    return menuSections
      .filter((section) => section.title !== 'Resources')
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => customerAllowedActions.includes(item.action)),
      }))
      .filter((section) => section.items.length > 0);
  }

  // For non-customer roles (salesperson, admin), hide Customer Dashboard.
  // Restricted sections/items are only shown to privileged roles.
  const isPrivileged = privilegedRoles.includes(userRole || '');
  return menuSections
    .filter((section) => isPrivileged || !section.restricted)
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.action !== 'customer' && (isPrivileged || !item.restricted)
      ),
    }))
    .filter((section) => section.items.length > 0);
};
