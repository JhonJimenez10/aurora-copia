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
        $senders = Sender::where('enterprise_id', $enterpriseId)->get();

        return Inertia::render('Sender/Index', [
            'senders' => $senders,
        ]);
    }

    public function create()
    {
        return Inertia::render('Sender/Create');
    }

    /**
     * Búsqueda de Senders (remitentes) por identificación o listado completo si no hay query.
     */
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


    /**
     * Almacena un Sender vía JSON (sin redirección).
     */
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
        $validated['enterprise_id'] = Auth::user()->enterprise_id;

        $sender = Sender::create($validated);

        return response()->json([
            'status' => 'success',
            'sender' => $sender,
        ]);
    }

    /**
     * Almacena un Sender de forma tradicional (con redirección).
     */
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
}
