<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Setting::updateOrCreate(
            ['key' => 'min_auction_duration_hours'],
            ['value' => '1'] 
        );
        Setting::updateOrCreate(
            ['key' => 'max_auction_duration_days'],
            ['value' => '14'] 
        );
        Setting::updateOrCreate(
            ['key' => 'commission_rate_percent'],
            ['value' => '10'] 
        );
    }
}
