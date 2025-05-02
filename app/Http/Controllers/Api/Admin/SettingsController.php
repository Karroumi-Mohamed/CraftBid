<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use App\Helpers\SettingsHelper;

class SettingsController extends Controller
{

    public function getSettings()
    {
        $settings = Setting::all()->pluck('value', 'key');
        $defaults = [
            'min_auction_duration_minutes' => '60',
            'max_auction_duration_hours' => '336',
            'commission_rate_percent' => '10',
            'anti_sniping_enabled' => 'true',
            'anti_sniping_extension_minutes' => '5',
        ];
        $settings = collect($defaults)->merge($settings);
        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'min_auction_duration_minutes' => 'required|integer|min:1',
            'max_auction_duration_hours' => 'required|integer|min:1',
            'commission_rate_percent' => 'required|numeric|min:0|max:100',
            'anti_sniping_enabled' => 'required|boolean',
            'anti_sniping_extension_minutes' => 'required|integer|min:1',
        ], [
            'max_auction_duration_hours.min' => 'Max duration must be at least 1 hour.',
            'anti_sniping_extension_minutes.min' => 'Anti-sniping extension must be at least 1 minute.',
        ]);

        $minMinutes = (int)$validated['min_auction_duration_minutes'];
        $maxMinutes = (int)$validated['max_auction_duration_hours'] * 60;

        if ($maxMinutes < $minMinutes) {
            throw ValidationException::withMessages([
                'max_auction_duration_hours' => 'Max duration (converted to minutes) must be greater than or equal to min duration.'
            ]);
        }

        try {
            foreach ($validated as $key => $value) {
                if ($key === 'anti_sniping_enabled') {
                    $value = $value ? 'true' : 'false';
                }
                Setting::updateOrCreate(['key' => $key], ['value' => $value]);
            }
            SettingsHelper::invalidateCache();
            Log::info('Application settings updated by admin: ' . $request->user()->id);
            return response()->json(['message' => 'Settings updated successfully.']);
        } catch (\Exception $e) {
            Log::error('Failed to update settings: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update settings.'], 500);
        }
    }

    public function updateAdminPassword(Request $request)
    {
        $user = $request->user(); 

        $validated = $request->validate([
            'current_password' => 'required|string|current_password', 
            'new_password' => ['required', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        try {
            $user->update([
                'password' => Hash::make($validated['new_password']),
            ]);
            Log::info('Admin password updated for user: ' . $user->id);
            return response()->json(['message' => 'Password updated successfully.']);
        } catch (\Exception $e) {
             Log::error('Failed to update admin password for user: ' . $user->id . ' Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update password.'], 500);
        }
    }
}
