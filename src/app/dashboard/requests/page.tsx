'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface LicenseRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  firstName: string;
  lastName: string;
  accountIds: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_payment' | 'payment_verified';
  adminNotes?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: { name: string };
  rejectedBy?: { name: string };
}

export default function LicenseRequestsPage() {
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<LicenseRequest | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [exemptDialogOpen, setExemptDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<LicenseRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const itemsPerPage = 10;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`/api/license-requests?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
        setTotalPages(data.pagination.pages);
        setTotalRequests(data.pagination.total);
      } else {
        toast.error('Failed to fetch requests');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, currentPage]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    // Reset to page 1 when filter or search changes
    setCurrentPage(1);
    setSelectedRequests(new Set());
  }, [statusFilter, searchQuery]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedRequests.size === requests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(requests.map(r => r._id)));
    }
  };

  const toggleSelectRequest = (id: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRequests(newSelected);
  };

  const clearSelection = () => {
    setSelectedRequests(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedRequests.size === 0) {
      toast.error('No hay solicitudes seleccionadas');
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedRequests.size === 0) return;

    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedRequests).map(id =>
        fetch(`/api/license-requests/${id}`, { method: 'DELETE' })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.ok).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} solicitud(es) eliminada(s) exitosamente`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} solicitud(es) no pudieron ser eliminadas`);
      }

      setBulkDeleteDialogOpen(false);
      setSelectedRequests(new Set());
      fetchRequests();
    } catch {
      toast.error('Error al eliminar solicitudes');
    } finally {
      setDeleting(false);
    }
  };

  const handleApprove = (request: LicenseRequest) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setExpiryDate(undefined);
    setApproveDialogOpen(true);
  };

  const handleReject = (request: LicenseRequest) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setRejectDialogOpen(true);
  };

  const handleDelete = (request: LicenseRequest) => {
    setRequestToDelete(request);
    setDeleteDialogOpen(true);
  };

  const handleExempt = (request: LicenseRequest) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setExpiryDate(undefined);
    setExemptDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!requestToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/license-requests/${requestToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Solicitud de licencia eliminada exitosamente');
        setDeleteDialogOpen(false);
        setRequestToDelete(null);
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete request');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const confirmApprove = async () => {
    if (!selectedRequest || !expiryDate) {
      toast.error('Please select an expiry date');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/license-requests/${selectedRequest._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          adminNotes,
          expiryDate: expiryDate.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('License request approved and license created!');
        setApproveDialogOpen(false);
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to approve request');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/license-requests/${selectedRequest._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          adminNotes,
        }),
      });

      if (response.ok) {
        toast.success('License request rejected');
        setRejectDialogOpen(false);
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to reject request');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const confirmExempt = async () => {
    if (!selectedRequest || !expiryDate) {
      toast.error('Please select an expiry date');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/license-requests/${selectedRequest._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'exempt',
          adminNotes,
          expiryDate: expiryDate.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('License request approved (payment exempted) and license created!');
        setExemptDialogOpen(false);
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to exempt request');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            <Clock className="h-3 w-3" />
            Pending Payment
          </span>
        );
      case 'payment_verified':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
            <CheckCircle2 className="h-3 w-3" />
            Payment Verified
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="License Requests"
        description="Review and manage license applications from users"
      />

      <div className="flex-1 space-y-4 p-8">
        {/* Filters and Search Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, cuenta MT5..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[180px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="pending">Pending</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="payment_verified">Payment Verified</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Selection and Bulk Actions Bar */}
          {selectedRequests.size > 0 && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {selectedRequests.size} solicitud(es) seleccionada(s)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="h-7 text-xs"
                    >
                      Limpiar selección
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={deleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar seleccionadas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Bar */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {!loading && totalRequests > 0 && (
              <p>
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalRequests)} de {totalRequests} solicitudes
              </p>
            )}
            {(statusFilter || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setSearchQuery('');
                }}
                className="h-7 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter 
                  ? 'No se encontraron solicitudes con los filtros aplicados' 
                  : 'No hay solicitudes de licencia'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select All Checkbox */}
            <Card className="bg-muted/50">
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedRequests.size === requests.length && requests.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Seleccionar todas las solicitudes en esta página
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Requests List */}
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card key={request._id} className={cn(
                  "transition-all",
                  selectedRequests.has(request._id) && "ring-2 ring-primary"
                )}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedRequests.has(request._id)}
                        onCheckedChange={() => toggleSelectRequest(request._id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle>
                              {request.firstName} {request.lastName}
                            </CardTitle>
                            <CardDescription>
                              Solicitado por: {request.userId.name} ({request.userId.email})
                            </CardDescription>
                            <CardDescription>
                              Enviado: {format(new Date(request.createdAt), 'PPP')}
                            </CardDescription>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">MT5 Account IDs</h4>
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
                        <h4 className="text-sm font-medium mb-2">Reason</h4>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(request)}
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  )}

                  {(request.status === 'pending_payment' || request.status === 'payment_verified') && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleExempt(request)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Exonerar de Pago
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(request)}
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  )}

                  {(request.status === 'approved' || request.status === 'rejected') && (
                    <>
                      <div className={cn(
                        'rounded-lg p-4',
                        request.status === 'approved' && 'bg-green-50 dark:bg-green-900/20',
                        request.status === 'rejected' && 'bg-red-50 dark:bg-red-900/20'
                      )}>
                        <p className={cn(
                          'text-sm font-medium',
                          request.status === 'approved' && 'text-green-700 dark:text-green-400',
                          request.status === 'rejected' && 'text-red-700 dark:text-red-400'
                        )}>
                          {request.status === 'approved' && `Approved by ${request.approvedBy?.name} on ${format(new Date(request.approvedAt!), 'PPP')}`}
                          {request.status === 'rejected' && `Rejected by ${request.rejectedBy?.name} on ${format(new Date(request.rejectedAt!), 'PPP')}`}
                        </p>
                        {request.adminNotes && (
                          <p className="text-sm mt-2">Note: {request.adminNotes}</p>
                        )}
                      </div>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(request)}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Approve License Request</DialogTitle>
            <DialogDescription>
              Set the expiry date for the new license
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expiry Date *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                placeholder="Add any notes for the user..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={processing || !expiryDate}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Processing...' : 'Approve & Create License'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject License Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection (optional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectNotes">Reason for Rejection</Label>
              <Textarea
                id="rejectNotes"
                placeholder="Explain why this request is being rejected..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Estás a punto de eliminar permanentemente la solicitud de licencia de{' '}
                  <strong>{requestToDelete?.firstName} {requestToDelete?.lastName}</strong>{' '}
                  ({requestToDelete?.userId.email}).
                </p>
                <p className="text-red-600 dark:text-red-400 font-medium">
                  Esta acción NO se puede deshacer. La solicitud será eliminada completamente de la base de datos
                  y el usuario no podrá verla en su historial.
                </p>
                {requestToDelete?.status === 'approved' && (
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Nota: Esta solicitud fue aprobada. Asegúrate de eliminar también la licencia asociada si es necesario.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedRequests.size} solicitud(es)?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Estás a punto de eliminar permanentemente <strong>{selectedRequests.size} solicitud(es)</strong> de licencia.
                </p>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-2">Solicitudes seleccionadas:</p>
                  <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                    {requests
                      .filter(r => selectedRequests.has(r._id))
                      .map(r => (
                        <li key={r._id} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          {r.firstName} {r.lastName} ({r.userId.email})
                        </li>
                      ))}
                  </ul>
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">
                  ⚠️ Esta acción NO se puede deshacer. Las solicitudes serán eliminadas completamente de la base de datos
                  y los usuarios no podrán verlas en su historial.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Eliminando...' : `Sí, Eliminar ${selectedRequests.size} Solicitud(es)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exempt from Payment Dialog */}
      <Dialog open={exemptDialogOpen} onOpenChange={setExemptDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Exonerar de Pago y Aprobar Licencia</DialogTitle>
            <DialogDescription>
              Esta solicitud será aprobada sin requerir pago. Establece la fecha de expiración para la licencia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expiry Date *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="exemptNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="exemptNotes"
                placeholder="Razón de la exoneración del pago..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExemptDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmExempt}
              disabled={processing || !expiryDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processing ? 'Processing...' : 'Exonerar y Crear Licencia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
