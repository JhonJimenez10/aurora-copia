<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transfer_sack_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('transfer_sack_id');
            $table->uuid('package_id'); // de la tabla packages

            // Caché de pesos en el momento del traslado
            $table->decimal('pounds', 10, 2)->default(0);
            $table->decimal('kilograms', 10, 2)->default(0);

            $table->timestamps();

            $table->foreign('transfer_sack_id')
                ->references('id')->on('transfer_sacks')
                ->cascadeOnDelete();

            $table->foreign('package_id')
                ->references('id')->on('packages')
                ->restrictOnDelete();

            // Un paquete no debería repetirse dentro de la misma saca
            $table->unique(['transfer_sack_id', 'package_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_sack_packages');
    }
};
