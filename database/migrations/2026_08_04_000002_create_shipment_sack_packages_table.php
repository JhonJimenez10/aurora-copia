<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('shipment_sack_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('shipment_sack_id');
            $table->uuid('package_id');
            // Saca de TRASLADO de origen del paquete, solo para trazabilidad
            // (saber de qué traslado/ruta venía cada paquete desglosado).
            $table->uuid('transfer_sack_id');

            $table->decimal('pounds', 10, 2)->default(0);
            $table->decimal('kilograms', 10, 2)->default(0);

            $table->timestamps();

            $table->foreign('shipment_sack_id')
                ->references('id')->on('shipment_sacks')
                ->cascadeOnDelete();

            $table->foreign('package_id')
                ->references('id')->on('packages')
                ->restrictOnDelete();

            $table->foreign('transfer_sack_id')
                ->references('id')->on('transfer_sacks')
                ->restrictOnDelete();

            // Un paquete solo puede estar en UNA saca de embarque a la vez
            // (equivalente al unique(transfer_sack_id) que tenía antes
            // shipment_sacks, pero ahora a nivel de paquete individual).
            $table->unique('package_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_sack_packages');
    }
};