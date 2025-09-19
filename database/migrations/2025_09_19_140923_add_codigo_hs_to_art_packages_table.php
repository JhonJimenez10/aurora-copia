<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('art_packages', function (Blueprint $table) {
            $table->string('codigo_hs', 50)->nullable()->after('translation');
        });
    }

    public function down(): void
    {
        Schema::table('art_packages', function (Blueprint $table) {
            $table->dropColumn('codigo_hs');
        });
    }
};
