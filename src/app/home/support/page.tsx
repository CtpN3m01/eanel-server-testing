'use client';

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useLanguage } from '@/contexts/language-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, ExternalLink, HelpCircle, Mail, Send } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col">
      <PageHeader icon={MessageCircle} title={t.support.title} />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t.support.needHelp}</h2>
            <p className="text-muted-foreground mt-2">
              {t.support.needHelpDescription}
            </p>
          </div>

          {/* Telegram Support Card */}
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                <CardTitle>{t.support.contactSupport}</CardTitle>
              </div>
              <CardDescription>
                {t.support.contactDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-primary/10 p-4">
                <p className="text-sm font-medium mb-2">{t.support.telegramSupport}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t.support.telegramMessage}
                </p>
                <a
                  href="https://t.me/ctpn3m0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button className="gap-2">
                    <Send className="h-4 w-4" />
                    {t.support.openTelegram}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t.support.whatToInclude}</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t.support.yourEmail} <span className="font-mono text-xs">{user?.email}</span></li>
                  <li>{t.support.detailedDescription}</li>
                  <li>{t.support.errorMessages}</li>
                  <li>{t.support.screenshots}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">{t.support.commonQuestions}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">{t.support.faqApprovalTime}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t.support.faqApprovalAnswer}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1">{t.support.faqModifyRequest}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t.support.faqModifyAnswer}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1">{t.support.faqRejected}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t.support.faqRejectedAnswer}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">{t.support.supportHours}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">{t.support.responseTime}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t.support.responseTimeDescription}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1">{t.support.available}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t.support.availableHours}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.support.weekendSupport}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1">{t.support.language}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t.support.languagesSupported}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>{t.support.quickLinks}</CardTitle>
              <CardDescription>
                {t.support.quickLinksDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                <Link href="/home/request-license">
                  <Button variant="outline" className="w-full justify-start">
                    {t.requests.requestLicense}
                  </Button>
                </Link>
                <Link href="/home/my-requests">
                  <Button variant="outline" className="w-full justify-start">
                    {t.requests.myRequests}
                  </Button>
                </Link>
                <a
                  href="https://t.me/ctpn3m0"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Send className="h-4 w-4" />
                    {t.support.telegramSupport}
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <HelpCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-500 mb-1">
                    {t.support.importantNotice}
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-600">
                    {t.support.securityWarning}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
