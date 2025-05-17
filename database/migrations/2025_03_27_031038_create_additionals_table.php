<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('additionals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('reception_id');
            $table->uuid('art_packg_id')->nullable(); // referencia al catálogo de embalajes/adicionales

            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->timestamps();

            $table->foreign('reception_id')
                ->references('id')
                ->on('receptions')
                ->cascadeOnDelete();
            $table->foreign('art_packg_id')
                ->references('id')
                ->on('art_packgs')
                ->nullOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('additionals');
    }
};
