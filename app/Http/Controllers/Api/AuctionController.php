<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use Illuminate\Http\Request;

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
            
        if ($request->has('category_id')) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }
        
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        if ($request->has('artisan_id')) {
            $query->where('artisan_id', $request->artisan_id);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        $sortField = $request->input('sort_by', 'end_date');
        $sortDirection = $request->input('sort_direction', 'asc');
        
        $allowedSortFields = ['end_date', 'start_date', 'price', 'bid_count', 'created_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'end_date';
        }
        
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }
        
        $query->orderBy($sortField, $sortDirection);
        
        if (!$request->has('sort_by')) {
            $query->orderByRaw("CASE WHEN type = 'featured' THEN 0 ELSE 1 END");
        }
        
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
