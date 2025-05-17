<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('reception_id');
            $table->uuid('art_package_id')->nullable();
            $table->string('service_type', 50);
            $table->string('content', 255)->nullable();
            $table->decimal('pounds', 10, 2)->default(0);
            $table->decimal('kilograms', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->decimal('decl_val', 10, 2)->default(0);
            $table->decimal('ins_val', 10, 2)->default(0);
            $table->string('barcode', 30)->nullable();

            $table->timestamps();

            $table->foreign('reception_id')
                ->references('id')->on('receptions')->cascadeOnDelete();

            $table->foreign('art_package_id')
                ->references('id')->on('art_packages')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
