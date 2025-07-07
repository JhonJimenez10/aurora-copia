<?php

namespace App\Http\Controllers;

use App\Models\Sender;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class SenderController extends Controller
{
    public function index()
    {
        $enterpriseId = Auth::user()->enterprise_id;

        $paginated = Sender::where('enterprise_id', $enterpriseId)
            ->orderBy('full_name')
            ->paginate(10);

        return Inertia::render('Sender/Index', [
            'senders' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'links' => $paginated->linkCollection(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Sender/Create');
    }

    public function search(Request $request)
    {
        $enterpriseId = Auth::user()->enterprise_id;
        $identification = $request->query('identification');

        $query = Sender::where('enterprise_id', $enterpriseId);

        if ($identification) {
            $query->where(function ($q) use ($identification) {
                $q->where('identification', 'like', "%{$identification}%")
                    ->orWhere('full_name', 'like', "%{$identification}%");
            });
        }

        return response()->json($query->get());
    }

    public function storeJson(Request $request)
    {
        $validated = $request->validate([
            'country'        => 'required|string|max:100',
            'id_type'        => 'required|string|max:50',
            'identification' => 'required|string|max:50',
            'full_name'      => 'required|string|max:100',
            'address'        => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:50',
            'whatsapp'       => 'required|boolean',
            'email'          => 'nullable|email|max:100',
            'postal_code'    => 'nullable|string|max:20',
            'city'           => 'nullable|string|max:100',
            'canton'         => 'nullable|string|max:100',
            'state'          => 'nullable|string|max:100',
            'blocked'        => 'required|boolean',
            'alert'          => 'required|boolean',
        ]);

        // ✅ Validación de cédula
        if ($validated['id_type'] === 'CEDULA' && !$this->isValidEcuadorianCedula($validated['identification'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'La cédula ingresada no es válida.',
            ], 422);
        }

        $validated['enterprise_id'] = Auth::user()->enterprise_id;

        $sender = Sender::create($validated);

        return response()->json([
            'status' => 'success',
            'sender' => $sender,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'country'        => 'required|string|max:100',
            'id_type'        => 'required|string|max:50',
            'identification' => 'required|string|max:50',
            'full_name'      => 'required|string|max:100',
            'address'        => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:50',
            'whatsapp'       => 'required|boolean',
            'email'          => 'nullable|email|max:100',
            'postal_code'    => 'nullable|string|max:20',
            'city'           => 'nullable|string|max:100',
            'canton'         => 'nullable|string|max:100',
            'state'          => 'nullable|string|max:100',
            'blocked'        => 'required|boolean',
            'alert'          => 'required|boolean',
        ]);

        // ✅ Validación de cédula
        if ($validated['id_type'] === 'CEDULA' && !$this->isValidEcuadorianCedula($validated['identification'])) {
            return redirect()->back()->withErrors(['identification' => 'La cédula ingresada no es válida.'])->withInput();
        }

        $validated['enterprise_id'] = Auth::user()->enterprise_id;

        Sender::create($validated);

        return redirect()->route('senders.index')->with('success', 'Sender created successfully.');
    }

    public function edit($id)
    {
        $sender = Sender::where('enterprise_id', Auth::user()->enterprise_id)
            ->findOrFail($id);

        return Inertia::render('Sender/Edit', [
            'sender' => $sender,
        ]);
    }

    public function update(Request $request, $id)
    {
        $sender = Sender::where('enterprise_id', Auth::user()->enterprise_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'country'        => 'sometimes|required|string|max:100',
            'id_type'        => 'sometimes|required|string|max:50',
            'identification' => 'sometimes|required|string|max:50',
            'full_name'      => 'sometimes|required|string|max:100',
            'address'        => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:50',
            'whatsapp'       => 'sometimes|required|boolean',
            'email'          => 'nullable|email|max:100',
            'postal_code'    => 'nullable|string|max:20',
            'city'           => 'nullable|string|max:100',
            'canton'         => 'nullable|string|max:100',
            'state'          => 'nullable|string|max:100',
            'blocked'        => 'sometimes|required|boolean',
            'alert'          => 'sometimes|required|boolean',
        ]);

        $sender->update($validated);

        return redirect()->route('senders.index')->with('success', 'Sender updated successfully.');
    }

    public function destroy($id)
    {
        $sender = Sender::where('enterprise_id', Auth::user()->enterprise_id)
            ->findOrFail($id);

        $sender->delete();

        return redirect()->route('senders.index')->with('success', 'Sender deleted successfully.');
    }

    /**
     * Validación de cédula ecuatoriana
     */
    private function isValidEcuadorianCedula($cedula)
    {
        if (!preg_match('/^\d{10}$/', $cedula)) {
            return false;
        }

        $regionCode = (int)substr($cedula, 0, 2);
        if ($regionCode < 1 || $regionCode > 24) {
            return false;
        }

        $digits = str_split($cedula);
        $sum = 0;
        for ($i = 0; $i < 9; $i++) {
            $num = (int)$digits[$i];
            if ($i % 2 === 0) {
                $num *= 2;
                if ($num > 9) {
                    $num -= 9;
                }
            }
            $sum += $num;
        }

        $verifier = (10 - ($sum % 10)) % 10;
        return $verifier == (int)$digits[9];
    }
}
