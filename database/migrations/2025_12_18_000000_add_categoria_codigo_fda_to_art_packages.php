<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('art_packages', function (Blueprint $table) {
            $table->string('categoria', 100)->nullable()->after('codigo_hs');
            $table->string('codigo_fda', 50)->nullable()->after('categoria');
        });
    }

    public function down(): void
    {
        Schema::table('art_packages', function (Blueprint $table) {
            $table->dropColumn(['categoria', 'codigo_fda']);
        });
    }
};