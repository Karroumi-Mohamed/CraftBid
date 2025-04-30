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
        $minDurationHours = SettingsHelper::get('min_auction_duration_hours', 24);
        $maxDurationDays = SettingsHelper::get('max_auction_duration_days', 30);
        $defaultDurationHours = SettingsHelper::get('default_auction_duration_hours', 168);

        $maxDurationHours = $maxDurationDays * 24;

        return response()->json([
            'min' => (int)$minDurationHours,
            'max' => (int)$maxDurationHours,
            'default' => (int)$defaultDurationHours,
        ]);
    }
}
