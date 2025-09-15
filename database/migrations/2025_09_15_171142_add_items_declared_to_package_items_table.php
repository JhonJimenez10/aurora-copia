<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('package_items', function (Blueprint $table) {
            // nombre en inglés, camel_case y máximo 13 caracteres:
            $table->decimal('items_declrd', 10, 2)->default(0)->after('total');
        });
    }

    public function down(): void
    {
        Schema::table('package_items', function (Blueprint $table) {
            $table->dropColumn('items_declrd');
        });
    }
};
