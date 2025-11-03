'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/providers/auth-provider';
import { useLanguage } from '@/contexts/language-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, ArrowLeft, Upload, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface PaymentMethod {
  _id: string;
  type: string;
  name: string;
  details: Record<string, unknown>;
  instructions: string;
}

interface LicenseRequest {
  _id: string;
  firstName: string;
  lastName: string;
  subscriptionPlanId: {
    _id: string;
    name: string;
    duration: number;
    price: number;
    currency: string;
  };
}

function PaymentPageContent() {
  const { } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [licenseRequest, setLicenseRequest] = useState<LicenseRequest | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');

  useEffect(() => {
    if (!requestId) {
      toast.error('No request ID provided');
      router.push('/home/request-license');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const fetchData = async () => {
    try {
      // Fetch payment methods
      const methodsResponse = await fetch('/api/payment-methods');
      const methodsData = await methodsResponse.json();
      setPaymentMethods(methodsData.methods || []);

      // Fetch license request
      const requestResponse = await fetch(`/api/license-requests/${requestId}`);
      if (!requestResponse.ok) {
        throw new Error('Failed to fetch license request');
      }
      const requestData = await requestResponse.json();
      setLicenseRequest(requestData.licenseRequest);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading payment information');
    } finally {
      setLoadingData(false);
    }
  };

  const selectedMethod = paymentMethods.find(m => m._id === selectedMethodId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }

      setPaymentProofFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMethodId || !paymentProofFile) {
      toast.error('Please select a payment method and upload payment proof');
      return;
    }

    setLoading(true);

    try {
      // Create payment record
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseRequestId: requestId,
          subscriptionPlanId: licenseRequest?.subscriptionPlanId._id,
          amount: licenseRequest?.subscriptionPlanId.price,
          currency: licenseRequest?.subscriptionPlanId.currency,
          paymentMethodId: selectedMethodId,
          paymentProof: paymentProofPreview,
          transactionReference: transactionReference || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Payment submitted successfully! Waiting for verification.');
        router.push('/home/my-requests');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to submit payment');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col">
        <PageHeader icon={CreditCard} title="Payment" />
        <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="text-center py-8">Loading...</div>
        </main>
      </div>
    );
  }

  if (!licenseRequest) {
    return (
      <div className="flex flex-col">
        <PageHeader icon={CreditCard} title="Payment" />
        <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="text-center py-8">
            <p className="text-muted-foreground">License request not found</p>
            <Button onClick={() => router.push('/home')} className="mt-4">
              Go Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader icon={CreditCard} title={t.common.payment || 'Payment'} />

      <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
        <div className="mb-4">
          <Link href="/home/request-license">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.common.back}
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">{t.common.payment || 'Complete Payment'}</CardTitle>
            <CardDescription>
              {t.common.reviewDetails || 'Review your order and complete the payment'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Resumen del pedido en la parte superior */}
            <div className="mb-6 grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h3 className="font-semibold mb-3 text-lg">{t.common.orderSummary || 'Order Summary'}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.common.plan || 'Plan'}:</span>
                    <span className="font-medium">{licenseRequest.subscriptionPlanId.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.common.duration || 'Duration'}:</span>
                    <span className="font-medium">{licenseRequest.subscriptionPlanId.duration}mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.common.licensee || 'Licensee'}:</span>
                    <span className="font-medium">{licenseRequest.firstName} {licenseRequest.lastName}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base font-semibold">
                    <span>{t.common.total || 'Total'}:</span>
                    <span className="text-primary">
                      {licenseRequest.subscriptionPlanId.currency} {licenseRequest.subscriptionPlanId.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900">
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium mb-1">{t.common.importantNote || 'Important'}:</p>
                        <p>{t.common.paymentVerificationNote || 'Payment verification: 24-48h'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Método de pago e instrucciones - Más ancho */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">{t.common.paymentMethod || 'Payment Method'}</h3>
                <Select
                  value={selectedMethodId}
                  onValueChange={(value: string) => setSelectedMethodId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.common.selectPaymentMethod || 'Select method'} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method._id} value={method._id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Instrucciones en layout horizontal */}
              {selectedMethod && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                  <CardContent className="p-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      {/* QR o instrucciones de texto */}
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                            {t.common.paymentInstructions || 'Instructions'}
                          </p>
                        </div>
                        
                        {selectedMethod.type !== 'binance_pay_qr' && (
                          <>
                            <div className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-line">
                              {selectedMethod.instructions}
                            </div>
                            {Object.keys(selectedMethod.details).length > 0 && (
                              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                                <p className="font-medium text-xs mb-2">{t.common.paymentDetails || 'Details'}:</p>
                                {Object.entries(selectedMethod.details).map(([key, value]) => (
                                  <div key={key} className="text-xs">
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Mostrar QR de Binance Pay en el lado derecho */}
                      {selectedMethod.type === 'binance_pay_qr' && (
                        <div className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border lg:col-span-2">
                          <div className="w-80 h-80 relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                            <Image
                              src="/payment-qr/binance-pay-qr.jpg"
                              alt="Binance Pay QR"
                              fill
                              className="object-contain p-4"
                              priority
                              unoptimized
                            />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="font-semibold text-base text-gray-900 dark:text-gray-100">
                              Escanea el código QR para pagar con la App de Binance
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Nickname: <span className="font-mono font-semibold text-lg">CtpNemo</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comprobante de pago y referencia en la parte inferior */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{t.common.paymentProof || 'Payment Proof'} *</h3>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                    <Input
                      id="paymentProof"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="paymentProof"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {paymentProofFile
                          ? paymentProofFile.name
                          : t.common.clickToUpload || 'Click to upload'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Max 5MB</span>
                    </Label>
                  </div>

                  {paymentProofPreview && (
                    <div className="border rounded-lg overflow-hidden relative w-full h-64">
                      <Image
                        src={paymentProofPreview}
                        alt="Payment proof preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{t.common.transactionReference || 'Transaction Reference'}</h3>
                  <Label htmlFor="transactionReference" className="text-sm text-muted-foreground">
                    ({t.common.optional || 'optional'})
                  </Label>
                  <Input
                    id="transactionReference"
                    placeholder="TX-123456..."
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/home/my-requests')}
                  disabled={loading}
                  className="flex-1"
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !selectedMethodId || !paymentProofFile}
                  className="flex-1"
                >
                  {loading ? t.common.submitting || 'Submitting...' : t.common.submitPayment || 'Submit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col">
        <PageHeader icon={CreditCard} title="Payment" />
        <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="text-center py-8">Loading...</div>
        </main>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
