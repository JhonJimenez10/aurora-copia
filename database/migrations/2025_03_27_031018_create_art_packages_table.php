<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('art_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enterprise_id');
            $table->string('name', 100);
            $table->string('translation', 100)->nullable();
            $table->string('unit_type', 50)->nullable();
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('agent_val', 10, 2)->default(0);
            $table->boolean('canceled')->default(false);
            $table->timestamps();

            $table->foreign('enterprise_id')->references('id')->on('enterprises')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('art_packages');
    }
};
