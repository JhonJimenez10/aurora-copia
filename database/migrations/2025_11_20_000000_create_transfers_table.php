<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Empresa (tenant) dueña del documento
            $table->uuid('enterprise_id');

            // Número de traslado (ej: 000001, TR-000001, etc.)
            $table->string('number', 30);

            // Para que no se repita dentro de la misma empresa
            $table->unique(['enterprise_id', 'number']);

            // Datos de origen / destino
            $table->string('country', 100)->default('ECUADOR');
            $table->string('from_city', 100);
            $table->string('to_city', 100);

            // Estado del traslado
            // PENDING = creado, en tránsito
            // CONFIRMED = confirmado en destino
            // CANCELLED = anulado
            $table->string('status', 20)->default('PENDING');

            // Auditoría
            $table->uuid('created_by');
            $table->uuid('confirmed_by')->nullable();
            $table->timestamp('confirmed_at')->nullable();

            $table->timestamps();

            // FKs
            $table->foreign('enterprise_id')
                ->references('id')->on('enterprises')
                ->cascadeOnDelete();

            $table->foreign('created_by')
                ->references('id')->on('users')
                ->restrictOnDelete();

            $table->foreign('confirmed_by')
                ->references('id')->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
