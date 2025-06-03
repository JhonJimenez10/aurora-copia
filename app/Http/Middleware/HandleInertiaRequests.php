<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Aquí se heredan las shared props de Inertia por defecto
        return array_merge(parent::share($request), [
            'auth' => function () {
                $user = Auth::user();

                if ($user) {
                    // Asegúrate de cargar la relación 'role'
                    $user->load('role');

                    return [
                        // Solo enviamos al cliente los campos mínimos
                        'user' => [
                            'id'    => $user->id,
                            'name'  => $user->name,
                            'email' => $user->email,
                            'enterprise_id' => $user->enterprise_id,
                        ],
                        // Si el usuario tiene rol asignado, devolvemos el nombre; si no, null.
                        'role' => $user->role ? $user->role->name : null,
                    ];
                }

                // Si no hay usuario autenticado, devolvemos null en lugar de arreglo
                return null;
            },
        ]);
    }
}
