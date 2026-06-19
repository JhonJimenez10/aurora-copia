<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('shipment_sacks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('shipment_id');
            $table->uuid('transfer_sack_id'); // saca del traslado confirmada

            // Caché de totales al momento de asignar
            $table->integer('packages_count')->default(0);
            $table->decimal('pounds_total', 10, 2)->default(0);
            $table->decimal('kilograms_total', 10, 2)->default(0);

            $table->timestamps();

            $table->foreign('shipment_id')
                ->references('id')->on('shipments')
                ->cascadeOnDelete();

            $table->foreign('transfer_sack_id')
                ->references('id')->on('transfer_sacks')
                ->restrictOnDelete();

            // Una saca no puede estar en dos embarques
            $table->unique(['transfer_sack_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_sacks');
    }
};