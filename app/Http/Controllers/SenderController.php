<?php

namespace App\Http\Controllers;

use App\Models\Sender;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SenderController extends Controller
{
    public function index()
    {
        $senders = Sender::all();

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
        // Lee el parámetro 'identification' de la query string
        $identification = $request->query('identification');

        // Si no llega nada, devuelve todos los remitentes
        if (!$identification) {
            $senders = Sender::all();
        } else {
            // Si llega algo, busca coincidencia parcial en identification o en full_name
            $senders = Sender::where('identification', 'like', "%{$identification}%")
                ->orWhere('full_name', 'like', "%{$identification}%")
                ->get();
        }

        return response()->json($senders);
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

        Sender::create($validated);

        return redirect()->route('senders.index')->with('success', 'Sender created successfully.');
    }

    public function edit($id)
    {
        $sender = Sender::findOrFail($id);

        return Inertia::render('Sender/Edit', [
            'sender' => $sender,
        ]);
    }

    public function update(Request $request, $id)
    {
        $sender = Sender::findOrFail($id);

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
        $sender = Sender::findOrFail($id);
        $sender->delete();

        return redirect()->route('senders.index')->with('success', 'Sender deleted successfully.');
    }
}
