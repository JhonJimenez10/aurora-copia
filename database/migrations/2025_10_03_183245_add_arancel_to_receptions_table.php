<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receptions', function (Blueprint $table) {
            // Agrega la columna 'arancel' entre 'pkg_total' y 'ins_pkg'
            $table->decimal('arancel', 10, 2)
                ->default(0)
                ->after('pkg_total');
        });
    }

    public function down(): void
    {
        Schema::table('receptions', function (Blueprint $table) {
            $table->dropColumn('arancel');
        });
    }
};
