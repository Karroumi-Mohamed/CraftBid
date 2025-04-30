import React, { useState, useEffect } from 'react';
import api, { makeRequest } from '@/lib/axois';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const appSettingsSchema = z.object({
    min_auction_duration_hours: z.coerce.number().int().min(1, "Must be at least 1 hour"),
    max_auction_duration_days: z.coerce.number().int().min(1, "Must be at least 1 day"),
    commission_rate_percent: z.coerce.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
}).refine(data => (data.max_auction_duration_days * 24) >= data.min_auction_duration_hours, {
    message: "Max duration (in hours) must be greater than or equal to min duration.",
    path: ["max_auction_duration_days"],
});
type AppSettingsFormData = z.infer<typeof appSettingsSchema>;

const passwordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    new_password_confirmation: z.string(),
}).refine(data => data.new_password === data.new_password_confirmation, {
    message: "New passwords do not match",
    path: ["new_password_confirmation"],
});
type PasswordFormData = z.infer<typeof passwordSchema>;


const AdminSettingsPage: React.FC = () => {
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);
    const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);

    const {
        register: registerAppSettings,
        handleSubmit: handleAppSettingsSubmit,
        reset: resetAppSettingsForm,
        formState: { errors: appSettingsErrors }
    } = useForm<AppSettingsFormData>({
        resolver: zodResolver(appSettingsSchema),
        defaultValues: {
            min_auction_duration_hours: 1,
            max_auction_duration_days: 14,
            commission_rate_percent: 10,
        }
    });

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        reset: resetPasswordForm,
        formState: { errors: passwordErrors }
    } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    useEffect(() => {
        const fetchSettings = async () => {
            setLoadingSettings(true);
            setError(null);
            try {
                const response = await makeRequest<Record<string, string>>(api.get('/admin/settings/'));
                if (response.success && response.data) {
                    resetAppSettingsForm({
                        min_auction_duration_hours: Number(response.data.min_auction_duration_hours ?? 1),
                        max_auction_duration_days: Number(response.data.max_auction_duration_days ?? 14),
                        commission_rate_percent: Number(response.data.commission_rate_percent ?? 10),
                    });
                } else {
                    setError(response.error?.message || 'Failed to load settings');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [resetAppSettingsForm]);

    const onAppSettingsSubmit: SubmitHandler<AppSettingsFormData> = async (data) => {
        setSavingSettings(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await makeRequest(api.put('/admin/settings/', data));
            if (response.success) {
                setSuccessMessage('Application settings updated successfully!');
            } else {
                setError(response.error?.message || 'Failed to save settings');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setSavingSettings(false);
        }
    };

    const onPasswordSubmit: SubmitHandler<PasswordFormData> = async (data) => {
        setSavingPassword(true);
        setPasswordErrorMessage(null);
        setPasswordSuccessMessage(null);
        try {
            const response = await makeRequest(api.post('/admin/settings/update-password', {
                current_password: data.current_password,
                new_password: data.new_password,
                new_password_confirmation: data.new_password_confirmation,
            }));
            if (response.success) {
                setPasswordSuccessMessage('Password updated successfully!');
                resetPasswordForm();
            } else {
                setPasswordErrorMessage(response.error?.message || 'Failed to update password');
            }
        } catch (err: any) {
             setPasswordErrorMessage(err.message || 'An error occurred');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Admin Settings</h1>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <Card>
                <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                    <CardDescription>Configure platform rules and parameters.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingSettings ? (
                         <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : (
                        <form onSubmit={handleAppSettingsSubmit(onAppSettingsSubmit)} className="space-y-4">
                            {successMessage && <Alert variant="default"><AlertDescription>{successMessage}</AlertDescription></Alert>}

                            <div>
                                <Label htmlFor="min_auction_duration_hours">Min Auction Duration (Hours)</Label>
                                <Input id="min_auction_duration_hours" type="number" {...registerAppSettings('min_auction_duration_hours')} />
                                {appSettingsErrors.min_auction_duration_hours && <p className="text-sm text-red-500 mt-1">{appSettingsErrors.min_auction_duration_hours.message}</p>}
                            </div>

                            <div>
                                <Label htmlFor="max_auction_duration_days">Max Auction Duration (Days)</Label>
                                <Input id="max_auction_duration_days" type="number" {...registerAppSettings('max_auction_duration_days')} />
                                {appSettingsErrors.max_auction_duration_days && <p className="text-sm text-red-500 mt-1">{appSettingsErrors.max_auction_duration_days.message}</p>}
                            </div>

                            <div>
                                <Label htmlFor="commission_rate_percent">Platform Commission Rate (%)</Label>
                                <Input id="commission_rate_percent" type="number" step="0.1" {...registerAppSettings('commission_rate_percent')} />
                                {appSettingsErrors.commission_rate_percent && <p className="text-sm text-red-500 mt-1">{appSettingsErrors.commission_rate_percent.message}</p>}
                            </div>

                            <Button type="submit" disabled={savingSettings}>
                                {savingSettings ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save App Settings'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
                    
             <Card>
                <CardHeader>
                    <CardTitle>Change Admin Password</CardTitle>
                </CardHeader>
                 <CardContent>
                    <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                        {passwordSuccessMessage && <Alert variant="default"><AlertDescription>{passwordSuccessMessage}</AlertDescription></Alert>}
                        {passwordErrorMessage && <Alert variant="destructive"><AlertDescription>{passwordErrorMessage}</AlertDescription></Alert>}

                        <div>
                            <Label htmlFor="current_password">Current Password</Label>
                            <Input id="current_password" type="password" {...registerPassword('current_password')} />
                             {passwordErrors.current_password && <p className="text-sm text-red-500 mt-1">{passwordErrors.current_password.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="new_password">New Password</Label>
                            <Input id="new_password" type="password" {...registerPassword('new_password')} />
                            {passwordErrors.new_password && <p className="text-sm text-red-500 mt-1">{passwordErrors.new_password.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="new_password_confirmation">Confirm New Password</Label>
                            <Input id="new_password_confirmation" type="password" {...registerPassword('new_password_confirmation')} />
                            {passwordErrors.new_password_confirmation && <p className="text-sm text-red-500 mt-1">{passwordErrors.new_password_confirmation.message}</p>}
                        </div>
                        <Button type="submit" disabled={savingPassword}>
                             {savingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Update Password'}
                        </Button>
                    </form>
                 </CardContent>
            </Card>
        </div>
    );
};

export default AdminSettingsPage;
