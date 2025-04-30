import React, { useState, useEffect } from 'react';
import api, { makeRequest } from '@/lib/axois';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';

interface Transaction {
  id: number;
  amount: string;
  type: string;
  description: string | null;
  status: string;
  created_at: string;
  auction_id: number | null;
  wallet: {
      user: {
          id: number;
          name: string;
          email: string;
      } | null;
  } | null;
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

interface SummaryStats {
    totalRevenue: number;
    totalVolumeTransacted: number;
    pendingWithdrawalsTotal: number;
    totalUserBalances: number;
}

const AdminFinancialReportsPage: React.FC = () => {
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pagination, setPagination] = useState<Omit<PaginatedResponse<any>, 'data'> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const fetchSummary = async () => {
        setLoadingSummary(true);
        setError(null);
        try {
            const response = await makeRequest<SummaryStats>(api.get('/admin/reports/summary'));
            if (response.success) {
                setSummary(response.data);
            } else {
                setError(response.error?.message || 'Failed to load summary');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred loading summary');
        } finally {
            setLoadingSummary(false);
        }
    };

    const fetchTransactions = async (page = 1) => {
        setLoadingTransactions(true);
        try {
            const response = await makeRequest<PaginatedResponse<Transaction>>(api.get(`/admin/reports/transactions?page=${page}`));
            if (response.success) {
                setTransactions(response.data?.data || []);
                setPagination(response.data);
                setCurrentPage(response.data?.current_page || 1);
            } else {
                setError(response.error?.message || 'Failed to load transactions');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred loading transactions');
        } finally {
            setLoadingTransactions(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchTransactions(currentPage);
    }, [currentPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= (pagination?.last_page ?? 1)) {
            setCurrentPage(page);
        }
    }

    const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A';
        return `$${value.toFixed(2)}`;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Financial Reports</h1>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <Card>
                <CardHeader>
                    <CardTitle>Platform Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingSummary ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard title="Total Revenue (Commissions)" value={formatCurrency(summary?.totalRevenue)} />
                            <StatCard title="Total Volume Transacted" value={formatCurrency(summary?.totalVolumeTransacted)} />
                            <StatCard title="Pending Withdrawals" value={formatCurrency(summary?.pendingWithdrawalsTotal)} />
                            <StatCard title="Total User Balances" value={formatCurrency(summary?.totalUserBalances)} />
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingTransactions ? (
                        <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : transactions.length === 0 ? (
                        <p className="text-center text-gray-500">No transactions found.</p>
                    ) : (
                       <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.id}</TableCell>
                                    <TableCell>
                                        {tx.wallet?.user?.name ?? 'N/A'}<br/>
                                        <span className="text-xs text-gray-500">{tx.wallet?.user?.email ?? '-'}</span>
                                    </TableCell>
                                    <TableCell className="capitalize">{tx.type.replace('_', ' ')}</TableCell>
                                    <TableCell className={`font-medium ${parseFloat(tx.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                         {parseFloat(tx.amount) < 0 ? '-' : ''}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                                    </TableCell>
                                    <TableCell>{tx.status}</TableCell>
                                    <TableCell>{format(new Date(tx.created_at), 'Pp')}</TableCell>
                                    <TableCell className="text-xs max-w-xs truncate">{tx.description}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>

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
                       </>
                    )}
                </CardContent>
             </Card>

        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);

export default AdminFinancialReportsPage; 