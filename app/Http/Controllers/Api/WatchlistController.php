<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Watchlist;
use App\Models\Auction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WatchlistController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $watchlist = $user->watchlists()
            ->with(['auction' => function ($query) {
                $query->with(['product.images', 'artisan.user', 'bids' => function ($query) {
                    $query->orderBy('amount', 'desc')->limit(1);
                }]);
            }])
            ->get()
            ->map(function ($item) {
                $auction = $item->auction;
                $product = $auction->product;
                $artisan = $auction->artisan;
                
                return [
                    'id' => $item->id,
                    'auction_id' => $auction->id,
                    'auction_title' => $product->name,
                    'current_price' => $auction->price,
                    'image_url' => $product->images->where('is_primary', 1)->first()?->path ?? $product->images->first()?->path,
                    'artisan_name' => $artisan->business_name,
                    'category' => $product->category->name,
                    'end_date' => $auction->end_date,
                    'status' => $auction->status,
                    'watched_at' => $item->created_at
                ];
            });
            
        return response()->json([
            'success' => true,
            'data' => $watchlist
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'auction_id' => 'required|exists:auctions,id'
        ]);
        
        $user = Auth::user();
        $auctionId = $request->auction_id;
        
        $exists = $user->watchlists()->where('auction_id', $auctionId)->exists();
        
        if ($exists) {
            return response()->json([
                'success' => true,
                'message' => 'Auction is already in your watchlist',
                'is_watched' => true
            ]);
        }
        
        $watchlist = new Watchlist();
        $watchlist->user_id = $user->id;
        $watchlist->auction_id = $auctionId;
        $watchlist->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Auction added to watchlist',
            'data' => $watchlist,
            'is_watched' => true
        ]);
    }

    public function destroy($auctionId)
    {
        $user = Auth::user();
        $watchlist = $user->watchlists()->where('auction_id', $auctionId)->first();
        
        if (!$watchlist) {
            return response()->json([
                'success' => false,
                'message' => 'Auction is not in your watchlist',
                'is_watched' => false
            ]);
        }
        
        $watchlist->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Auction removed from watchlist',
            'is_watched' => false
        ]);
    }

    public function check($auctionId)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => true,
                'is_watched' => false
            ]);
        }
        
        $isWatched = $user->watchlists()->where('auction_id', $auctionId)->exists();
        
        return response()->json([
            'success' => true,
            'is_watched' => $isWatched
        ]);
    }
} 