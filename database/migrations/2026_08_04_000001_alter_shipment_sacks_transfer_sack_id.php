<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Antes: 1 shipment_sack = 1 transfer_sack completa (unique + NOT NULL).
     * Ahora: una saca de embarque se arma con paquetes SUELTOS que pueden
     * venir de distintas sacas de traslado, así que transfer_sack_id deja
     * de ser único y obligatorio en esta tabla (el vínculo real por
     * paquete queda en la nueva tabla shipment_sack_packages).
     */
    public function up(): void
    {
        Schema::table('shipment_sacks', function (Blueprint $table) {
            $table->dropUnique(['transfer_sack_id']);
        });

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE shipment_sacks ALTER COLUMN transfer_sack_id DROP NOT NULL');
        } else {
            DB::statement('ALTER TABLE shipment_sacks MODIFY transfer_sack_id CHAR(36) NULL');
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE shipment_sacks ALTER COLUMN transfer_sack_id SET NOT NULL');
        } else {
            DB::statement('ALTER TABLE shipment_sacks MODIFY transfer_sack_id CHAR(36) NOT NULL');
        }

        Schema::table('shipment_sacks', function (Blueprint $table) {
            $table->unique('transfer_sack_id');
        });
    }
};