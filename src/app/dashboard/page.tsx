'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { useLanguage } from '@/contexts/language-context';
import { Key, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  totalUsers: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [licensesRes, usersRes] = await Promise.all([
        fetch('/api/licenses'),
        user?.role === 'admin' ? fetch('/api/users') : Promise.resolve(null),
      ]);

      const licensesData = await licensesRes.json();
      const licenses = licensesData.licenses || [];

      interface License {
        status: string;
      }

      const activeLicenses = licenses.filter((l: License) => l.status === 'active').length;
      const expiredLicenses = licenses.filter((l: License) => l.status === 'expired').length;

      let totalUsers = 0;
      if (usersRes) {
        const usersData = await usersRes.json();
        totalUsers = usersData.pagination?.total || 0;
      }

      setStats({
        totalLicenses: licenses.length,
        activeLicenses,
        expiredLicenses,
        totalUsers,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title={t.nav.dashboard}
        description={t.dashboard.overviewDescription}
      />

      <div className="flex-1 space-y-4 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {t.dashboard.welcomeBack}, {user?.name}!
            </h2>
            <p className="text-muted-foreground">
              {t.dashboard.hereIsWhatsHappening}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="mt-2 h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.dashboard.totalLicenses}
                  </CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLicenses}</div>
                  <p className="text-xs text-muted-foreground">
                    {t.dashboard.allLicensesInSystem}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.dashboard.activeLicenses}
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeLicenses}</div>
                  <p className="text-xs text-muted-foreground">
                    {t.dashboard.currentlyActiveLicenses}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.dashboard.expiredLicenses}
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.expiredLicenses}</div>
                  <p className="text-xs text-muted-foreground">
                    {t.dashboard.needRenewalAttention}
                  </p>
                </CardContent>
              </Card>

              {user?.role === 'admin' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t.dashboard.totalUsers}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {t.dashboard.registeredUsers}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>{t.dashboard.recentActivity}</CardTitle>
              <CardDescription>
                {t.dashboard.latestOperations}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t.dashboard.activityLogsWillAppear}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>{t.dashboard.quickActions}</CardTitle>
              <CardDescription>
                {t.dashboard.commonTasks}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t.dashboard.quickActionButtons}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
