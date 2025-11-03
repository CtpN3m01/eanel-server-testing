'use client';

import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LanguageSelector } from '@/components/language-selector';

interface PageHeaderProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
}

export function PageHeader({ icon: Icon, title }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center gap-2">
        {Icon && <Icon className="h-5 w-5" />}
        <span className="font-semibold">{title}</span>
      </div>
      <LanguageSelector />
    </header>
  );
}
