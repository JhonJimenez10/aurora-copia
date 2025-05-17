<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EnterpriseController;
use App\Http\Controllers\SenderController;
use App\Http\Controllers\RecipientController;
use App\Http\Controllers\ReceptionController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\AdditionalController;
use App\Http\Controllers\ArtPackageController;
use App\Http\Controllers\ArtPackgController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvDetailController;
use App\Http\Controllers\PackageItemController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\EnsureSudo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Ruta principal de la app
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Autenticación (Login, Register, etc.)
require __DIR__ . '/auth.php';

// Grupo con middleware EnsureSudo
Route::middleware(['auth', EnsureSudo::class])->group(function () {
    Route::resource('enterprises', EnterpriseController::class);
    // Ruta específica para búsqueda de Senders
    Route::get('/senders/search', [SenderController::class, 'search'])->name('senders.search');
    // Rutas para Sender
    Route::post('/senders-json', [SenderController::class, 'storeJson'])->name('senders.storeJson');
    Route::resource('senders', SenderController::class);
    Route::get('/recipients/search', [RecipientController::class, 'search'])->name('recipients.search');
    Route::post('/recipients-json', [RecipientController::class, 'storeJson'])->name('recipients.storeJson');
    Route::resource('recipients', RecipientController::class);
    // Ruta para retornar artículos de la empresa autenticada (para el modal)
    Route::get('/art_packages/list/json', [ArtPackageController::class, 'listJson'])->name('art_packages.list.json');
    // Ruta para retornar artículos de embalaje autenticada (para el modal)
    Route::get('/receptions/{id}/all-package-tickets.pdf', [ReceptionController::class, 'generateAllPackageTicketsPdf']);
    Route::get('/receptions/{reception}/packages/{package}/ticket.pdf', [ReceptionController::class, 'generatePackageTicketPdf']);

    Route::get('/art_packgs/list/json', [ArtPackgController::class, 'listJson'])->name('art_packgs.list.json');
    Route::get('/receptions/next-number', [ReceptionController::class, 'getNextNumber'])->name('receptions.nextNumber');
    Route::get('/receptions/{id}/ticket.pdf', [ReceptionController::class, 'generateTicketPdf']);

    Route::resource('receptions', ReceptionController::class);
    Route::post('/package-items', [PackageItemController::class, 'store'])->name('package_items.store');
    Route::resource('packages', PackageController::class);
    Route::resource('additionals', AdditionalController::class);
    Route::resource('art_packages', ArtPackageController::class);

    Route::resource('art_packgs', ArtPackgController::class);
    Route::resource('invoices', InvoiceController::class);
    Route::resource('inv_details', InvDetailController::class);
    Route::resource('roles', RoleController::class);
    Route::resource('users', UserController::class);

    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');

    Route::post('/receptions/{id}/invoice', [InvoiceController::class, 'createInvoice'])->name('receptions.invoice');
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
    Route::get('/invoices/{invoice}/xml-download', [InvoiceController::class, 'downloadXml'])->name('invoices.downloadXml');
});
