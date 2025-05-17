<?php

namespace App\Http\Controllers;

use App\Models\InvDetail;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvDetailController extends Controller
{
    public function index()
    {
        $details = InvDetail::with('invoice')->get();

        return Inertia::render('InvoiceDetail/Index', [
            'details' => $details,
        ]);
    }

    public function show($id)
    {
        $detail = InvDetail::with('invoice')->findOrFail($id);

        return Inertia::render('InvoiceDetail/Show', [
            'detail' => $detail,
        ]);
    }

    public function edit($id)
    {
        $detail = InvDetail::findOrFail($id);
        $invoices = Invoice::all(['id', 'number']);

        return Inertia::render('InvoiceDetail/Edit', [
            'detail' => $detail,
            'invoices' => $invoices,
        ]);
    }

    public function update(Request $request, $id)
    {
        $detail = InvDetail::findOrFail($id);

        $validated = $request->validate([
            'description' => 'sometimes|required|string|max:255',
            'quantity' => 'sometimes|required|integer',
            'unit_price' => 'sometimes|required|numeric',
            'subtotal' => 'sometimes|required|numeric',
            'vat' => 'nullable|numeric',
            'total' => 'sometimes|required|numeric',
        ]);

        $detail->update($validated);

        return redirect()->route('inv_details.index')->with('success', 'Invoice detail updated successfully.');
    }

    public function destroy($id)
    {
        $detail = InvDetail::findOrFail($id);
        $detail->delete();

        return redirect()->route('inv_details.index')->with('success', 'Invoice detail deleted successfully.');
    }
}
