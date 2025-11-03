'use client';

import * as React from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/language-context';
import { Language } from '@/lib/i18n';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = React.useState(false);

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0"
          aria-label="Select language"
        >
          <Languages className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="end">
        <div className="space-y-1">
          {languages.map((lang) => (
            <Button
              key={lang.value}
              variant={language === lang.value ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setLanguage(lang.value);
                setOpen(false);
              }}
            >
              <span className="mr-2 text-base">{lang.flag}</span>
              <span className="text-sm">{lang.label}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
