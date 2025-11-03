'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';

interface PaymentMethod {
  _id: string;
  type: string;
  name: string;
  details: Record<string, unknown>;
  instructions: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    details: '',
    instructions: '',
    isActive: true,
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/home');
    }
  }, [user, router]);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods');
      const data = await response.json();
      setMethods(data.methods || []);
    } catch (error) {
      console.error('Error fetching methods:', error);
      toast.error('Error loading payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let details;
      try {
        details = JSON.parse(formData.details);
      } catch {
        details = { info: formData.details };
      }

      const url = '/api/payment-methods';
      
      let response;
      if (editingMethod) {
        // Actualizar método existente
        response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            methods: [{
              _id: editingMethod._id,
              type: formData.type,
              name: formData.name,
              details,
              instructions: formData.instructions,
              isActive: formData.isActive,
            }]
          }),
        });
      } else {
        // Crear nuevo método
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            name: formData.name,
            details,
            instructions: formData.instructions,
            isActive: formData.isActive,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save payment method');
      }

      toast.success(editingMethod ? 'Payment method updated' : 'Payment method created');
      setDialogOpen(false);
      resetForm();
      fetchMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error(error instanceof Error ? error.message : 'Error saving payment method');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const method = methods.find(m => m._id === id);
      if (!method) return;

      const response = await fetch('/api/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methods: [{ ...method, isActive: false }]
        }),
      });

      if (!response.ok) throw new Error('Failed to delete payment method');

      toast.success('Payment method deleted');
      fetchMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Error deleting payment method');
    }
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      type: method.type,
      name: method.name,
      details: JSON.stringify(method.details, null, 2),
      instructions: method.instructions,
      isActive: method.isActive,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingMethod(null);
    setFormData({
      type: 'bank_transfer',
      name: '',
      details: '',
      instructions: '',
      isActive: true,
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Transferencia Bancaria',
      crypto: 'Criptomonedas',
      binance: 'Binance',
      binance_pay_qr: 'Binance Pay QR',
      airtm: 'Airtm',
      skrill: 'Skrill',
      sinpe: 'Sinpe',
      other: 'Otros',
    };
    return labels[type] || type;
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Payment Methods" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Payment Methods</CardTitle>
              <CardDescription>
                Configure available payment methods for users
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Method
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure the payment method details and instructions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Payment Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: string) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="zelle">Zelle</SelectItem>
                          <SelectItem value="binance">Binance</SelectItem>
                          <SelectItem value="binance_pay_qr">Binance Pay QR</SelectItem>
                          <SelectItem value="airtm">Airtm</SelectItem>
                          <SelectItem value="skrill">Skrill</SelectItem>
                          <SelectItem value="sinpe">Sinpe</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Method Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Bank of America"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="details">Details (JSON format)</Label>
                      <Textarea
                        id="details"
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        placeholder='{"accountNumber": "123456", "accountName": "John Doe"}'
                        rows={4}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter payment details in JSON format or plain text
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        placeholder="Step-by-step payment instructions for users"
                        rows={4}
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isActive">Active</Label>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingMethod ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : methods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment methods yet. Add your first payment method!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method._id}>
                    <TableCell className="font-medium">
                      {getTypeLabel(method.type)}
                    </TableCell>
                    <TableCell>{method.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {method.instructions}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        method.isActive 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {method.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(method)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(method._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
