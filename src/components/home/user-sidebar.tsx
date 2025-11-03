'use client';

import * as React from 'react';
import {
  Home,
  FileText,
  LogOut,
  User,
  Plus,
  MessageCircle,
  CreditCard,
  Download,
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
}

const navItems: NavItem[] = [
  {
    titleKey: 'home',
    href: '/home',
    icon: Home,
  },
  {
    titleKey: 'requestLicense',
    href: '/home/request-license',
    icon: Plus,
  },
  {
    titleKey: 'myRequests',
    href: '/home/my-requests',
    icon: FileText,
  },
  {
    titleKey: 'myPayments',
    href: '/home/my-payments',
    icon: CreditCard,
  },
  {
    titleKey: 'downloads',
    href: '/home/downloads',
    icon: Download,
  },
  {
    titleKey: 'support',
    href: '/home/support',
    icon: MessageCircle,
  },
];

export function UserSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{t.nav.licensePortal}</span>
              <span className="text-xs text-muted-foreground">{t.nav.userPanel}</span>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="p-2">
          {navItems.map((item) => {
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
          <div className="px-2">
            <span className="inline-flex items-center rounded-md bg-blue-100 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
              {t.users.user}
            </span>
          </div>
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
