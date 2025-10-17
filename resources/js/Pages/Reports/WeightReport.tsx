import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { CalendarIcon, Download, Loader2, Scale } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function WeightReport({
    rows = [],
    startDate: initialStart,
    endDate: initialEnd,
}: any) {
    const [startDate, setStartDate] = useState(initialStart || "");
    const [endDate, setEndDate] = useState(initialEnd || "");
    const [loading, setLoading] = useState(false);

    const handleFilter = () => {
        if (!startDate || !endDate) {
            alert("Seleccione fecha de inicio y fecha de fin.");
            return;
        }
        router.get("/reports/weights", {
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleExport = () => {
        if (!startDate || !endDate) {
            alert("Seleccione fecha de inicio y fecha de fin.");
            return;
        }
        setLoading(true);
        window.location.href = `/reports/weights/export?start_date=${startDate}&end_date=${endDate}`;
        setTimeout(() => setLoading(false), 1000);
    };

    const fmt = (n: number | string) =>
        new Intl.NumberFormat("es-EC", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(n ?? 0));

    return (
        <AuthenticatedLayout>
            <Head title="Reporte de Pesos" />
            <div className="container mx-auto px-4 py-8">
                {/* Encabezado */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg flex items-center gap-3">
                    <Scale className="w-6 h-6" />
                    <div>
                        <h1 className="text-2xl font-bold">Reporte de Pesos</h1>
                        <p className="text-white text-sm">
                            Peso total (en libras y kilos) facturado por agencia
                            de origen.
                        </p>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    {/* Filtros */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                        {/* Desde */}
                        <div className="w-full md:max-w-xs">
                            <label
                                htmlFor="start_date"
                                className="block text-sm font-medium text-red-400 mb-1"
                            >
                                Desde
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-red-400" />
                                <input
                                    id="start_date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="pl-10 w-full px-3 py-2 bg-slate-800 text-white border border-red-700 rounded-md"
                                />
                            </div>
                        </div>

                        {/* Hasta */}
                        <div className="w-full md:max-w-xs">
                            <label
                                htmlFor="end_date"
                                className="block text-sm font-medium text-red-400 mb-1"
                            >
                                Hasta
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-red-400" />
                                <input
                                    id="end_date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-10 w-full px-3 py-2 bg-slate-800 text-white border border-red-700 rounded-md"
                                />
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleFilter}
                                variant="outline"
                                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                                Filtrar Resultados
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Exportando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        Exportar a Excel
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Rango de fechas */}
                    <div className="text-red-400 text-sm italic mb-4">
                        {startDate && endDate
                            ? `Mostrando resultados desde ${format(
                                  new Date(startDate),
                                  "PPP",
                                  { locale: es }
                              )} hasta ${format(new Date(endDate), "PPP", {
                                  locale: es,
                              })}`
                            : "Seleccione un rango de fechas para ver los resultados."}
                    </div>

                    {/* Tabla */}
                    <div className="overflow-auto rounded-lg border border-red-700 bg-slate-900">
                        <table className="w-full table-fixed text-sm text-white">
                            <colgroup>
                                <col className="w-[35%]" />
                                <col className="w-[35%]" />
                                <col className="w-[15%]" />
                                <col className="w-[15%]" />
                            </colgroup>

                            <thead className="bg-red-800 text-white">
                                <tr className="text-center">
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Agencia Origen
                                    </th>
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Ruta
                                    </th>
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Peso (Lbs)
                                    </th>
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Peso (Kg)
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {rows.length ? (
                                    <>
                                        {rows.map((r: any, idx: number) => (
                                            <tr
                                                key={idx}
                                                className="text-center"
                                            >
                                                <td>{r.agencia_origen}</td>
                                                <td>{r.rutas || "-"}</td>
                                                <td>{fmt(r.total_libras)}</td>
                                                <td>{fmt(r.total_kilos)}</td>
                                            </tr>
                                        ))}

                                        {/* FILA DE TOTAL GENERAL */}
                                        <tr className="font-bold text-white text-center bg-gradient-to-r from-red-700 via-yellow-500 to-red-700 border-t-2 border-red-600">
                                            <td className="px-4 py-2 text-left">
                                                TOTAL GENERAL: {rows.length}{" "}
                                                registros
                                            </td>
                                            <td className="px-4 py-2">-</td>
                                            <td className="px-4 py-2">
                                                {fmt(
                                                    rows.reduce(
                                                        (sum: number, r: any) =>
                                                            sum +
                                                            parseFloat(
                                                                r.total_libras
                                                            ),
                                                        0
                                                    )
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                {fmt(
                                                    rows.reduce(
                                                        (sum: number, r: any) =>
                                                            sum +
                                                            parseFloat(
                                                                r.total_kilos
                                                            ),
                                                        0
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center text-red-400"
                                        >
                                            Sin resultados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
