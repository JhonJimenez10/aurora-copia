<?php

namespace App\Http\Controllers;

use App\Models\Recipient;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RecipientController extends Controller
{
    public function index()
    {
        $recipients = Recipient::all();

        return Inertia::render('Recipient/Index', [
            'recipients' => $recipients,
        ]);
    }

    public function search(Request $request)
    {
        $query = $request->input('identification');

        $recipients = Recipient::where('identification', 'LIKE', "%{$query}%")
            ->orWhere('full_name', 'LIKE', "%{$query}%")
            ->limit(20)
            ->get();

        return response()->json($recipients);
    }

    public function storeJson(Request $request)
    {
        $validated = $request->validate([
            'country' => 'required|string|max:100',
            'id_type' => 'required|string|max:50',
            'identification' => 'required|string|max:50',
            'full_name' => 'required|string|max:100',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'whatsapp' => 'required|boolean',
            'email' => 'nullable|email|max:100',
            'postal_code' => 'nullable|string|max:20',
            'city' => 'nullable|string|max:100',
            'canton' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'blocked' => 'required|boolean',
            'alert' => 'required|boolean',
        ]);

        $recipient = Recipient::create($validated);

        return response()->json([
            'status' => 'success',
            'recipient' => $recipient,
        ]);
    }



    public function create()
    {
        return Inertia::render('Recipient/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'country' => 'required|string|max:100',
            'id_type' => 'required|string|max:50',
            'identification' => 'required|string|max:50',
            'full_name' => 'required|string|max:100',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'whatsapp' => 'required|boolean',
            'email' => 'nullable|email|max:100',
            'postal_code' => 'nullable|string|max:20',
            'city' => 'nullable|string|max:100',
            'canton' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'blocked' => 'required|boolean',
            'alert' => 'required|boolean',
        ]);

        Recipient::create($validated);

        return redirect()->route('recipients.index')->with('success', 'Recipient created successfully.');
    }

    public function edit($id)
    {
        $recipient = Recipient::findOrFail($id);

        return Inertia::render('Recipient/Edit', [
            'recipient' => $recipient,
        ]);
    }

    public function update(Request $request, $id)
    {
        $recipient = Recipient::findOrFail($id);

        $validated = $request->validate([
            'country' => 'sometimes|required|string|max:100',
            'id_type' => 'sometimes|required|string|max:50',
            'identification' => 'sometimes|required|string|max:50',
            'full_name' => 'sometimes|required|string|max:100',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'whatsapp' => 'sometimes|required|boolean',
            'email' => 'nullable|email|max:100',
            'postal_code' => 'nullable|string|max:20',
            'city' => 'nullable|string|max:100',
            'canton' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'blocked' => 'sometimes|required|boolean',
            'alert' => 'sometimes|required|boolean',
        ]);

        $recipient->update($validated);

        return redirect()->route('recipients.index')->with('success', 'Recipient updated successfully.');
    }

    public function destroy($id)
    {
        $recipient = Recipient::findOrFail($id);
        $recipient->delete();

        return redirect()->route('recipients.index')->with('success', 'Recipient deleted successfully.');
    }
}
