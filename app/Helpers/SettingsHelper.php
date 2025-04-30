<?php

namespace App\Helpers;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingsHelper
{

    public static function get(string $key, $default = null)
    {
        $settings = Cache::remember('app_settings', 60 * 60, function () {
            return Setting::all()->pluck('value', 'key');
        });

        return $settings[$key] ?? $default;
    }

    public static function invalidateCache(): void
    {
        Cache::forget('app_settings');
    }
} 