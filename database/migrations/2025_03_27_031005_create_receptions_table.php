<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('receptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enterprise_id');
            $table->string('number', 20); // Ej: "001-100"
            $table->string('route', 255);
            $table->dateTime('date_time');
            $table->string('agency_origin', 100);

            // Ahora agency_dest es una clave UUID que referencia a agencies_dest
            $table->uuid('agency_dest');

            $table->uuid('sender_id');
            $table->uuid('recipient_id');

            $table->decimal('pkg_total', 10, 2)->default(0);
            $table->decimal('ins_pkg', 10, 2)->default(0);
            $table->decimal('packaging', 10, 2)->default(0);
            $table->decimal('ship_ins', 10, 2)->default(0);
            $table->decimal('clearance', 10, 2)->default(0);
            $table->decimal('trans_dest', 10, 2)->default(0);
            $table->decimal('transmit', 10, 2)->default(0);
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('vat15', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);

            $table->string('pay_method', 50)->nullable();
            $table->decimal('cash_recv', 10, 2)->default(0);
            $table->decimal('change', 10, 2)->default(0);
            $table->boolean('annulled')->default(false)->after('change');
            $table->uuid('annulled_by')->nullable()->after('annulled');
            $table->timestamp('annulled_at')->nullable()->after('annulled_by');
            $table->timestamps();

            // Relaciones foráneas
            $table->foreign('enterprise_id')
                ->references('id')
                ->on('enterprises')
                ->restrictOnDelete();

            $table->foreign('sender_id')
                ->references('id')
                ->on('senders')
                ->restrictOnDelete();

            $table->foreign('recipient_id')
                ->references('id')
                ->on('recipients')
                ->restrictOnDelete();

            $table->foreign('agency_dest')
                ->references('id')
                ->on('agencies_dest')
                ->restrictOnDelete(); // puedes usar cascadeOnDelete si lo deseas
            $table->foreign('annulled_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete(); // Permite que el campo sea nulo si el usuario es eliminado
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receptions');
    }
};
