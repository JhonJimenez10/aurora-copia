import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { CalendarIcon, Download, Loader2 } from "lucide-react";

interface AirlineManifestRow {
    barcode: string;
    shipper: string;
    consignee: string;
    weight: number | string;
    envelope: number;
    paq: number;
    bag: number;
    destination: string;
    contents: string;
    notes: string;
}

interface Enterprise {
    id: number | string;
    name: string;
}

interface AirlineManifestProps {
    rows: AirlineManifestRow[];
    startDate: string;
    endDate: string;
    enterpriseId: number | string;
    enterprises: Enterprise[]; // 🔹 Agregado
}

export default function AirlineManifestReport({
    rows = [],
    startDate: initialStart = "",
    endDate: initialEnd = "",
    enterpriseId: initialEnterprise,
    enterprises = [], // 🔹 Por defecto
}: AirlineManifestProps) {
    const [startDate, setStartDate] = useState<string>(initialStart);
    const [endDate, setEndDate] = useState<string>(initialEnd);
    const [enterpriseId, setEnterpriseId] = useState<number | string>(
        initialEnterprise
    );
    const [loading, setLoading] = useState(false);
    const [filtered, setFiltered] = useState(rows.length > 0);

    const handleFilter = () => {
        if (!startDate || !endDate) {
            alert("Seleccione fecha de inicio y fecha de fin.");
            return;
        }

        setFiltered(false);
        router.get(
            "/reports/airline-manifest",
            {
                start_date: startDate,
                end_date: endDate,
                enterprise_id: enterpriseId,
            },
            {
                preserveState: true,
                onSuccess: () => setFiltered(true),
            }
        );
    };

    const handleExport = () => {
        if (!startDate || !endDate) {
            alert("Seleccione fecha de inicio y fecha de fin.");
            return;
        }
        setLoading(true);
        window.location.href = `/reports/airline-manifest/export?start_date=${startDate}&end_date=${endDate}&enterprise_id=${enterpriseId}`;
        setTimeout(() => setLoading(false), 1000);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manifiesto Aerolínea" />
            <div className="container mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">Manifiesto Aerolínea</h1>
                    <p className="text-white text-sm">
                        Filtra por fechas y empresa, y exporta el manifiesto en
                        Excel.
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-6 rounded-b-lg shadow-md">
                    {/* Filtros */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                        <div className="w-full md:max-w-xs">
                            <label className="block text-sm font-medium text-red-400 mb-1">
                                Empresa
                            </label>
                            <select
                                value={enterpriseId}
                                onChange={(e) =>
                                    setEnterpriseId(e.target.value)
                                }
                                className="w-full px-3 py-2 bg-slate-800 text-white border border-red-700 rounded-md"
                            >
                                {enterprises.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        </div>

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

                    {/* Nota de rango */}
                    <p className="text-red-400 text-sm italic mb-4">
                        {startDate && endDate
                            ? `Mostrando resultados desde ${startDate} hasta ${endDate}`
                            : "Seleccione un rango de fechas para ver los resultados."}
                    </p>

                    {/* Tabla */}
                    {filtered && rows.length > 0 ? (
                        <div className="overflow-auto rounded-lg border border-red-700 bg-slate-900">
                            <table className="w-full table-fixed text-sm text-white">
                                <thead className="bg-red-800 text-white">
                                    <tr className="text-center">
                                        <th className="px-4 py-3">Barcode</th>
                                        <th className="px-4 py-3">Shipper</th>
                                        <th className="px-4 py-3">Consignee</th>
                                        <th className="px-4 py-3">Weight</th>
                                        <th className="px-4 py-3">Envelope</th>
                                        <th className="px-4 py-3">Paq</th>
                                        <th className="px-4 py-3">Bag</th>
                                        <th className="px-4 py-3">
                                            Destination
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-700">
                                    {rows.map((r, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-[#1b1b1b] text-center align-middle"
                                        >
                                            <td className="px-4 py-3">
                                                {r.barcode}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.shipper}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.consignee}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.weight}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.envelope}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.paq}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.bag}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.destination}
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
