import React, { useState, useEffect } from 'react';
import api, { makeRequest, ApiResponse } from '@/lib/axois';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface Artisan {
  id: number;
  business_name: string;
  email: string;
  id_document_front_path: string | null;
  id_document_back_path: string | null;
  id_verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const AdminArtisanVerificationPage: React.FC = () => {
  const [pendingArtisans, setPendingArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchPendingArtisans = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<{ data: Artisan[] }>('/admin/artisans/verification/pending');
        setPendingArtisans(response.data.data || response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch pending artisans.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingArtisans();
  }, []);

  const handleAction = async (artisanId: number, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(prev => ({ ...prev, [artisanId]: true }));
    setError(null);

    const url = `/admin/artisans/verification/${artisanId}/${action}`;
    const payload = action === 'reject' ? { reason } : {};

    try {
      await api.patch(url, payload);
      setPendingArtisans(prev => prev.filter(a => a.id !== artisanId));
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} artisan.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [artisanId]: false }));
    }
  };

  const handleApprove = (artisanId: number) => {
    handleAction(artisanId, 'approve');
  };

  const handleReject = (artisanId: number) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      handleAction(artisanId, 'reject', reason);
    } else if (reason === '') {
      alert("Rejection reason cannot be empty.");
    }
  };

  const getDocumentUrl = (path: string | null): string | null => {
    if (!path) return null;
    return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/storage/${path}`;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Artisan ID Verification</h1>
      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading pending artisans...</p>
        </div>
      )}
      {error && !loading && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!loading && pendingArtisans.length === 0 && (
        <p className="text-center text-gray-500 py-10">No artisans are currently pending verification.</p>
      )}
      {!loading && pendingArtisans.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artisan Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingArtisans.map((artisan) => (
              <TableRow key={artisan.id}>
                <TableCell>{artisan.business_name}</TableCell>
                <TableCell>{artisan.email}</TableCell>
                <TableCell>{new Date(artisan.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {getDocumentUrl(artisan.id_document_front_path) && (
                    <a
                      href={getDocumentUrl(artisan.id_document_front_path)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Front ID
                    </a>
                  )}
                  {getDocumentUrl(artisan.id_document_back_path) && (
                    <a
                      href={getDocumentUrl(artisan.id_document_back_path)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Back ID
                    </a>
                  )}
                  {!artisan.id_document_front_path && !artisan.id_document_back_path && (
                    <span className="text-gray-400">None</span>
                  )}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprove(artisan.id)}
                    disabled={actionLoading[artisan.id]}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {actionLoading[artisan.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(artisan.id)}
                    disabled={actionLoading[artisan.id]}
                  >
                    {actionLoading[artisan.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminArtisanVerificationPage;
