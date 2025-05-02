import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import api, { makeRequest } from '@/lib/axois';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface AppSettingsState {
    min_auction_duration_minutes: string;
    max_auction_duration_hours: string;
    commission_rate_percent: string;
    anti_sniping_enabled: boolean;
    anti_sniping_extension_minutes: string;
}

interface PasswordFormState {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
}
interface AppSettingsErrors {
    min_auction_duration_minutes?: string;
    max_auction_duration_hours?: string;
    commission_rate_percent?: string;
    anti_sniping_extension_minutes?: string;
    general?: string; 
}

interface PasswordErrors {
    current_password?: string;
    new_password?: string;
    new_password_confirmation?: string;
}


const AdminSettingsPage: React.FC = () => {
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // State for App Settings Form
    const [appSettings, setAppSettings] = useState<AppSettingsState>({
        min_auction_duration_minutes: '60',
        max_auction_duration_hours: '336',
        commission_rate_percent: '10',
        anti_sniping_enabled: true,
        anti_sniping_extension_minutes: '5',
    });
    const [appSettingsErrors, setAppSettingsErrors] = useState<AppSettingsErrors>({});
    const [appSettingsSuccess, setAppSettingsSuccess] = useState<string | null>(null);

    const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);


    useEffect(() => {
        const fetchSettings = async () => {
            setLoadingSettings(true);
            setAppSettingsErrors({}); 
            try {
                const response = await makeRequest<Record<string, string>>(api.get('/admin/settings/'));
                if (response.success && response.data) {
                    setAppSettings({
                        min_auction_duration_minutes: response.data.min_auction_duration_minutes ?? '60',
                        max_auction_duration_hours: response.data.max_auction_duration_hours ?? '336',
                        commission_rate_percent: response.data.commission_rate_percent ?? '10',
                        anti_sniping_enabled: response.data.anti_sniping_enabled === 'true', // Convert string to boolean
                        anti_sniping_extension_minutes: response.data.anti_sniping_extension_minutes ?? '5',
                    });
                } else {
                    setAppSettingsErrors({ general: response.error?.message || 'Failed to load settings' });
                }
            } catch (err: any) {
                 setAppSettingsErrors({ general: err.message || 'An error occurred while loading settings' });
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, []); 

    const handleAppSettingChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setAppSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (appSettingsErrors[name as keyof AppSettingsErrors]) {
            setAppSettingsErrors(prev => ({ ...prev, [name]: undefined }));
        }
        if (appSettingsErrors.general) {
             setAppSettingsErrors(prev => ({ ...prev, general: undefined }));
        }
    };

    const validateAppSettings = (): boolean => {
        const errors: AppSettingsErrors = {};
        const minDuration = parseInt(appSettings.min_auction_duration_minutes, 10);
        const maxDurationHours = parseInt(appSettings.max_auction_duration_hours, 10);
        const maxDurationMinutes = maxDurationHours * 60;
        const commission = parseFloat(appSettings.commission_rate_percent);
        const antiSnipingMinutes = parseInt(appSettings.anti_sniping_extension_minutes, 10);

        if (isNaN(minDuration) || minDuration < 1) {
            errors.min_auction_duration_minutes = "Must be a positive integer.";
        }
        if (isNaN(maxDurationHours) || maxDurationHours < 1) {
            errors.max_auction_duration_hours = "Must be a positive integer.";
        }
         if (!isNaN(minDuration) && !isNaN(maxDurationMinutes) && maxDurationMinutes < minDuration) {
             errors.max_auction_duration_hours = "Max duration (in minutes) must be >= min duration.";
         }
        if (isNaN(commission) || commission < 0 || commission > 100) {
            errors.commission_rate_percent = "Must be between 0 and 100.";
        }
        if (isNaN(antiSnipingMinutes) || antiSnipingMinutes < 1) {
            errors.anti_sniping_extension_minutes = "Must be a positive integer.";
        }

        setAppSettingsErrors(errors);
        return Object.keys(errors).length === 0; 
    };

    const handleAppSettingsSubmit = async (e: FormEvent) => {
        e.preventDefault(); 
        setAppSettingsSuccess(null); 

        if (!validateAppSettings()) {
            return; 
        }

        setSavingSettings(true);
        try {
            const dataToSend = {
                ...appSettings,
                 anti_sniping_enabled: appSettings.anti_sniping_enabled, 
             };

            const response = await makeRequest(api.put('/admin/settings/', dataToSend));
            if (response.success) {
                setAppSettingsSuccess('Application settings updated successfully!');
                setAppSettingsErrors({}); 
            } else {
                if (response.status === 422 && response.error?.errors) {
                    const backendErrors: AppSettingsErrors = {};
                    Object.entries(response.error.errors).forEach(([field, messages]) => {
                         if (Array.isArray(messages) && messages.length > 0) {
                            backendErrors[field as keyof AppSettingsErrors] = messages[0];
                        }
                    });
                    setAppSettingsErrors(backendErrors);
                } else {
                    setAppSettingsErrors({ general: response.error?.message || 'Failed to save settings' });
                }
            }
        } catch (err: any) {
             setAppSettingsErrors({ general: err.message || 'An error occurred while saving settings' });
        } finally {
            setSavingSettings(false);
        }
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
        if (passwordErrors[name as keyof PasswordErrors]) {
            setPasswordErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validatePasswordForm = (): boolean => {
        const errors: PasswordErrors = {};
        if (!passwordForm.current_password) {
            errors.current_password = "Current password is required.";
        }
        if (!passwordForm.new_password || passwordForm.new_password.length < 8) {
             errors.new_password = "New password must be at least 8 characters.";
        }
        if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
            errors.new_password_confirmation = "New passwords do not match.";
        }
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };


    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault(); 
        setPasswordSuccess(null); 

        if (!validatePasswordForm()) {
            return;
        }

        setSavingPassword(true);
        try {
            const response = await makeRequest(api.post('/admin/settings/update-password', passwordForm));
            if (response.success) {
                setPasswordSuccess('Password updated successfully!');
                setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' }); 
                setPasswordErrors({}); 
            } else {
                 if (response.status === 422 && response.error?.errors) {
                    const backendErrors: PasswordErrors = {};
                    Object.entries(response.error.errors).forEach(([field, messages]) => {
                         if (Array.isArray(messages) && messages.length > 0) {
                             const key = field === 'new_password_confirmation' ? 'new_password_confirmation' : field;
                            backendErrors[key as keyof PasswordErrors] = messages[0];
                        }
                    });
                     if (!Object.keys(backendErrors).length && response.error.message) {
                         backendErrors.current_password = response.error.message; 
                     }
                    setPasswordErrors(backendErrors);
                } else {
                     setPasswordErrors({ current_password: response.error?.message || 'Failed to update password' }); // Show general error on current_password field
                 }
            }
        } catch (err: any) {
            setPasswordErrors({ current_password: err.message || 'An error occurred while updating password' });
        } finally {
            setSavingPassword(false);
        }
    };

  return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Admin Settings</h1>

             {appSettingsErrors.general && <Alert variant="destructive"><AlertDescription>{appSettingsErrors.general}</AlertDescription></Alert>}

            <Card>
                <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                    <CardDescription>Configure platform rules and parameters.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingSettings ? (
                         <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : (
                        <form onSubmit={handleAppSettingsSubmit} className="space-y-4">
                            {appSettingsSuccess && <Alert variant="default"><AlertDescription>{appSettingsSuccess}</AlertDescription></Alert>}

                            <div>
                                <Label htmlFor="min_auction_duration_minutes">Min Auction Duration (Minutes)</Label>
                                <Input
                                    id="min_auction_duration_minutes"
                                    name="min_auction_duration_minutes" 
                                    type="number"
                                    value={appSettings.min_auction_duration_minutes} 
                                    onChange={handleAppSettingChange} 
                                />
                                {appSettingsErrors.min_auction_duration_minutes && <p className="text-sm text-red-500 mt-1">{appSettingsErrors.min_auction_duration_minutes}</p>}
                            </div>

                            <div>
                                <Label htmlFor="max_auction_duration_hours">Max Auction Duration (Hours)</Label>
                                <Input
                                    id="max_auction_duration_hours"
                                    name="max_auction_duration_hours" 
                                    type="number"
                                    value={appSettings.max_auction_duration_hours} 
                                    onChange={handleAppSettingChange} 
                                 />
                                {appSettingsErrors.max_auction_duration_hours && <p className="text-sm text-red-500 mt-1">{appSettingsErrors.max_auction_duration_hours}</p>}
                            </div>

                            <div>
                                <Label htmlFor="commission_rate_percent">Platform Commission Rate (%)</Label>
                                <Input
                                     id="commission_rate_percent"
                                     name="commission_rate_percent" 
                                     type="number"
                                     step="0.1"
                                     value={appSettings.commission_rate_percent} 
                                     onChange={handleAppSettingChange} 
                                />
                                {appSettingsErrors.commission_rate_percent && <p className="text-sm text-red-500 mt-1">{appSettingsErrors.commission_rate_percent}</p>}
                            </div>

                            <div className="flex items-center space-x-2">
                                 <input
                                     type="checkbox"
                                     id="anti_sniping_enabled"
                                     name="anti_sniping_enabled"
                                     checked={appSettings.anti_sniping_enabled}
                                     onChange={handleAppSettingChange}
                                     className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" // Basic styling
                                 />
                                <Label htmlFor="anti_sniping_enabled">Enable Anti-Sniping Feature</Label>
                             </div>

                            <div>
                                <Label htmlFor="anti_sniping_extension_minutes">Anti-Sniping Extension (Minutes)</Label>
                                <Input
                                    id="anti_sniping_extension_minutes"
                                    name="anti_sniping_extension_minutes" 
                                    type="number"
                                    value={appSettings.anti_sniping_extension_minutes} 
                                    onChange={handleAppSettingChange} 
                                    disabled={!appSettings.anti_sniping_enabled} 
                                 />
                                {appSettingsErrors.anti_sniping_extension_minutes && <p className="text-sm text-red-500 mt-1">{appSettingsErrors.anti_sniping_extension_minutes}</p>}
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
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        {passwordSuccess && <Alert variant="default"><AlertDescription>{passwordSuccess}</AlertDescription></Alert>}

                         {(passwordErrors.current_password || passwordErrors.new_password || passwordErrors.new_password_confirmation) && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {passwordErrors.current_password || passwordErrors.new_password || passwordErrors.new_password_confirmation}
                                </AlertDescription>
                            </Alert>
                         )}


                        <div>
                            <Label htmlFor="current_password">Current Password</Label>
                            <Input
                                id="current_password"
                                name="current_password" 
                                type="password"
                                value={passwordForm.current_password} 
                                onChange={handlePasswordChange} 
                            />
                            {passwordErrors.current_password && <p className="text-sm text-red-500 mt-1">{passwordErrors.current_password}</p>}
                        </div>
                        <div>
                            <Label htmlFor="new_password">New Password</Label>
                            <Input
                                id="new_password"
                                name="new_password" 
                                type="password"
                                value={passwordForm.new_password} 
                                onChange={handlePasswordChange} 
                            />
                             {passwordErrors.new_password && <p className="text-sm text-red-500 mt-1">{passwordErrors.new_password}</p>}
                        </div>
                        <div>
                            <Label htmlFor="new_password_confirmation">Confirm New Password</Label>
                            <Input
                                id="new_password_confirmation"
                                name="new_password_confirmation" 
                                type="password"
                                value={passwordForm.new_password_confirmation} 
                                onChange={handlePasswordChange} 
                             />
                            {passwordErrors.new_password_confirmation && <p className="text-sm text-red-500 mt-1">{passwordErrors.new_password_confirmation}</p>}
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
