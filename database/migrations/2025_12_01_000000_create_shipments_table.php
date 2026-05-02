<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enterprise_id');

            // Datos principales
            $table->date('date');
            $table->string('country_origin', 100)->default('ECUADOR');
            $table->string('agency_origin', 100);         // Agencia donde se crea
            $table->string('sack_prefix', 20);            // Prefijo de sacas
            $table->string('route', 255);                 // Ruta
            $table->string('airline', 100);               // Aerolínea
            $table->string('number', 30);                 // Número de embarque
            $table->string('airport_origin', 100);        // Aeropuerto origen
            $table->string('airport_dest', 100);          // Aeropuerto destino
            $table->string('cargo_agency', 100)->nullable(); // Agencia de carga
            $table->string('palletizer', 100)->nullable(); // Paletizadora
            $table->boolean('open')->default(true);        // Embarque abierto

            // Estado: OPEN, CLOSED, CANCELLED
            $table->string('status', 20)->default('OPEN');

            // Auditoría
            $table->uuid('created_by');
            $table->uuid('closed_by')->nullable();
            $table->timestamp('closed_at')->nullable();

            $table->timestamps();

            $table->unique(['enterprise_id', 'number']);

            $table->foreign('enterprise_id')
                ->references('id')->on('enterprises')
                ->cascadeOnDelete();

            $table->foreign('created_by')
                ->references('id')->on('users')
                ->restrictOnDelete();

            $table->foreign('closed_by')
                ->references('id')->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};