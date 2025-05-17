<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('package_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('package_id');
            $table->uuid('art_package_id')->nullable();

            $table->integer('quantity')->default(1);
            $table->string('unit', 50)->nullable();
            $table->boolean('volume')->default(false);
            $table->decimal('length', 10, 2)->default(0);
            $table->decimal('width', 10, 2)->default(0);
            $table->decimal('height', 10, 2)->default(0);
            $table->decimal('weight', 10, 2)->default(0);
            $table->decimal('pounds', 10, 2)->default(0);
            $table->decimal('kilograms', 10, 2)->default(0);

            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->decimal('decl_val', 10, 2)->default(0);
            $table->decimal('ins_val', 10, 2)->default(0);

            $table->timestamps();

            $table->foreign('package_id')->references('id')->on('packages')->cascadeOnDelete();
            $table->foreign('art_package_id')->references('id')->on('art_packages')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_items');
    }
};
