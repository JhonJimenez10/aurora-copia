<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('art_packages', function (Blueprint $table) {
            // Puedes ajustarlo a decimal si quieres manejar valores monetarios.
            $table->decimal('arancel', 10, 2)->default(0)->after('agent_val');
        });
    }

    public function down(): void
    {
        Schema::table('art_packages', function (Blueprint $table) {
            $table->dropColumn('arancel');
        });
    }
};
