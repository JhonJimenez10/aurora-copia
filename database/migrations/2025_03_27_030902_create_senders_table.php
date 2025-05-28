<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('senders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enterprise_id');
            $table->string('country', 100);
            $table->string('id_type', 50);  // identification_type
            $table->string('identification', 50);
            $table->string('full_name', 100);  // apellidos_nombres
            $table->string('address', 255)->nullable();
            $table->string('phone', 50)->nullable();
            $table->boolean('whatsapp')->default(false);
            $table->string('email', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('city', 100)->nullable(); // parroquia
            $table->string('canton', 100)->nullable();
            $table->string('state', 100)->nullable();  // provincia
            $table->boolean('blocked')->default(false);
            $table->boolean('alert')->default(false);
            $table->timestamps();

            $table->foreign('enterprise_id')->references('id')->on('enterprises')->cascadeOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('senders');
    }
};
