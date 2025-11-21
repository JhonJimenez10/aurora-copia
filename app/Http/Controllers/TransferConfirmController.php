<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Models\TransferSack;
use App\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferConfirmController extends Controller
{
    // GET /api/transfers/{transfer}/details
    public function show(Transfer $transfer)
    {
        // Carga sacas + paquetes
        $transfer->load(['sacks.packages' => function ($q) {
            $q->orderBy('code');
        }]);

        $sacks = $transfer->sacks->map(function (TransferSack $sack) {
            $pending = $sack->packages->filter(fn($p) => !$p->pivot->confirmed)->values();
            $confirmed = $sack->packages->filter(fn($p) => $p->pivot->confirmed)->values();

            $mapPackage = function (Package $p) {
                return [
                    'id'         => (string) $p->id,
                    'code'       => $p->code,
                    'content'    => $p->content,
                    'serviceType' => $p->service_type,
                    'pounds'     => (float) $p->pounds,
                    'kilograms'  => (float) $p->kilograms,
                ];
            };

            return [
                'number'       => $sack->number,
                'seal'         => $sack->seal,
                'refrigerated' => (bool) $sack->refrigerated,
                'pending'      => $pending->map($mapPackage)->all(),
                'confirmed'    => $confirmed->map($mapPackage)->all(),
            ];
        })->values();

        return response()->json([
            'id'      => $transfer->id,
            'number'  => $transfer->number,
            'to_city' => $transfer->to_city, // ajusta si usas relación
            'sacks'   => $sacks,
        ]);
    }

    // PUT /api/transfers/{transfer}/sacks
    public function updateSacks(Request $request, Transfer $transfer)
    {
        $data = $request->validate([
            'sacks'                              => ['required', 'array'],
            'sacks.*.number'                     => ['required', 'integer'],
            'sacks.*.seal'                       => ['nullable', 'string'],
            'sacks.*.refrigerated'               => ['required', 'boolean'],
            'sacks.*.confirmedPackageIds'        => ['required', 'array'],
            'sacks.*.confirmedPackageIds.*'      => ['required'],
        ]);

        DB::transaction(function () use ($data, $transfer) {
            foreach ($data['sacks'] as $sackData) {
                /** @var \App\Models\TransferSack $sack */
                $sack = $transfer->sacks()
                    ->where('number', $sackData['number'])
                    ->firstOrFail();

                $sack->update([
                    'seal'         => $sackData['seal'],
                    'refrigerated' => $sackData['refrigerated'],
                ]);

                $allPackageIds = $sack->packages()->pluck('packages.id')->all();
                $confirmedIds  = $sackData['confirmedPackageIds'];

                foreach ($allPackageIds as $packageId) {
                    $sack->packages()
                        ->updateExistingPivot($packageId, [
                            'confirmed' => in_array($packageId, $confirmedIds),
                        ]);
                }
            }
        });

        return response()->json(['ok' => true]);
    }
}
