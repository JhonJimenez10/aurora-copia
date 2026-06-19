<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('shipment_sacks', function (Blueprint $table) {
            // Número de saca que el operador asigna manualmente al armar el embarque
            $table->string('sack_number', 20)->nullable()->after('transfer_sack_id');
        });
    }

    public function down(): void
    {
        Schema::table('shipment_sacks', function (Blueprint $table) {
            $table->dropColumn('sack_number');
        });
    }
};