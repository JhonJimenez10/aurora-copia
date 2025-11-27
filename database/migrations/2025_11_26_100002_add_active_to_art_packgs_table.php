<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('art_packgs', function (Blueprint $table) {
            // Agregamos la columna 'active' después de 'canceled'
            $table->boolean('active')->default(true)->after('canceled');
        });
    }

    public function down(): void
    {
        Schema::table('art_packgs', function (Blueprint $table) {
            $table->dropColumn('active');
        });
    }
};
