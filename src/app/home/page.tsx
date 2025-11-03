'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface RequestStats {
  pending: number;
  approved: number;
  total: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<RequestStats>({ pending: 0, approved: 0, total: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('/api/license-requests');
      if (response.ok) {
        const data = await response.json();
        const requests = data.requests || [];
        
        const pendingCount = requests.filter((r: { status: string }) => 
          r.status === 'pending' || r.status === 'pending_payment' || r.status === 'payment_verified'
        ).length;
        
        const approvedCount = requests.filter((r: { status: string }) => 
          r.status === 'approved'
        ).length;

        setStats({
          pending: pendingCount,
          approved: approvedCount,
          total: requests.length,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="flex flex-col">
      <PageHeader title={t.dashboard.welcomeUser.replace('{name}', user?.name || '')} />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            {t.nav.licensePortal}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t.dashboard.licensePortalDescription}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t.common.newRequest}
              </CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link href="/home/request-license">
                <Button className="w-full">{t.requests.requestLicense}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t.requests.myRequests}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link href="/home/my-requests">
                <Button variant="outline" className="w-full">{t.common.viewRequests}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t.requests.pending}
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats.pending}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {t.dashboard.awaitingApproval}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t.requests.approved}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats.approved}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {t.dashboard.approvedLicenses}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.howToRequestTitle}</CardTitle>
              <CardDescription>
                {t.dashboard.howToRequestDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <div>
                  <h4 className="font-medium">{t.dashboard.stepFillForm}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t.dashboard.stepFillFormDesc}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Selecciona tu Plan</h4>
                  <p className="text-sm text-muted-foreground">
                    Elige el plan de suscripción que mejor se ajuste a tus necesidades
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Realiza el Pago</h4>
                  <p className="text-sm text-muted-foreground">
                    Completa el pago de tu suscripción y sube el comprobante
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <div>
                  <h4 className="font-medium">{t.dashboard.stepWaitApproval}</h4>
                  <p className="text-sm text-muted-foreground">
                    Nuestro equipo verificará tu pago y aprobará tu solicitud
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  5
                </div>
                <div>
                  <h4 className="font-medium">{t.dashboard.stepGetLicense}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t.dashboard.stepGetLicenseDesc}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.importantInfoTitle}</CardTitle>
              <CardDescription>
                {t.dashboard.importantInfoDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <p className="text-sm">
                  {t.dashboard.ensureAccountIds}
                </p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <p className="text-sm">
                  {t.dashboard.provideAccurateInfo}
                </p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <p className="text-sm">
                  {t.dashboard.approvalTime}
                </p>
              </div>
              <div className="flex gap-2">
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm">
                  {t.dashboard.noDuplicateRequests}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
