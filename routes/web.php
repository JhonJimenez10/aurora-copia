<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

// Controladores
use App\Http\Controllers\{
    DashboardController,
    ProfileController,
    EnterpriseController,
    SenderController,
    RecipientController,
    ReceptionController,
    PackageController,
    AdditionalController,
    ArtPackageController,
    ArtPackgController,
    InvoiceController,
    InvDetailController,
    PackageItemController,
    ReportController,
    RoleController,
    UserController,
    BulkImportController
};

use App\Http\Middleware\EnsureSudo;

// Ruta raíz
Route::get('/', fn() => Auth::check() ? redirect()->route('dashboard') : redirect()->route('login'));

// Dashboard
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

// Perfil
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Auth (login, registro, etc.)
require __DIR__ . '/auth.php';

// -----------------------------
// RUTAS ESPECIALES PREVIAS A RESOURCE
// -----------------------------
Route::get('/receptions/next-number', [ReceptionController::class, 'getNextNumber'])
    ->middleware('auth')->name('receptions.nextNumber');

Route::get('/art_packgs/list/json', [ArtPackgController::class, 'listJson'])
    ->middleware('auth')->name('art_packgs.list.json');

// -----------------------------
// RUTAS SOLO PARA SUDO
// -----------------------------
Route::middleware(['auth', EnsureSudo::class])->group(function () {
    Route::resource('enterprises', EnterpriseController::class);
    Route::resource('users', UserController::class);
    Route::resource('roles', RoleController::class);
});

// -----------------------------
// RUTAS PARA ADMIN Y SUDO
// -----------------------------
Route::middleware(['auth', 'admin'])->group(function () {
    Route::resource('senders', SenderController::class);
    Route::resource('recipients', RecipientController::class);
    Route::resource('receptions', ReceptionController::class);
    Route::resource('art_packages', ArtPackageController::class);
    Route::resource('art_packgs', ArtPackgController::class);
    Route::post('/package-items', [PackageItemController::class, 'store'])->name('package_items.store');
    Route::resource('packages', PackageController::class);
    Route::resource('additionals', AdditionalController::class);
    // Carga Masiva (dinámico por módulo)
    Route::get('/bulk-import/{type}', [BulkImportController::class, 'viewByType'])->name('bulk-import.view');
    Route::get('/bulk-import/{type}/example', [BulkImportController::class, 'downloadExample'])->name('bulk-import.example');
    Route::post('/bulk-import/{type}', [BulkImportController::class, 'importData'])->name('bulk-import.import');

    // Reportes
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');
});

// -----------------------------
// RUTAS PARA CUSTOMER
// -----------------------------
Route::middleware(['auth', 'customer'])->group(function () {
    Route::get('/cliente/receptions', [ReceptionController::class, 'index'])->name('receptions.index.customer');
});

// -----------------------------
// RUTAS COMPARTIDAS ENTRE TODOS LOS ROLES (auth)
// SUDO + ADMIN + CUSTOMER
// -----------------------------
Route::middleware(['auth'])->group(function () {
    // Remitentes
    Route::get('/senders/search', [SenderController::class, 'search'])->name('senders.search');
    Route::post('/senders-json', [SenderController::class, 'storeJson'])->name('senders.storeJson');

    // Destinatarios
    Route::get('/recipients/search', [RecipientController::class, 'search'])->name('recipients.search');
    Route::post('/recipients-json', [RecipientController::class, 'storeJson'])->name('recipients.storeJson');
    // Facturación electrónica
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
    Route::get('/invoices/{invoice}/xml-download', [InvoiceController::class, 'downloadXml'])->name('invoices.downloadXml');
    Route::resource('invoices', InvoiceController::class);
    Route::resource('inv_details', InvDetailController::class);
    // Crear recepción y facturas
    Route::post('/receptions', [ReceptionController::class, 'store'])->name('receptions.store.shared');
    Route::post('/receptions/{id}/invoice', [InvoiceController::class, 'createInvoice'])->name('receptions.invoice');

    // Tickets
    Route::get('/receptions/{id}/ticket.pdf', [ReceptionController::class, 'generateTicketPdf'])->name('receptions.ticket');
    Route::get('/receptions/{id}/all-package-tickets.pdf', [ReceptionController::class, 'generateAllPackageTicketsPdf'])->name('receptions.all_tickets');
    Route::get('/receptions/{reception}/packages/{package}/ticket.pdf', [ReceptionController::class, 'generatePackageTicketPdf'])->name('receptions.package_ticket');

    // Artículos para combo
    Route::get('/art_packgs/list/json', [ArtPackgController::class, 'listJson'])->name('art_packgs.list.json');
    Route::get('/art_packages/list/json', [ArtPackageController::class, 'listJson'])->name('art_packages.list.json');
});
