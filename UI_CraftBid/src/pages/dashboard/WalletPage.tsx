import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { makeRequest } from '../../lib/axois';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowDownCircle, ArrowUpCircle, CheckCircle, Ban, 
  Info, LockIcon } from "lucide-react";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

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

interface WalletInfo {
  balance: string;
  bid_hold_total: string;
  total_deposits: string;
  total_withdrawn: string;
  formatted: {
    balance: string;
    bid_hold_total: string;
    total_deposits: string;
    total_withdrawn: string;
  };
}

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
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

  const fetchWalletInfo = async () => {
    setLoadingWallet(true);
    setError(null);
    try {
      const response = await makeRequest<WalletInfo>(api.get('/wallet/balance'));
      if (response.success) {
        setWalletInfo(response.data || null);
      } else {
        setError(response.error?.message || 'Failed to fetch wallet information');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoadingWallet(false);
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
    fetchWalletInfo();
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
            fetchWalletInfo();
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
        fetchWalletInfo();
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
    <div className="space-y-8 pb-10">
      <div className="flex items-center mb-8">
        <h1 className="text-3xl font-bold font-montserrat italic">My Wallet</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription className="font-montserrat">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-80 rounded-3xl p-8 relative overflow-hidden 
          bg-gradient-to-br from-indigo-50 via-white to-purple-50 
          border border-indigo-100 shadow-lg shadow-indigo-100/20 
          hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent1/10 from-0% via-transparent via-50% to-transparent to-90% opacity-70"></div>
          <div className="relative z-10">
            <div className="mb-6">
              <h3 className="font-montserrat text-xl font-bold text-gray-800">Available Balance</h3>
              <p className="text-sm text-gray-500 font-montserrat">
                Ready to use for bidding
              </p>
            </div>
            
            {loadingWallet ? (
              <div className="flex justify-center items-center h-44">
                <Loader2 className="h-12 w-12 animate-spin text-accent1" />
              </div>
            ) : (
              <div className="flex flex-col justify-center h-44">
                <p className="text-6xl font-bold font-montserrat text-black tracking-tight italic">
                  {walletInfo?.formatted?.balance || '0.00'} dh
                </p>
                <div className="mt-8 flex justify-between">
                  <Button
                    variant="default"
                    className="bg-black hover:bg-black/90 text-white font-montserrat rounded-xl flex justify-center items-center shadow-md shadow-black/10 hover:shadow-lg hover:translate-y-[-2px] transition-all px-5 py-6 text-base"
                    onClick={() => setShowDepositModal(true)}
                  >
                    <ArrowDownCircle className="mr-2 h-5 w-5" />
                    Deposit
                  </Button>

                  {isArtisan && (
                    <Button
                      variant="outline"
                      className="font-montserrat rounded-xl border border-black text-black flex justify-center items-center hover:bg-black/5 transition-colors px-5 py-6 text-base"
                      onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
                      disabled={loadingWallet}
                    >
                      <ArrowUpCircle className="mr-2 h-5 w-5" />
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-80 rounded-3xl p-8 relative overflow-hidden 
          bg-gradient-to-tl from-blue-50 via-white to-cyan-50 
          border border-blue-100 shadow-lg shadow-blue-100/20
          hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent1/10 from-0% via-transparent via-50% to-transparent to-90% opacity-70"></div>
          <div className="relative z-10">
            <div className="mb-6">
              <h3 className="font-montserrat text-xl font-bold text-gray-800">Funds on Hold</h3>
              <p className="text-sm text-gray-500 font-montserrat">
                Reserved for active bids
              </p>
            </div>
            
            {loadingWallet ? (
              <div className="flex justify-center items-center h-44">
                <Loader2 className="h-12 w-12 animate-spin text-accent1" />
              </div>
            ) : (
              <div className="flex items-center h-44">
                <div className="flex flex-col justify-center">
                  <p className="text-6xl font-bold font-montserrat text-black tracking-tight italic">
                    {walletInfo?.formatted?.bid_hold_total || '0.00'} dh
                  </p>
                  <p className="text-sm text-gray-500 font-montserrat mt-4">
                    Released when outbid or when auction ends
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-80 rounded-3xl p-8 relative overflow-hidden
          bg-gradient-to-tr from-emerald-50 via-white to-teal-50
          border border-emerald-100 shadow-lg shadow-emerald-100/20
          hover:shadow-xl hover:shadow-emerald-200/30 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent1/10 from-0% via-transparent via-50% to-transparent to-90% opacity-70"></div>
          <div className="relative z-10">
            <div className="mb-6">
              <h3 className="font-montserrat text-xl font-bold text-gray-800">Total Deposits</h3>
              <p className="text-sm text-gray-500 font-montserrat">
                All-time funds added
              </p>
            </div>
            
            {loadingWallet ? (
              <div className="flex justify-center items-center h-44">
                <Loader2 className="h-12 w-12 animate-spin text-accent1" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-44">
                <div className="text-center">
                  <p className="text-6xl font-bold font-montserrat text-black tracking-tight italic">
                    {walletInfo?.formatted?.total_deposits || '0.00'} dh
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-80 rounded-3xl p-8 relative overflow-hidden
          bg-gradient-to-bl from-amber-50 via-white to-orange-50
          border border-amber-100 shadow-lg shadow-amber-100/20
          hover:shadow-xl hover:shadow-amber-200/30 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent1/10 from-0% via-transparent via-50% to-transparent to-90% opacity-70"></div>
          <div className="relative z-10">
            <div className="mb-6">
              <h3 className="font-montserrat text-xl font-bold text-gray-800">
                {isArtisan ? "Total Withdrawn" : "Active Bids"}
              </h3>
              <p className="text-sm text-gray-500 font-montserrat">
                {isArtisan ? "All-time payouts" : "Current auction participation"}
              </p>
            </div>
            
            {loadingWallet ? (
              <div className="flex justify-center items-center h-44">
                <Loader2 className="h-12 w-12 animate-spin text-accent1" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-44">
                <div className="text-center">
                  <p className="text-6xl font-bold font-montserrat text-black tracking-tight italic">
                    {isArtisan ? (walletInfo?.formatted?.total_withdrawn || '0.00') : (walletInfo?.formatted?.bid_hold_total || '0.00')} dh
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden 
        bg-gradient-to-tr from-gray-50 via-white to-slate-50 
        border border-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent1/5 from-0% via-transparent via-50% to-transparent to-90% opacity-70"></div>
        <div className="px-8 py-6 border-b border-gray-100">
          <h3 className="font-bold font-montserrat text-2xl text-black">Transaction History</h3>
        </div>
        <div>
          {loadingTransactions ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-accent1" />
            </div>
          ) : transactions.length > 0 ? (
            <div>
              <div className="divide-y divide-gray-100">
                {transactions.map((tx) => {
                  const isPositive = parseFloat(tx.amount) >= 0;
                  let icon;
                  let statusColor;
                  
                  if (tx.type === 'deposit') {
                    icon = <ArrowDownCircle className={`h-5 w-5 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />;
                    statusColor = 'text-green-600';
                  } else if (tx.type === 'withdrawal' || tx.type === 'withdrawal_request') {
                    icon = <ArrowUpCircle className="h-5 w-5 text-amber-500" />;
                    statusColor = 'text-amber-600';
                  } else if (tx.type === 'bid_hold') {
                    icon = <LockIcon className="h-5 w-5 text-blue-500" />;
                    statusColor = 'text-blue-600';
                  } else if (tx.type === 'bid_release') {
                    icon = <CheckCircle className="h-5 w-5 text-green-500" />;
                    statusColor = 'text-green-600';
                  } else if (tx.type === 'fee') {
                    icon = <Ban className="h-5 w-5 text-red-500" />;
                    statusColor = 'text-red-600';
                  } else if (tx.type === 'auction_win') {
                    icon = <CheckCircle className="h-5 w-5 text-green-500" />;
                    statusColor = 'text-green-600';
                  } else {
                    icon = <Info className="h-5 w-5 text-gray-500" />;
                    statusColor = 'text-gray-600';
                  }
                  
                  return (
                    <div 
                      key={tx.id} 
                      className="flex justify-between items-center px-8 py-5 hover:bg-gray-50/70 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-3 rounded-xl mr-4 shadow-sm">
                          {icon}
                        </div>
                        
                        <div>
                          <p className={`font-medium font-montserrat capitalize ${statusColor}`}>
                            {tx.type.replace(/[_-]/g, ' ')}
                          </p>
                          <p className="text-xs text-gray-500 font-montserrat">
                            {format(new Date(tx.created_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                          {tx.description && (
                            <p className="text-xs text-gray-600 italic font-montserrat mt-1">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-2xl font-bold font-montserrat tracking-tight italic ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : '-'}{Math.abs(parseFloat(tx.amount)).toFixed(2)} dh
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {transactionPagination && transactionPagination.last_page > 1 && (
                <div className="flex justify-center items-center space-x-4 p-6 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(transactionPage - 1)}
                    disabled={transactionPage <= 1}
                    className="font-montserrat rounded-xl border-black text-black h-10 px-4 shadow-sm hover:shadow-md transition-shadow hover:bg-black/5"
                  >
                    Previous
                  </Button>
                  <span className="font-montserrat text-gray-800 text-sm font-medium">
                    Page {transactionPage} of {transactionPagination.last_page}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(transactionPage + 1)}
                    disabled={transactionPage >= transactionPagination.last_page}
                    className="font-montserrat rounded-xl border-black text-black h-10 px-4 shadow-sm hover:shadow-md transition-shadow hover:bg-black/5"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="p-6 rounded-full mb-4 bg-gradient-to-br from-gray-100 to-gray-50 shadow-inner">
                <Info className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-600 text-center font-montserrat font-medium text-lg mb-2">No transactions yet</p>
              <p className="text-gray-500 text-center text-sm font-montserrat max-w-md">
                When you make deposits, place bids, or receive funds, they'll appear here.
              </p>
              <Button 
                onClick={() => setShowDepositModal(true)}
                className="mt-6 bg-black hover:bg-black/90 text-white font-montserrat rounded-xl shadow-md shadow-black/10 hover:shadow-lg hover:translate-y-[-2px] transition-all"
              >
                <ArrowDownCircle className="mr-2 h-4 w-4" />
                Make Your First Deposit
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent className="rounded-3xl max-w-md bg-gradient-to-tr from-slate-50 via-white to-indigo-50 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent1/10 from-0% via-transparent via-50% to-transparent to-90% opacity-70 rounded-3xl"></div>
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="font-montserrat font-bold text-xl">
                Deposit Funds
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDepositSubmit} className="space-y-4 py-2">
              <div>
                <Label htmlFor="depositAmount" className="font-montserrat font-medium">Amount</Label>
                <div className="relative mt-2">
                  <Input
                    id="depositAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="10000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    className="font-montserrat rounded-xl py-6 text-lg shadow-sm focus:shadow-md transition-shadow"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">dh</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-montserrat">For testing only - no actual payment processing</p>
              </div>
              
              {depositError && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription className="font-montserrat">{depositError}</AlertDescription>
                </Alert>
              )}
              
              {depositSuccess && (
                <Alert variant="default" className="rounded-xl bg-green-50 text-green-800 border border-green-100">
                  <AlertDescription className="font-montserrat">{depositSuccess}</AlertDescription>
                </Alert>
              )}
              
              <DialogFooter className="mt-6 flex gap-3">
                <Button 
                  type="submit" 
                  disabled={submittingDeposit} 
                  className="bg-black hover:bg-black/90 text-white font-montserrat rounded-xl flex-1 shadow-md shadow-black/10 hover:shadow-lg hover:translate-y-[-2px] transition-all"
                >
                  {submittingDeposit ? 
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 
                    'Confirm Deposit'
                  }
                </Button>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="font-montserrat rounded-xl border-gray-300 hover:bg-black/5 transition-colors" 
                  >
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {isArtisan && showWithdrawalForm && (
        <div className="rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden mt-8 
          bg-gradient-to-bl from-amber-50 via-white to-orange-50 
          border border-amber-100">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent1/10 from-0% via-transparent via-50% to-transparent to-90% opacity-70"></div>
          <div className="relative z-10">
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="font-bold font-montserrat text-2xl flex items-center">
                <ArrowUpCircle className="mr-3 h-5 w-5 text-accent1" />
                Request Withdrawal
              </h3>
            </div>
            <div className="p-8">
              <form onSubmit={handleWithdrawalSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="withdrawalAmount" className="font-montserrat font-medium">Amount</Label>
                  <div className="relative mt-2">
                    <Input
                      id="withdrawalAmount"
                      type="number"
                      step="0.01"
                      min="10.00"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      required
                      className="font-montserrat rounded-xl py-6 text-lg shadow-sm focus:shadow-md transition-shadow"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">dh</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-montserrat">Minimum withdrawal: 10.00 dh</p>
                </div>
                
                <div>
                  <Label htmlFor="paymentDetails" className="font-montserrat font-medium">Payment Details</Label>
                  <Textarea
                    id="paymentDetails"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    required
                    placeholder="Enter your PayPal email, bank account details, or other payment information..."
                    className="font-montserrat rounded-xl min-h-24 mt-2 shadow-sm focus:shadow-md transition-shadow"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-montserrat">Provide clear instructions for how you wish to receive your funds</p>
                </div>

                {withdrawalError && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription className="font-montserrat">{withdrawalError}</AlertDescription>
                  </Alert>
                )}
                
                {withdrawalSuccess && (
                  <Alert variant="default" className="rounded-xl bg-green-50 text-green-800 border border-green-100">
                    <AlertDescription className="font-montserrat">{withdrawalSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-3 pt-2">
                  <Button 
                    type="submit" 
                    disabled={submittingWithdrawal} 
                    className="bg-black hover:bg-black/90 text-white font-montserrat rounded-xl flex-1 shadow-md shadow-black/10 hover:shadow-lg hover:translate-y-[-2px] transition-all"
                  >
                    {submittingWithdrawal ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="font-montserrat rounded-xl border-gray-300 hover:bg-black/5 transition-colors" 
                    onClick={() => setShowWithdrawalForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
