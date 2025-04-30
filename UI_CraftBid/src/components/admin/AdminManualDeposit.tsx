import React, { useState } from 'react';
import api, { makeRequest } from '@/lib/axois';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface AdminManualDepositProps {
}

const AdminManualDeposit: React.FC<AdminManualDepositProps> = () => {
    const [userId, setUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('Manual deposit by admin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await makeRequest(api.post('/admin/wallet-admin/manual-deposit', {
                user_id: parseInt(userId),
                amount: parseFloat(amount),
                description: description,
            }));

            if (response.success) {
                setSuccess(`Successfully deposited $${parseFloat(amount).toFixed(2)} to user ${userId}. New balance: $${parseFloat(response.data.new_balance).toFixed(2)}`);
                setUserId('');
                setAmount('');
                setDescription('Manual deposit by admin');
            } else {
                setError(response.error?.message || 'Failed to process manual deposit');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Manual Wallet Deposit (Testing)</CardTitle>
                <CardDescription>Add funds directly to a user's wallet.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="userId">User ID</Label>
                        <Input
                            id="userId"
                            type="number"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                            placeholder="Enter User ID"
                        />
                    </div>
                    <div>
                        <Label htmlFor="amount">Amount ($)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            placeholder="Enter amount"
                        />
                    </div>
                     <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                     {success && (
                        <Alert variant="default">
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Depositing...</>
                        ) : (
                            'Deposit Funds'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default AdminManualDeposit; 