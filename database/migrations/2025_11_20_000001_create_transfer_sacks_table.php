<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transfer_sacks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('transfer_id');

            // número de saca dentro del traslado (1,2,3,...)
            $table->integer('sack_number');

            $table->boolean('refrigerated')->default(false);
            $table->string('seal', 100)->nullable(); // precinto

            // Totales de esa saca (para consultar rápido)
            $table->integer('packages_count')->default(0);
            $table->decimal('pounds_total', 10, 2)->default(0);
            $table->decimal('kilograms_total', 10, 2)->default(0);

            $table->timestamps();

            $table->foreign('transfer_id')
                ->references('id')->on('transfers')
                ->cascadeOnDelete();

            // No repetir número de saca dentro del mismo traslado
            $table->unique(['transfer_id', 'sack_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_sacks');
    }
};
