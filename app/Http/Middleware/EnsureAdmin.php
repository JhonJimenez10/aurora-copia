<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        // Si no tiene rol o el nombre del rol no es Admin ni Sudo, abortar
        if (! $user || ! $user->role || ! in_array($user->role->name, ['Admin', 'Sudo'])) {
            abort(403, 'No autorizado.');
        }

        return $next($request);
    }
}
