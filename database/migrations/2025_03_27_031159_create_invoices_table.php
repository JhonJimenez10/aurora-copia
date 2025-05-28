<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enterprise_id');
            $table->uuid('sender_id'); // a quién se factura (remitente)
            $table->uuid('reception_id')->nullable(); // puede estar ligada al envío

            // Numeración de factura y tipo (por ejemplo: FC, FE, etc.)
            $table->string('establishment', 10);  // ej. "001"
            $table->string('emission_point', 10);   // ej. "001"
            $table->integer('sequential')->default(0);
            // podrá repetirse en distintas empresas, pero no dentro de la misma.
            $table->string('number');
            $table->unique(['enterprise_id', 'number']);


            $table->string('invoice_type', 2)->default('FC'); // FC, FE, NC, ND
            $table->date('issue_date');
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('vat', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);

            $table->string('sri_status', 10)->default('PENDING'); // PENDING, AUTHORIZED, REJECTED, CANCELLED
            $table->string('auth_number')->nullable();
            $table->string('access_key')->unique();
            $table->dateTime('auth_date')->nullable();
            $table->text('observations')->nullable();
            $table->string('xml_url')->nullable();
            $table->timestamps();

            $table->foreign('enterprise_id')
                ->references('id')
                ->on('enterprises')
                ->cascadeOnDelete();
            $table->foreign('sender_id')
                ->references('id')
                ->on('senders')
                ->restrictOnDelete();
            $table->foreign('reception_id')
                ->references('id')
                ->on('receptions')
                ->nullOnDelete();
        });
    }
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique(['enterprise_id', 'number']);
            $table->dropUnique(['access_key']); // También si quieres ser explícito
        });

        Schema::dropIfExists('invoices');
    }
};
