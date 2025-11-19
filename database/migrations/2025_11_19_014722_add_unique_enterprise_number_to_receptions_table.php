<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('receptions', function (Blueprint $table) {
            // 🔹 Hacer único el number por empresa
            $table->unique(
                ['enterprise_id', 'number'],
                'receptions_enterprise_number_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('receptions', function (Blueprint $table) {
            // 🔹 Eliminar el índice único si se hace rollback
            $table->dropUnique('receptions_enterprise_number_unique');
        });
    }
};
