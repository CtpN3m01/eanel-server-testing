'use client';

import * as React from 'react';
import {
  Key,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Shield,
  FileText,
  CreditCard,
  Package,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/components/providers/auth-provider';
import { useLanguage } from '@/contexts/language-context';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  titleKey: keyof typeof import('@/lib/i18n').translations.en.nav;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    titleKey: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    titleKey: 'licenses',
    href: '/dashboard/licenses',
    icon: Key,
  },
  {
    titleKey: 'licenseRequests',
    href: '/dashboard/requests',
    icon: FileText,
    adminOnly: true,
  },
  {
    titleKey: 'users',
    href: '/dashboard/users',
    icon: Users,
    adminOnly: true,
  },
  {
    titleKey: 'subscriptionPlans',
    href: '/dashboard/subscription-plans',
    icon: Package,
    adminOnly: true,
  },
  {
    titleKey: 'paymentMethods',
    href: '/dashboard/payment-methods',
    icon: Wallet,
    adminOnly: true,
  },
  {
    titleKey: 'payments',
    href: '/dashboard/payments',
    icon: CreditCard,
    adminOnly: true,
  },
  {
    titleKey: 'settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{t.nav.licenseManager}</span>
              <span className="text-xs text-muted-foreground">{t.nav.adminPanel}</span>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="p-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span>{t.nav[item.titleKey]}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{user?.name}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>
          {user?.role === 'admin' && (
            <div className="px-2">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {t.users.admin}
              </span>
            </div>
          )}
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t.common.logout}
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
