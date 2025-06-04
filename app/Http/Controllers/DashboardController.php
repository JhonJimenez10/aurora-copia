<?php

namespace App\Http\Controllers;

use App\Models\ArtPackage;
use App\Models\ArtPackg;
use App\Models\Reception;
use App\Models\Recipient;
use App\Models\Sender;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $enterprise = $user->enterprise;

        $enterpriseId = $enterprise->id;

        $stats = [
            'senders' => Sender::where('enterprise_id', $enterpriseId)->count(),
            'recipients' => Recipient::where('enterprise_id', $enterpriseId)->count(),
            'artPackages' => ArtPackage::where('enterprise_id', $enterpriseId)->count(),
            'artPackgs' => ArtPackg::where('enterprise_id', $enterpriseId)->count(),
            'lastMonthShipments' => Reception::where('enterprise_id', $enterpriseId)
                ->whereBetween('created_at', [now()->subMonth(), now()])
                ->count(),
        ];

        return Inertia::render('Dashboard', [
            'enterprise' => $enterprise,
            'stats' => $stats,
        ]);
    }
}
