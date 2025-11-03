'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { LicenseTable } from '@/components/licenses/license-table';
import { CreateLicenseDialog } from '@/components/licenses/create-license-dialog';
import { EditLicenseDialog } from '@/components/licenses/edit-license-dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function LicensesPage() {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<string | null>(null);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/licenses?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLicenses(data.licenses);
        setTotalPages(data.pagination.pages);
      }
    } catch {
      toast.error('Failed to fetch licenses');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const handleEdit = (license: License) => {
    setSelectedLicense(license);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setLicenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!licenseToDelete) return;

    try {
      const response = await fetch(`/api/licenses/${licenseToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('License deleted successfully');
        fetchLicenses();
      } else {
        toast.error('Failed to delete license');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setDeleteDialogOpen(false);
      setLicenseToDelete(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Licenses"
        description="Manage and monitor all software licenses"
      />

      <div className="flex-1 space-y-4 p-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search licenses..."
                className="pl-8"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          {user?.role === 'admin' && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create License
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            <LicenseTable
              licenses={licenses}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              isAdmin={user?.role === 'admin'}
            />

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        onClick={() => setPage(i + 1)}
                        isActive={page === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>

      <CreateLicenseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchLicenses}
      />

      <EditLicenseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        license={selectedLicense}
        onSuccess={fetchLicenses}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              license from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
