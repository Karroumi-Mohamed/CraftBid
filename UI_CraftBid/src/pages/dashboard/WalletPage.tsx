import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { makeRequest } from '../../lib/axois';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Import Dialog components

interface Transaction {
  id: number;
  amount: string;
  type: string;
  description: string | null;
  status: string;
  created_at: string;
  auction_id: number | null;
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

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPagination, setTransactionPagination] = useState<Omit<PaginatedResponse<any>, 'data'> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);

  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState<string | null>(null);

  const isArtisan = user?.roles?.some(role => role.name === 'artisan');

  const fetchBalance = async () => {
    setLoadingBalance(true);
    setError(null);
    try {
      const response = await makeRequest<{ balance: string }>(api.get('/wallet/balance'));
      if (response.success) {
        setBalance(parseFloat(response.data?.balance || '0'));
      } else {
        setError(response.error?.message || 'Failed to fetch balance');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchTransactions = async (page = 1) => {
    setLoadingTransactions(true);
    try {
      const response = await makeRequest<PaginatedResponse<Transaction>>(api.get(`/wallet/transactions?page=${page}`));
      if (response.success) {
        setTransactions(response.data?.data || []);
        setTransactionPagination(response.data);
        setTransactionPage(response.data?.current_page || 1);
      } else {
        setError(response.error?.message || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDeposit(true);
    setDepositError(null);
    setDepositSuccess(null);

    try {
        const response = await makeRequest(api.post('/wallet/manual-deposit', {
            amount: parseFloat(depositAmount),
        }));

        if (response.success) {
            setDepositSuccess(`Successfully deposited $${parseFloat(depositAmount).toFixed(2)}!`);
            setDepositAmount('');
            setShowDepositModal(false);
            fetchBalance();
            fetchTransactions();
        } else {
            setDepositError(response.error?.message || 'Failed to process deposit');
        }
    } catch (err: any) {
        setDepositError(err.message || 'An error occurred');
    } finally {
        setSubmittingDeposit(false);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isArtisan) return;

    setSubmittingWithdrawal(true);
    setWithdrawalError(null);
    setWithdrawalSuccess(null);

    try {
      const response = await makeRequest(api.post('/wallet/withdrawal-requests', {
        amount: parseFloat(withdrawalAmount),
        payment_details: paymentDetails,
      }));

      if (response.success) {
        setWithdrawalSuccess('Withdrawal request submitted!');
        setWithdrawalAmount('');
        setPaymentDetails('');
        setShowWithdrawalForm(false);
        fetchBalance();
      } else {
        setWithdrawalError(response.error?.message || 'Failed to submit request');
      }
    } catch (err: any) {
      setWithdrawalError(err.message || 'An error occurred');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (transactionPagination?.last_page ?? 1)) {
        fetchTransactions(page);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Wallet</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBalance ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <p className="text-3xl font-bold">
              ${balance !== null ? balance.toFixed(2) : 'N/A'}
            </p>
          )}

          <Button
            variant="default"
            className="mt-4 mr-2"
            onClick={() => setShowDepositModal(true)}
          >
             Deposit Funds (Test)
          </Button>

          {isArtisan && (
            <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
            >
                {showWithdrawalForm ? 'Cancel Withdrawal' : 'Request Withdrawal'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Deposit Funds (Manual Test)</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDepositSubmit} className="space-y-4 py-4">
                <div>
                    <Label htmlFor="depositAmount">Amount ($)</Label>
                    <Input
                        id="depositAmount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="10000"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        required
                    />
                </div>
                {depositError && (
                    <Alert variant="destructive"><AlertDescription>{depositError}</AlertDescription></Alert>
                )}
                 {depositSuccess && (
                    <Alert variant="default"><AlertDescription>{depositSuccess}</AlertDescription></Alert>
                )}
                 <DialogFooter>
                    <Button type="submit" disabled={submittingDeposit}>
                        {submittingDeposit ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Depositing...</> : 'Confirm Deposit'}
                    </Button>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {isArtisan && showWithdrawalForm && (
        <Card>
            <CardHeader><CardTitle>Request Withdrawal</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="withdrawalAmount">Amount ($)</Label>
                        <Input
                            id="withdrawalAmount"
                            type="number"
                            step="0.01"
                            min="10.00"
                            value={withdrawalAmount}
                            onChange={(e) => setWithdrawalAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="paymentDetails">Payment Details (e.g., PayPal Email, Bank Info)</Label>
                        <Textarea
                            id="paymentDetails"
                            value={paymentDetails}
                            onChange={(e) => setPaymentDetails(e.target.value)}
                            required
                            placeholder="Enter details where funds should be sent..."
                        />
                    </div>

                    {withdrawalError && (
                        <Alert variant="destructive">
                            <AlertDescription>{withdrawalError}</AlertDescription>
                        </Alert>
                    )}
                    {withdrawalSuccess && (
                        <Alert variant="default">
                            <AlertDescription>{withdrawalSuccess}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={submittingWithdrawal}>
                        {submittingWithdrawal ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                        ) : (
                            'Submit Request'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                  <div>
                    <p className={`font-medium capitalize ${parseFloat(tx.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(tx.created_at), 'PPp')}
                    </p>
                    {tx.description && <p className="text-sm text-gray-600 italic">{tx.description}</p>}
                  </div>
                  <p className={`font-bold text-lg ${parseFloat(tx.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {parseFloat(tx.amount) < 0 ? '-' : ''}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No transactions yet.</p>
          )}
          {transactionPagination && transactionPagination.last_page > 1 && (
             <div className="flex justify-center items-center space-x-2 mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(transactionPage - 1)}
                    disabled={transactionPage <= 1}
                >
                    Previous
                </Button>
                <span>Page {transactionPage} of {transactionPagination.last_page}</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(transactionPage + 1)}
                    disabled={transactionPage >= transactionPagination.last_page}
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

export default WalletPage;
