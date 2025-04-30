import React, { useState, useEffect } from 'react';
import api, { makeRequest } from '@/lib/axois';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface WithdrawalRequest {
  id: number;
  user_id: number;
  wallet_id: number;
  amount: string;
  status: string;
  payment_details: string | null;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

const AdminWithdrawalManagementPage: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<any>, 'data'> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');

  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async (page = 1, status = 'pending') => {
    setLoading(true);
    setError(null);
    try {
      const response = await makeRequest<PaginatedResponse<WithdrawalRequest>>(
        api.get(`/admin/wallet-admin/withdrawals?status=${status}&page=${page}`)
      );
      if (response.success) {
        setRequests(response.data?.data || []);
        setPagination(response.data);
        setCurrentPage(response.data?.current_page || 1);
      } else {
        setError(response.error?.message || 'Failed to fetch withdrawal requests');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await makeRequest(api.patch(`/admin/wallet-admin/withdrawals/${selectedRequest.id}/approve`, {
        admin_notes: adminNotes
      }));
      if (response.success) {
        fetchRequests(currentPage, statusFilter);
        setSelectedRequest(null);
      } else {
        setActionError(response.error?.message || 'Failed to approve');
      }
    } catch (err: any) {
      setActionError(err.message || 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
     if (!selectedRequest || !rejectReason) {
        setActionError('Reason for rejection is required.');
        return;
     };
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await makeRequest(api.patch(`/admin/wallet-admin/withdrawals/${selectedRequest.id}/reject`, {
        reason: rejectReason
      }));
      if (response.success) {
        fetchRequests(currentPage, statusFilter);
        setSelectedRequest(null); 
      } else {
        setActionError(response.error?.message || 'Failed to reject');
      }
    } catch (err: any) {
      setActionError(err.message || 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

   const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.last_page ?? 1)) {
        setCurrentPage(page);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Withdrawal Requests Management</h1>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="flex space-x-2 mb-4">
            {['pending', 'approved', 'rejected', 'processing', 'completed'].map(status => (
                <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
            ))}
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests ({statusFilter})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500">No {statusFilter} requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.id}</TableCell>
                    <TableCell>
                        {req.user.name}<br/>
                        <span className="text-xs text-gray-500">{req.user.email}</span>
                    </TableCell>
                    <TableCell>${parseFloat(req.amount).toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(req.requested_at), 'Pp')}</TableCell>
                    <TableCell><Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'approved' || req.status === 'completed' ? 'default' : 'destructive'}>{req.status}</Badge></TableCell>
                    <TableCell>
                        <Dialog onOpenChange={(open) => !open && setSelectedRequest(null)}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)}>
                                    View Details
                                </Button>
                            </DialogTrigger>
                            {selectedRequest && selectedRequest.id === req.id && (
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                <DialogTitle>Withdrawal Request #{selectedRequest.id}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <p><strong>User:</strong> {selectedRequest.user.name} ({selectedRequest.user.email})</p>
                                    <p><strong>Amount:</strong> ${parseFloat(selectedRequest.amount).toFixed(2)}</p>
                                    <p><strong>Requested:</strong> {format(new Date(selectedRequest.requested_at), 'PPp')}</p>
                                    <p><strong>Status:</strong> <Badge variant={selectedRequest.status === 'pending' ? 'secondary' : selectedRequest.status === 'approved' || selectedRequest.status === 'completed' ? 'default' : 'destructive'}>{selectedRequest.status}</Badge></p>
                                    <div className="space-y-1">
                                        <p><strong>Payment Details:</strong></p>
                                        <pre className="text-sm p-2 bg-gray-100 rounded whitespace-pre-wrap font-mono">{selectedRequest.payment_details || 'N/A'}</pre>
                                    </div>
                                    {selectedRequest.admin_notes && (
                                        <div className="space-y-1">
                                            <p><strong>Admin Notes:</strong></p>
                                            <pre className="text-sm p-2 bg-yellow-100 rounded whitespace-pre-wrap">{selectedRequest.admin_notes}</pre>
                                        </div>
                                    )}
                                    {selectedRequest.processed_at && <p><strong>Processed:</strong> {format(new Date(selectedRequest.processed_at), 'PPp')}</p>}

                                    {selectedRequest.status === 'pending' && (
                                        <>
                                            <hr className="my-4" />
                                            <div className="space-y-2">
                                                <Label htmlFor="adminNotes">Admin Notes (Optional for Approve)</Label>
                                                <Textarea id="adminNotes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes for approval..." />
                                            </div>
                                             <Button onClick={handleApprove} disabled={actionLoading}>
                                                {actionLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Approve & Process'}
                                            </Button>

                                             <hr className="my-4" />
                                              <div className="space-y-2">
                                                <Label htmlFor="rejectReason">Reason for Rejection</Label>
                                                <Textarea id="rejectReason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter reason..." required={true}/>
                                            </div>
                                            <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectReason}>
                                                {actionLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Reject'}
                                            </Button>
                                            {actionError && <Alert variant="destructive" className="mt-2"><AlertDescription>{actionError}</AlertDescription></Alert>}
                                        </>
                                    )}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">Close</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                            )}
                        </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
           {pagination && pagination.last_page > 1 && (
             <div className="flex justify-center items-center space-x-2 mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    Previous
                </Button>
                <span>Page {currentPage} of {pagination.last_page}</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.last_page}
                >
                    Next
                </Button>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWithdrawalManagementPage; 