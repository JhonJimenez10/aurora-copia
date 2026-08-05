<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * La validación del backend ya permitía sack_prefix vacío ("Sin prefijo"),
     * pero la COLUMNA en la base de datos seguía siendo NOT NULL. Por eso
     * pasaba la validación pero fallaba al insertar (SQL error), mostrando
     * el mensaje genérico "Error interno al guardar el embarque.".
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE shipments ALTER COLUMN sack_prefix DROP NOT NULL');
        } else {
            DB::statement('ALTER TABLE shipments MODIFY sack_prefix VARCHAR(20) NULL');
        }
    }

    public function down(): void
    {
        // Antes de volver a exigir NOT NULL, rellenamos los que hayan
        // quedado en null para no romper la restricción al revertir.
        DB::table('shipments')->whereNull('sack_prefix')->update(['sack_prefix' => '']);

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE shipments ALTER COLUMN sack_prefix SET NOT NULL');
        } else {
            DB::statement('ALTER TABLE shipments MODIFY sack_prefix VARCHAR(20) NOT NULL');
        }
    }
};