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
        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'min_auction_duration_hours' => 'required|integer|min:1',
            'max_auction_duration_days' => 'required|integer|min:1|gte:min_auction_duration_hours',
            'commission_rate_percent' => 'required|numeric|min:0|max:100',
        ]);

        try {
            foreach ($validated as $key => $value) {
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
