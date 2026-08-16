<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Enterprise;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search       = trim((string) $request->query('search', ''));
        $enterpriseId = trim((string) $request->query('enterprise_id', ''));
        $roleId       = trim((string) $request->query('role_id', ''));

        $query = User::with(['enterprise', 'role']);

        if ($search !== '') {
            $searchLower = mb_strtolower($search, 'UTF-8');
            $query->where(function ($q) use ($searchLower) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$searchLower}%"])
                    ->orWhereRaw('LOWER(email) LIKE ?', ["%{$searchLower}%"]);
            });
        }

        if ($enterpriseId !== '') {
            $query->where('enterprise_id', $enterpriseId);
        }

        if ($roleId !== '') {
            $query->where('role_id', $roleId);
        }

        $paginated = $query->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'links'        => $paginated->linkCollection(),
            ],
            'filters' => [
                'search'        => $search,
                'enterprise_id' => $enterpriseId,
                'role_id'       => $roleId,
            ],
            // Para armar los selects de filtro (empresa / rol)
            'enterprises' => Enterprise::orderBy('name')->get(['id', 'name']),
            'roles'       => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Users/Create', [
            'enterprises' => Enterprise::all(['id', 'name']),
            'roles' => Role::all(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'enterprise_id' => 'required|uuid',
            'role_id' => 'nullable|uuid',
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->route('users.index')->with('success', 'Usuario creado correctamente.');
    }

    public function edit($id)
    {
        $user = User::with(['enterprise', 'role'])->findOrFail($id);

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'enterprises' => Enterprise::all(['id', 'name']),
            'roles' => Role::all(['id', 'name']),
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'enterprise_id' => 'sometimes|required|uuid',
            'role_id' => 'sometimes|nullable|uuid',
            'name' => 'sometimes|required|string',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('users.index')->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return redirect()->route('users.index')->with('success', 'Usuario eliminado correctamente.');
    }
}