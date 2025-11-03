'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditRequestDialogProps {
  request: {
    _id: string;
    firstName: string;
    lastName: string;
    accountIds: string[];
    reason: string;
  };
  onSuccess: () => void;
}

export function EditRequestDialog({ request, onSuccess }: EditRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(request.firstName);
  const [lastName, setLastName] = useState(request.lastName);
  const [accountIds, setAccountIds] = useState<string[]>(request.accountIds);
  const [newAccountId, setNewAccountId] = useState('');
  const [reason, setReason] = useState(request.reason);

  const handleAddAccountId = () => {
    if (!newAccountId.trim()) {
      toast.error('Por favor ingresa un ID de cuenta');
      return;
    }

    if (!/^\d+$/.test(newAccountId.trim())) {
      toast.error('El ID de cuenta debe contener solo números');
      return;
    }

    if (accountIds.includes(newAccountId.trim())) {
      toast.error('Este ID de cuenta ya está agregado');
      return;
    }

    setAccountIds([...accountIds, newAccountId.trim()]);
    setNewAccountId('');
  };

  const handleRemoveAccountId = (index: number) => {
    setAccountIds(accountIds.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountIds.length === 0) {
      toast.error('Debes agregar al menos un ID de cuenta');
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !reason.trim()) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/license-requests/${request._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          accountIds,
          reason: reason.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Solicitud actualizada exitosamente');
        setOpen(false);
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al actualizar la solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ocurrió un error al actualizar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Editar Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Solicitud de Licencia</DialogTitle>
          <DialogDescription>
            Modifica los datos de tu solicitud. Los cambios se guardarán y serán revisados por el administrador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>IDs de Cuenta MT5</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                    placeholder="Ingresa un ID de cuenta"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAccountId();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddAccountId}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {accountIds.length > 0 && (
                  <div className="rounded-md border p-3 space-y-2">
                    <p className="text-sm font-medium">
                      Cuentas agregadas ({accountIds.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {accountIds.map((id, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-sm font-mono"
                        >
                          {id}
                          <button
                            type="button"
                            onClick={() => handleRemoveAccountId(index)}
                            className="ml-1 rounded-sm hover:bg-muted-foreground/20 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Razón de la solicitud</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explica por qué necesitas esta licencia..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
