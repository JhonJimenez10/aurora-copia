<?php

namespace App\Providers;


use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //Vite::prefetch(concurrency: 3);
        Inertia::share([
            'auth' => function () {
                $user = Auth::user();

                return $user ? [
                    'user' => [
                        'id'            => $user->id,
                        'name'          => $user->name,
                        'email'         => $user->email,
                        'enterprise_id' => $user->enterprise_id, // 👈 Asegúrate de enviar esto
                    ],
                    'role' => $user->role->name ?? null,
                ] : null;
            },
        ]);
    }
}
