import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { CalendarIcon, Download, Loader2 } from "lucide-react";

interface ACASAviancaRow {
    hawb: string;
    origin: string;
    destination: string;
    pieces: number | string;
    weight: number | string;
}

interface ACASAviancaManifestProps {
    rows: ACASAviancaRow[];
    startDate: string;
    endDate: string;
}

export default function ACASAviancaManifestReport({
    rows = [],
    startDate: initialStart = "",
    endDate: initialEnd = "",
}: ACASAviancaManifestProps) {
    const [startDate, setStartDate] = useState<string>(initialStart);
    const [endDate, setEndDate] = useState<string>(initialEnd);
    const [loading, setLoading] = useState(false);
    const [filtered, setFiltered] = useState(rows.length > 0);

    const handleFilter = () => {
        if (!startDate || !endDate) {
            alert("Seleccione fecha de inicio y fecha de fin.");
            return;
        }
        setFiltered(false);
        router.get(
            "/reports/acas-avianca-manifest",
            { start_date: startDate, end_date: endDate },
            { preserveState: true, onSuccess: () => setFiltered(true) }
        );
    };

    const handleExport = () => {
        if (!startDate || !endDate) {
            alert("Seleccione fecha de inicio y fecha de fin.");
            return;
        }
        setLoading(true);
        window.location.href = `/reports/acas-avianca-manifest/export?start_date=${startDate}&end_date=${endDate}`;
        setTimeout(() => setLoading(false), 1000);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Reporte Manifiesto ACAS Avianca" />
            <div className="container mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">
                        Manifiesto ACAS Avianca
                    </h1>
                    <p className="text-white text-sm">
                        Filtra por fechas y exporta el manifiesto en Excel.
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-6 rounded-b-lg shadow-md">
                    {/* Filtros */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                        <div className="w-full md:max-w-xs">
                            <label className="block text-sm font-medium text-red-400 mb-1">
                                Desde
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-red-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="pl-10 w-full px-3 py-2 bg-slate-800 text-white border border-red-700 rounded-md"
                                />
                            </div>
                        </div>

                        <div className="w-full md:max-w-xs">
                            <label className="block text-sm font-medium text-red-400 mb-1">
                                Hasta
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-red-400" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-10 w-full px-3 py-2 bg-slate-800 text-white border border-red-700 rounded-md"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleFilter}
                                disabled={!startDate || !endDate}
                                variant="outline"
                                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                                Filtrar Resultados
                            </Button>

                            <Button
                                onClick={handleExport}
                                disabled={!filtered || loading}
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

                    <p className="text-red-400 text-sm italic mb-4">
                        {startDate && endDate
                            ? `Mostrando resultados desde ${startDate} hasta ${endDate}`
                            : "Seleccione un rango de fechas para ver los resultados."}
                    </p>

                    {/* Tabla simplificada */}
                    {filtered && rows.length > 0 ? (
                        <div className="overflow-auto rounded-lg border border-red-700 bg-slate-900">
                            <table className="w-full table-auto text-sm text-white">
                                <thead className="bg-red-800 text-white">
                                    <tr className="text-center">
                                        <th className="px-4 py-3">HAWB</th>
                                        <th className="px-4 py-3">Origen</th>
                                        <th className="px-4 py-3">Destino</th>
                                        <th className="px-4 py-3">Piezas</th>
                                        <th className="px-4 py-3">Peso</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-700">
                                    {rows.map((r, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-[#1b1b1b] text-center align-middle"
                                        >
                                            <td className="px-4 py-3">
                                                {r.hawb}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.origin}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.destination}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.pieces}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.weight}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : filtered ? (
                        <p className="text-red-400 text-center">
                            No hay resultados.
                        </p>
                    ) : null}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
