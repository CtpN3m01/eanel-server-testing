'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, CheckCircle2, XCircle, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { EditRequestDialog } from '@/components/home/edit-request-dialog';

interface LicenseRequest {
  _id: string;
  firstName: string;
  lastName: string;
  accountIds: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_payment' | 'payment_verified';
  adminNotes?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  subscriptionPlanId?: {
    name: string;
    duration: number;
    price: number;
    currency: string;
  };
}

export default function MyRequestsPage() {
  const { } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/license-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      } else {
        toast.error('Failed to fetch requests');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            {t.requests.pending}
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            <CreditCard className="h-3 w-3" />
            {t.requests.pendingPayment}
          </span>
        );
      case 'payment_verified':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
            <Loader2 className="h-3 w-3" />
            {t.requests.paymentVerified}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            {t.requests.approved}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            {t.requests.rejected}
          </span>
        );
    }
  };

  const getDurationLabel = (months: number) => {
    if (months === 1) return '1 Mes';
    if (months === 3) return '3 Meses';
    if (months === 6) return '6 Meses';
    if (months === 12) return '1 Año';
    return `${months} Meses`;
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-1 items-center gap-2">
          <Link href="/home">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.common.back}
            </Button>
          </Link>
          <span className="font-semibold">{t.requests.myRequests}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">{t.requests.myRequests}</h2>
          <p className="text-muted-foreground mt-2">
            {t.requests.viewStatus}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">{t.requests.noRequests}</p>
              <Link href="/home/request-license">
                <Button>{t.requests.submitFirstRequest}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>
                        {request.firstName} {request.lastName}
                      </CardTitle>
                      <CardDescription>
                        {t.requests.submittedOn} {format(new Date(request.createdAt), 'PPP')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.subscriptionPlanId && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">{t.common.subscriptionPlan || 'Plan de Suscripción'}</h4>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">{request.subscriptionPlanId.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Duración: {getDurationLabel(request.subscriptionPlanId.duration)} • Precio: {request.subscriptionPlanId.currency} {request.subscriptionPlanId.price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium mb-2">{t.license.accountIds}</h4>
                    <div className="flex flex-wrap gap-2">
                      {request.accountIds.map((id, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-mono"
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">{t.requests.reason}</h4>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex justify-end pt-2">
                      <EditRequestDialog
                        request={request}
                        onSuccess={fetchRequests}
                      />
                    </div>
                  )}

                  {request.status === 'pending_payment' && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                        {t.requests.pendingPaymentMessage}
                      </p>
                      <Link href={`/home/request-license/payment?requestId=${request._id}`}>
                        <Button size="sm" className="w-full sm:w-auto">
                          <CreditCard className="mr-2 h-4 w-4" />
                          {t.common.continueToPayment}
                        </Button>
                      </Link>
                    </div>
                  )}

                  {request.status === 'payment_verified' && (
                    <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4">
                      <p className="text-sm text-purple-700 dark:text-purple-400">
                        {t.requests.paymentVerifiedMessage}
                      </p>
                    </div>
                  )}

                  {request.status === 'approved' && request.approvedAt && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        ✓ {t.requests.approvedOn} {format(new Date(request.approvedAt), 'PPP')}
                      </p>
                      {request.adminNotes && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          {t.requests.adminNote}: {request.adminNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {request.status === 'rejected' && request.rejectedAt && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        ✗ {t.requests.rejectedOn} {format(new Date(request.rejectedAt), 'PPP')}
                      </p>
                      {request.adminNotes && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                          {t.requests.rejectionReason}: {request.adminNotes}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
