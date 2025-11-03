'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Copy, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface License {
  _id: string;
  licenseKey: string;
  firstName: string;
  lastName: string;
  accountIds: string[];
  status: 'active' | 'inactive' | 'expired';
  expiryDate: string;
  createdAt: string;
}

interface LicenseTableProps {
  licenses: License[];
  onEdit: (license: License) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export function LicenseTable({ licenses, onEdit, onDelete, isAdmin }: LicenseTableProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('License key copied to clipboard');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = 'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium';
    switch (status) {
      case 'active':
        return `${baseClass} bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400`;
      case 'expired':
        return `${baseClass} bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400`;
      case 'inactive':
        return `${baseClass} bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400`;
      default:
        return baseClass;
    }
  };

  if (licenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No licenses found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>License Key</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Account IDs</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Created</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license) => (
            <TableRow key={license._id}>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span>{license.licenseKey}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(license.licenseKey)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {license.firstName} {license.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {license.accountIds.length} account(s)
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {license.accountIds.slice(0, 3).map((accountId, idx) => (
                    <span key={idx} className="text-xs font-mono">
                      {accountId}
                    </span>
                  ))}
                  {license.accountIds.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{license.accountIds.length - 3} more
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={getStatusBadge(license.status)}>
                  {getStatusIcon(license.status)}
                  {license.status}
                </span>
              </TableCell>
              <TableCell>
                {format(new Date(license.expiryDate), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                {format(new Date(license.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(license)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(license._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
