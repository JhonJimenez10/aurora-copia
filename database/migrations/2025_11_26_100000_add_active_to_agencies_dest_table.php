<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('agencies_dest', function (Blueprint $table) {
            // Agregamos la columna 'active' después de 'available_us'
            $table->boolean('active')->default(true)->after('available_us');
        });
    }

    public function down(): void
    {
        Schema::table('agencies_dest', function (Blueprint $table) {
            $table->dropColumn('active');
        });
    }
};
