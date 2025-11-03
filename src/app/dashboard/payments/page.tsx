'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';

interface Payment {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  licenseRequestId: {
    _id: string;
    firstName: string;
    lastName: string;
    accountIds: string[];
  };
  subscriptionPlanId: {
    _id: string;
    name: string;
    duration: number;
    price: number;
    currency: string;
  };
  paymentMethodId: {
    _id: string;
    name: string;
    type: string;
  };
  amount: number;
  currency: string;
  paymentProof: string;
  transactionReference?: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/home');
    }
  }, [user, router]);

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
      toast.error('Error loading payments');
    } finally {
      setLoading(false);
    }
  };

  const calculateDefaultExpiryDate = (duration: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + duration);
    return date.toISOString().split('T')[0];
  };

  const openVerifyDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setExpiryDate(calculateDefaultExpiryDate(payment.subscriptionPlanId.duration));
    setVerifyDialogOpen(true);
  };

  const openRejectDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const openViewDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  };

  const handleVerify = async () => {
    if (!selectedPayment || !expiryDate) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/payments/${selectedPayment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          expiryDate,
        }),
      });

      if (!response.ok) throw new Error('Failed to verify payment');

      toast.success('Payment verified and license created successfully');
      setVerifyDialogOpen(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Error verifying payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/payments/${selectedPayment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to reject payment');

      toast.success('Payment rejected');
      setRejectDialogOpen(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Error rejecting payment');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      verified: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };

    const labels: Record<string, string> = {
      pending: 'Pending',
      verified: 'Verified',
      rejected: 'Rejected',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Payment Verification" />

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Review and verify user payment submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments to review
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{payment.userId.name}</span>
                        <span className="text-xs text-muted-foreground">{payment.userId.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{payment.subscriptionPlanId.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {payment.subscriptionPlanId.duration} month(s)
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payment.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openVerifyDialog(payment)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openRejectDialog(payment)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Payment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>View payment information and proof</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User</Label>
                  <p className="text-sm">{selectedPayment.userId.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPayment.userId.email}</p>
                </div>
                <div>
                  <Label>Plan</Label>
                  <p className="text-sm">{selectedPayment.subscriptionPlanId.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPayment.subscriptionPlanId.duration} month(s)
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <p className="text-sm">
                    {selectedPayment.currency} {selectedPayment.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className="text-sm">{selectedPayment.paymentMethodId.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPayment.paymentMethodId.type}
                  </p>
                </div>
              </div>
              {selectedPayment.transactionReference && (
                <div>
                  <Label>Transaction Reference</Label>
                  <p className="text-sm font-mono">{selectedPayment.transactionReference}</p>
                </div>
              )}
              {selectedPayment.licenseRequestId && (
                <div>
                  <Label>License For</Label>
                  <p className="text-sm">
                    {selectedPayment.licenseRequestId.firstName} {selectedPayment.licenseRequestId.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Accounts: {selectedPayment.licenseRequestId.accountIds.join(', ')}
                  </p>
                </div>
              )}
              <div>
                <Label>Payment Proof</Label>
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
                  <Label className="text-red-600">Rejection Reason</Label>
                  <p className="text-sm">{selectedPayment.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Payment Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Set the license expiry date and approve the payment
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="grid gap-4 py-4">
              <div>
                <Label>User</Label>
                <p className="text-sm">{selectedPayment.userId.name}</p>
              </div>
              <div>
                <Label>Plan Duration</Label>
                <p className="text-sm">{selectedPayment.subscriptionPlanId.duration} month(s)</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiryDate">License Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Default: {selectedPayment.subscriptionPlanId.duration} month(s) from today
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={processing}>
              {processing ? 'Processing...' : 'Verify & Create License'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this payment is being rejected..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? 'Processing...' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
