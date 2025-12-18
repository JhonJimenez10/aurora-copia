<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transfer_sack_packages', function (Blueprint $table) {
            // Agrega la columna 'confirmed' después de 'kilograms'
            // Por defecto FALSE = no confirmado (pendiente)
            // TRUE = confirmado (llegó físicamente a destino)
            $table->boolean('confirmed')->default(false)->after('kilograms');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transfer_sack_packages', function (Blueprint $table) {
            $table->dropColumn('confirmed');
        });
    }
};
