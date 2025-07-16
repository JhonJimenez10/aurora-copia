<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agencies_dest', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enterprise_id'); // para filtrar por empresa, coherente con el resto del sistema

            $table->string('name', 100); // Nombre
            $table->string('code_letters', 10); // CodigoLetras
            $table->string('trade_name', 150)->nullable(); // NombreComercial
            $table->string('address', 255)->nullable(); // Direccion
            $table->string('phone', 20)->nullable(); // Telefono
            $table->string('postal_code', 20)->nullable(); // CodigoPostal
            $table->string('city', 100)->nullable(); // CantonCountry
            $table->string('state', 100)->nullable(); // Provincia
            $table->boolean('available_us')->default(false); // Disponible para envios desde Ecuador hacia EEUU
            $table->decimal('value', 10, 2)->default(0);
            $table->timestamps();

            $table->foreign('enterprise_id')->references('id')->on('enterprises')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agencies_dest');
    }
};
