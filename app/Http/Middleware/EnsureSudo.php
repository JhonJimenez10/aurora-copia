<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureSudo
{
    /**
     * Maneja la petición entrante.
     */
    public function handle(Request $request, Closure $next)
    {
        // Verifica si el usuario está autenticado y si su rol es Sudo
        if (Auth::check() && Auth::user()->role && Auth::user()->role->name === 'Sudo') {
            return $next($request);
        }

        // Si no es Sudo, mostramos un error 403
        abort(403, 'No estás autorizado para registrar nuevos usuarios.');
    }
}
