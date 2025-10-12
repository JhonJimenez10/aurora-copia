<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('enterprises', function (Blueprint $table) {
            $table->string('province', 100)->nullable()->after('branch_address');
            $table->string('city', 100)->nullable()->after('province');
        });
    }

    public function down(): void
    {
        Schema::table('enterprises', function (Blueprint $table) {
            $table->dropColumn(['province', 'city']);
        });
    }
};
