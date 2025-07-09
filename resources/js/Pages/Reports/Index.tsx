// resources/js/Pages/Reports/Index.tsx
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ReportsIndex({
    receptions = [],
    startDate: initialStart,
    endDate: initialEnd,
}: any) {
    const [startDate, setStartDate] = useState(initialStart || "");
    const [endDate, setEndDate] = useState(initialEnd || "");
    const [loading, setLoading] = useState(false);

    const handleExport = () => {
        if (!startDate || !endDate) {
            alert("Seleccione fecha de inicio y fecha de fin.");
            return;
        }
        setLoading(true);
        window.location.href = `/reports/export?start_date=${startDate}&end_date=${endDate}`;
        setTimeout(() => setLoading(false), 1000);
    };

    const handleFilter = () => {
        if (!startDate || !endDate) {
            alert("Seleccione fecha de inicio y fecha de fin.");
            return;
        }
        router.get("/reports", { start_date: startDate, end_date: endDate });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Reportes de Envíos" />

            <div className="container mx-auto px-4 py-8">
                {/* Cabecera visual */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">Reporte de Envíos</h1>
                    <p className="text-white text-sm">
                        Selecciona un rango de fechas para generar reportes
                        detallados
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    {/* Filtros y acciones */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                        {/* Fecha de inicio */}
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

                        {/* Fecha de fin */}
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

                    {/* Rango seleccionado */}
                    <div className="text-red-400 text-sm italic mb-4">
                        {startDate && endDate
                            ? `Mostrando resultados desde ${format(
                                  new Date(startDate),
                                  "PPP",
                                  { locale: es }
                              )} hasta ${format(new Date(endDate), "PPP", {
                                  locale: es,
                              })}`
                            : "Seleccione un rango de fechas para ver los envíos."}
                    </div>

                    {/* Tabla */}
                    <div className="overflow-auto rounded-lg border border-red-700 bg-slate-900">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800 text-white">
                                <tr>
                                    <th className="px-4 py-2">Guía</th>
                                    <th className="px-4 py-2">Remitente</th>
                                    <th className="px-4 py-2">Destinatario</th>
                                    <th className="px-4 py-2">Peso (kg)</th>
                                    <th className="px-4 py-2">Contenido</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receptions.length ? (
                                    receptions.map((r: any) =>
                                        r.packages.map((p: any) => (
                                            <tr
                                                key={p.id}
                                                className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                            >
                                                <td className="px-4 py-2">
                                                    {p.barcode}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {r.sender?.full_name}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {r.recipient?.full_name}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {p.kilograms}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {p.art_package?.name ||
                                                        "Sin artículo"}
                                                </td>
                                            </tr>
                                        ))
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-4 text-red-400"
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
