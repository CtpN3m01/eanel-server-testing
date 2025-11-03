'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface License {
  _id: string;
  licenseKey: string;
  firstName: string;
  lastName: string;
  accountIds: string[];
  status: 'active' | 'inactive' | 'expired';
  expiryDate: string;
}

interface EditLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: License | null;
  onSuccess: () => void;
}

export function EditLicenseDialog({
  open,
  onOpenChange,
  license,
  onSuccess,
}: EditLicenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    accountIds: '',
    status: 'active' as 'active' | 'inactive' | 'expired',
  });
  const [expiryDate, setExpiryDate] = useState<Date>();

  useEffect(() => {
    if (license) {
      setFormData({
        firstName: license.firstName,
        lastName: license.lastName,
        accountIds: license.accountIds.join(', '),
        status: license.status,
      });
      setExpiryDate(new Date(license.expiryDate));
    }
  }, [license]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!license) return;

    setLoading(true);

    try {
      // Convertir accountIds de string a array
      const accountIdsArray = formData.accountIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '');

      const response = await fetch(`/api/licenses/${license._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          accountIds: accountIdsArray,
          status: formData.status,
          expiryDate: expiryDate?.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('License updated successfully');
        onOpenChange(false);
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update license');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!license) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit License</DialogTitle>
            <DialogDescription>
              Update license details for {license.licenseKey}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accountIds">Account IDs (MT5)</Label>
              <Input
                id="accountIds"
                placeholder="12345678, 87654321 (separated by commas)"
                value={formData.accountIds}
                onChange={(e) =>
                  setFormData({ ...formData, accountIds: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter MT5 account IDs separated by commas
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'expired' })
                }
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !expiryDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    captionLayout="dropdown-months"
                    fromYear={2024}
                    toYear={2030}
                    defaultMonth={expiryDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update License'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
