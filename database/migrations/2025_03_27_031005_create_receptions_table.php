<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('receptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('number', 20); // Ej: "001-100"
            $table->string('route', 255);
            $table->dateTime('date_time');
            $table->string('agency_origin', 100);
            $table->string('agency_dest', 100); // agencia_destino

            // Relaciones con remitente y destinatario
            $table->uuid('sender_id');
            $table->uuid('recipient_id');

            // Totales y conceptos (almacena los montos)
            $table->decimal('pkg_total', 10, 2)->default(0);    // paquetes
            $table->decimal('ins_pkg', 10, 2)->default(0);        // seguro_paquetes
            $table->decimal('packaging', 10, 2)->default(0);       // embalaje
            $table->decimal('ship_ins', 10, 2)->default(0);        // seguro_envio
            $table->decimal('clearance', 10, 2)->default(0);       // desaduanizacion
            $table->decimal('trans_dest', 10, 2)->default(0);      // transporte_destino
            $table->decimal('transmit', 10, 2)->default(0);        // transmision
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('vat15', 10, 2)->default(0);           // IVA 15%
            $table->decimal('total', 10, 2)->default(0);

            $table->string('pay_method', 50)->nullable();         // forma_cobro
            $table->decimal('cash_recv', 10, 2)->default(0);        // efectivo_recibido
            $table->decimal('change', 10, 2)->default(0);

            $table->timestamps();

            // Claves foráneas
            $table->foreign('sender_id')
                ->references('id')
                ->on('senders')
                ->restrictOnDelete();
            $table->foreign('recipient_id')
                ->references('id')
                ->on('recipients')
                ->restrictOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('receptions');
    }
};
