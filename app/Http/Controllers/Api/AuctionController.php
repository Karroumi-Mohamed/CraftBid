<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuctionController extends Controller
{

    public function index(Request $request)
    {
        $query = Auction::with([
            'product.images',
            'artisan' => function ($query) {
                $query->select('id', 'user_id', 'business_name'); 
            },
            'artisan.user' => function ($query) {
                $query->select('id', 'name'); 
            }
        ])
            ->where('is_visible', true)
            ->where(function ($q) {
                $q->where('status', 'active')
                  ->orWhere('status', 'pending');
            });
        
        $query->orderBy('end_date', 'asc');
        
        $query->orderByRaw("CASE WHEN type = 'featured' THEN 0 ELSE 1 END");
        
        $auctions = $query->paginate($request->input('per_page', 12));
        
        return response()->json($auctions);
    }
    

    public function show(Auction $auction)
    {
        if (!$auction->is_visible || 
            !in_array($auction->status, ['pending', 'active', 'ended']) || 
            ($auction->status === 'ended' && $auction->bid_count === 0)) {
            return response()->json(['message' => 'Auction not available.'], 404);
        }
        
        $auction->load([
            'product.images',
            'artisan.user' => function ($query) {
                $query->select('id', 'name'); 
            },
            'bids' => function ($query) {
                $query->orderBy('created_at', 'desc')
                      ->take(10); 
            },
            'bids.user' => function ($query) {
                $query->select('id', 'name'); 
            }
        ]);
                
        return response()->json($auction);
    }
}
