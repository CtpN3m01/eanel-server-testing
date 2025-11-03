'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useLanguage } from '@/contexts/language-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreditCard, Eye } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface Payment {
  _id: string;
  licenseRequestId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  subscriptionPlanId: {
    name: string;
    duration: number;
  };
  paymentMethodId: {
    name: string;
  };
  amount: number;
  currency: string;
  paymentProof: string;
  transactionReference?: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export default function MyPaymentsPage() {
  const { } = useAuth();
  const { t } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments');
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      verified: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };

    const labels: Record<string, string> = {
      pending: t.common.pending || 'Pending',
      verified: t.common.verified || 'Verified',
      rejected: t.common.rejected || 'Rejected',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const openViewDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col">
      <PageHeader icon={CreditCard} title={t.common.myPayments || 'My Payments'} />

      <main className="flex-1 p-8">
        <Card>
          <CardHeader>
            <CardTitle>{t.common.paymentHistory || 'Payment History'}</CardTitle>
            <CardDescription>
              {t.common.viewPaymentStatus || 'View the status of your payment submissions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">{t.common.loading}</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.common.noPayments || 'No payments yet'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.common.plan || 'Plan'}</TableHead>
                    <TableHead>{t.common.amount || 'Amount'}</TableHead>
                    <TableHead>{t.common.method || 'Method'}</TableHead>
                    <TableHead>{t.common.date}</TableHead>
                    <TableHead>{t.common.status}</TableHead>
                    <TableHead className="text-right">{t.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{payment.subscriptionPlanId.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {payment.subscriptionPlanId.duration} {t.common.months || 'months'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.currency} {payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{payment.paymentMethodId.name}</TableCell>
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* View Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.common.paymentDetails || 'Payment Details'}</DialogTitle>
            <DialogDescription>
              {t.common.viewPaymentInfo || 'View your payment information'}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.common.plan || 'Plan'}</Label>
                  <p className="text-sm">{selectedPayment.subscriptionPlanId.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPayment.subscriptionPlanId.duration} {t.common.months || 'months'}
                  </p>
                </div>
                <div>
                  <Label>{t.common.amount || 'Amount'}</Label>
                  <p className="text-sm">
                    {selectedPayment.currency} {selectedPayment.amount.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.common.paymentMethod || 'Payment Method'}</Label>
                  <p className="text-sm">{selectedPayment.paymentMethodId.name}</p>
                </div>
                <div>
                  <Label>{t.common.status}</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>
              {selectedPayment.transactionReference && (
                <div>
                  <Label>{t.common.transactionReference || 'Transaction Reference'}</Label>
                  <p className="text-sm font-mono">{selectedPayment.transactionReference}</p>
                </div>
              )}
              <div>
                <Label>{t.common.licensee || 'Licensee'}</Label>
                <p className="text-sm">
                  {selectedPayment.licenseRequestId.firstName} {selectedPayment.licenseRequestId.lastName}
                </p>
              </div>
              <div>
                <Label>{t.common.paymentProof || 'Payment Proof'}</Label>
                <div className="mt-2 border rounded-lg overflow-hidden relative w-full h-96">
                  <Image
                    src={selectedPayment.paymentProof}
                    alt="Payment proof"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              {selectedPayment.rejectionReason && (
                <div>
                  <Label className="text-red-600">
                    {t.common.rejectionReason || 'Rejection Reason'}
                  </Label>
                  <p className="text-sm">{selectedPayment.rejectionReason}</p>
                </div>
              )}
              {selectedPayment.status === 'pending' && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                  <CardContent className="pt-6">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {t.common.pendingVerificationMessage || 'Your payment is being verified. This usually takes 24-48 hours.'}
                    </p>
                  </CardContent>
                </Card>
              )}
              {selectedPayment.status === 'verified' && (
                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">
                  <CardContent className="pt-6">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {t.common.verifiedMessage || 'Payment verified! Your license has been created.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
