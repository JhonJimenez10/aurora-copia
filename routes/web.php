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
    BulkImportController,
    AgencyDestController
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
// RUTAS COMPARTIDAS ENTRE TODOS LOS ROLES (auth)
// SUDO + ADMIN + CUSTOMER
// -----------------------------
Route::middleware(['auth'])->group(function () {

    Route::get('/agencies_dest/list/json', [AgencyDestController::class, 'listByEnterprise']);

    // Remitentes
    Route::get('/senders/search', [SenderController::class, 'search'])->name('senders.search');
    Route::post('/senders-json', [SenderController::class, 'storeJson'])->name('senders.storeJson');

    // Destinatarios
    Route::get('/recipients/search', [RecipientController::class, 'search'])->name('recipients.search');
    Route::post('/recipients-json', [RecipientController::class, 'storeJson'])->name('recipients.storeJson');
    // Facturación electrónica
    Route::get('/invoices/{invoice}/ticket', [InvoiceController::class, 'generateTicket'])->name('invoices.ticket');
    Route::get('/invoices/{invoice}/a4',    [InvoiceController::class, 'generateA4'])->name('invoices.a4');
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
    Route::get('/invoices/{invoice}/xml-download', [InvoiceController::class, 'downloadXml'])->name('invoices.downloadXml');
    Route::resource('invoices', InvoiceController::class);
    Route::resource('inv_details', InvDetailController::class);
    // Crear recepción y facturas
    Route::post('/receptions', [ReceptionController::class, 'store'])->name('receptions.store.shared');
    Route::post('/receptions/{id}/invoice', [InvoiceController::class, 'createInvoice'])->name('receptions.invoice');
    // Anular recepción
    Route::patch('/receptions/{reception}/annul', [ReceptionController::class, 'annul'])
        ->name('receptions.annul');
    // Tickets
    Route::get('/receptions/{id}/ticket.pdf', [ReceptionController::class, 'generateTicketPdf'])->name('receptions.ticket');
    Route::get('/receptions/{id}/all-package-tickets.pdf', [ReceptionController::class, 'generateAllPackageTicketsPdf'])->name('receptions.all_tickets');
    Route::get('/receptions/{reception}/packages/{package}/ticket.pdf', [ReceptionController::class, 'generatePackageTicketPdf'])->name('receptions.package_ticket');
    Route::resource('receptions', ReceptionController::class);
    // Artículos para combo
    Route::get('/art_packgs/list/json', [ArtPackgController::class, 'listJson'])->name('art_packgs.list.json');
    Route::get('/art_packages/list/json', [ArtPackageController::class, 'listJson'])->name('art_packages.list.json');
});


// -----------------------------
// RUTAS PARA ADMIN Y SUDO
// -----------------------------
Route::middleware(['auth', 'admin'])->group(function () {
    Route::resource('senders', SenderController::class);
    Route::resource('recipients', RecipientController::class);

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
    Route::get('/reports/invoices', [ReportController::class, 'invoiceIndex'])->name('reports.invoices.index');
    Route::get('/reports/invoices/export', [ReportController::class, 'invoiceExport'])->name('reports.invoices.export');
    // Reporte Manifiesto IBC
    Route::get('/reports/ibc-manifest', [ReportController::class, 'ibcManifestIndex'])->name('reports.ibc.index');
    Route::get('/reports/ibc-manifest/export', [ReportController::class, 'ibcManifestExport'])->name('reports.ibc.export');
    Route::get('/reports/ibc-manifest/export-csv', [ReportController::class, 'ibcManifestExportCsv'])->name('reports.ibc.export.csv');
    Route::get('/reports/airline-manifest', [ReportController::class, 'airlineManifestIndex'])->name('reports.airline.index');
    Route::get('/reports/airline-manifest/export', [ReportController::class, 'airlineManifestExport'])->name('reports.airline.export');
    Route::get('/reports/acas-avianca-manifest', [ReportController::class, 'acasAviancaManifestIndex'])
        ->name('reports.acas.index');

    Route::get('/reports/acas-avianca-manifest/export', [ReportController::class, 'acasAviancaManifestExport'])
        ->name('reports.acas.export');
    Route::resource('agencies_dest', AgencyDestController::class);
});

// -----------------------------
// RUTAS PARA CUSTOMER
// -----------------------------
