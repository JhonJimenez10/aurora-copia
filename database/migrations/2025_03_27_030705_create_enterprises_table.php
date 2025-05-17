<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('enterprises', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('ruc', 20);
            $table->string('name', 100);
            $table->string('commercial_name', 150);
            $table->string('matrix_address', 255);
            $table->string('branch_address', 255); // establishment_address
            $table->boolean('accounting')->default(false);
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('signature', 255)->nullable(); // ruta del .p12
            $table->string('signature_password', 100)->nullable();
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('enterprises');
    }
};
