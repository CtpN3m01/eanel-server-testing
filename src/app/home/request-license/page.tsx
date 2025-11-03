'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useLanguage } from '@/contexts/language-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SubscriptionPlan {
  _id: string;
  name: string;
  duration: number;
  price: number;
  currency: string;
}

export default function RequestLicensePage() {
  const { } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [checkingPendingRequest, setCheckingPendingRequest] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    reason: '',
    subscriptionPlanId: '',
  });
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState('');
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    fetchPlans();
    checkPendingRequests();
  }, []);

  const checkPendingRequests = async () => {
    try {
      const response = await fetch('/api/license-requests');
      if (response.ok) {
        const data = await response.json();
        const pendingRequest = data.requests.find((req: { status: string }) => 
        ['pending', 'pending_payment', 'payment_verified'].includes(req.status)
      );
      
      if (pendingRequest) {
        setHasPendingRequest(true);
      }
      }
    } catch (error) {
      console.error('Error checking pending requests:', error);
    } finally {
      setCheckingPendingRequest(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error loading subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const getDurationLabel = (months: number) => {
    if (months === 1) return t.common.oneMonth || '1 Month';
    if (months === 3) return t.common.threeMonths || '3 Months';
    if (months === 6) return t.common.sixMonths || '6 Months';
    if (months === 12) return t.common.oneYear || '1 Year';
    return `${months} ${t.common.months || 'Months'}`;
  };

  const selectedPlan = plans.find(p => p._id === formData.subscriptionPlanId);

  const handleAddAccount = () => {
    const trimmedId = currentAccountId.trim();
    if (!trimmedId) {
      toast.error('Por favor ingrese un ID de cuenta');
      return;
    }

    // Validar que solo contenga números (sin espacios, puntos, comas, letras, etc.)
    if (!/^\d+$/.test(trimmedId)) {
      toast.error('El ID de cuenta solo debe contener números (sin espacios, letras o caracteres especiales)');
      return;
    }

    if (accountIds.includes(trimmedId)) {
      toast.error('Este ID de cuenta ya fue agregado');
      return;
    }

    setAccountIds([...accountIds, trimmedId]);
    setCurrentAccountId('');
    toast.success('ID de cuenta agregado exitosamente');
  };

  const handleRemoveAccount = (index: number) => {
    setAccountIds(accountIds.filter((_, i) => i !== index));
    toast.success('ID de cuenta eliminado');
  };

  const handleAccountInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAccount();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || accountIds.length === 0 || !formData.reason || !formData.subscriptionPlanId) {
      toast.error(t.requests.fillAllFields);
      return;
    }

    setLoading(true);

    try {
      if (accountIds.length === 0) {
        toast.error(t.requests.atLeastOneAccount);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/license-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          accountIds: accountIds,
          reason: formData.reason,
          subscriptionPlanId: formData.subscriptionPlanId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(t.requests.requestSubmittedSuccess);
        // Redirigir a la página de pago con el ID de la solicitud
        router.push(`/home/request-license/payment?requestId=${data.licenseRequest._id}`);
      } else {
        const data = await response.json();
        toast.error(data.error || t.requests.failedToSubmit);
      }
    } catch {
      toast.error(t.requests.failedToSubmit);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <PageHeader icon={Plus} title={t.requests.requestNewLicense} />

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <div className="mb-4">
          <Link href="/home">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.common.back}
            </Button>
          </Link>
        </div>

        {/* Loading state */}
        {checkingPendingRequest ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Verificando solicitudes pendientes...</p>
            </CardContent>
          </Card>
        ) : hasPendingRequest ? (
          /* Pending Request Warning */
          <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-900">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-1" />
                <div>
                  <CardTitle className="text-yellow-900 dark:text-yellow-100">
                    Ya tienes una solicitud pendiente
                  </CardTitle>
                  <CardDescription className="text-yellow-700 dark:text-yellow-300 mt-2">
                    No puedes crear una nueva solicitud de licencia mientras tengas una en proceso.
                    Por favor espera a que tu solicitud actual sea aprobada o rechazada.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push('/home/my-requests')}
                  className="flex-1"
                >
                  Ver Mis Solicitudes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/home')}
                  className="flex-1"
                >
                  Volver al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Request Form */
          <Card>
            <CardHeader>
              <CardTitle>{t.requests.requestNewLicense}</CardTitle>
              <CardDescription>
                {t.requests.fillDetailsBelow}
              </CardDescription>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subscription Plan Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan">
                    {t.common.subscriptionPlan || 'Subscription Plan'} *
                  </Label>
                  {loadingPlans ? (
                    <div className="text-sm text-muted-foreground">Loading plans...</div>
                  ) : (
                    <Select
                      value={formData.subscriptionPlanId}
                      onValueChange={(value: string) =>
                        setFormData({ ...formData, subscriptionPlanId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.common.selectPlan || 'Select a plan'} />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            {plan.name} - {getDurationLabel(plan.duration)} - {plan.currency} {plan.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedPlan && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">{selectedPlan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.common.duration || 'Duration'}: {getDurationLabel(selectedPlan.duration)}
                          </p>
                          <p className="text-lg font-semibold text-primary">
                            {selectedPlan.currency} {selectedPlan.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t.license.firstName} *</Label>
                  <Input
                    id="firstName"
                    placeholder=""
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{t.license.lastName} *</Label>
                  <Input
                    id="lastName"
                    placeholder=""
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountIds">Ingrese un ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="accountIds"
                    placeholder=""
                    value={currentAccountId}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Validar si contiene caracteres no numéricos
                      if (value && !/^\d+$/.test(value)) {
                        setValidationMessage(
                          'Invalid characters detected!\n\n' +
                          'The MT5 Account ID can only contain numbers.\n\n' +
                          'Not allowed:\n' +
                          '❌ Letters (a-z, A-Z)\n' +
                          '❌ Spaces\n' +
                          '❌ Dots (.)\n' +
                          '❌ Commas (,)\n' +
                          '❌ Hyphens (-)\n' +
                          '❌ Any special characters\n\n' +
                          'Example of valid ID: 19108789'
                        );
                        setShowValidationDialog(true);
                        return;
                      }
                      setCurrentAccountId(value);
                    }}
                    onKeyPress={handleAccountInputKeyPress}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <Button
                    type="button"
                    onClick={handleAddAccount}
                    disabled={!currentAccountId.trim()}
                    className="min-w-[120px]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ingrese solo números (sin espacios, letras o caracteres especiales). Presione Enter o haga clic en Agregar.
                </p>

                {/* Lista de cuentas agregadas */}
                {accountIds.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label>Cuentas Agregadas ({accountIds.length})</Label>
                    <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                      {accountIds.map((accountId, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted rounded-md px-3 py-2"
                        >
                          <span className="font-mono text-sm">{accountId}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAccount(index)}
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">{t.requests.reasonForRequest} *</Label>
                <Textarea
                  id="reason"
                  placeholder={t.requests.reasonPlaceholder}
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t.requests.reasonHelp}
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/home')}
                  disabled={loading}
                  className="flex-1"
                >
                  {t.common.cancel}
                </Button>
                <Button type="submit" disabled={loading || loadingPlans} className="flex-1">
                  {loading ? t.requests.submitting : t.common.continueToPayment || 'Continue to Payment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        )}
      </main>

      {/* Validation Alert Dialog */}
      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">
                Invalid Input
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="whitespace-pre-line text-left space-y-2 pt-2">
              {validationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowValidationDialog(false)}
              className="w-full"
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
