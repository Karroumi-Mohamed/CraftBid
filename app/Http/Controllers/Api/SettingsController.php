<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Helpers\SettingsHelper;

class SettingsController extends Controller
{
    public function getAuctionDurationSettings(): JsonResponse
    {
        $minDurationMinutes = SettingsHelper::get('min_auction_duration_minutes', 1); 
        $maxDurationHours = SettingsHelper::get('max_auction_duration_hours', 336); 
        $defaultDurationMinutes = SettingsHelper::get('default_auction_duration_minutes', 60 * 24 * 7); 

        $maxDurationMinutes = $maxDurationHours * 60;

        return response()->json([
            'min' => (int)$minDurationMinutes,
            'max' => (int)$maxDurationMinutes,
            'default' => (int)$defaultDurationMinutes,
        ]);
    }
}
