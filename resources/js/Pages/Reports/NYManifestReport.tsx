import { useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { CalendarIcon, Download, Loader2 } from "lucide-react";

interface Enterprise {
    id: number | string;
    name: string;
    commercial_name?: string;
}

export default function NYManifestReport({
    startDate: initialStart = "",
    endDate: initialEnd = "",
    enterpriseId: initialEnterprise = "",
    enterprises = [],
}: {
    startDate: string;
    endDate: string;
    enterpriseId: string | number;
    enterprises: Enterprise[];
}) {
    const [startDate, setStartDate] = useState<string>(initialStart);
    const [endDate, setEndDate] = useState<string>(initialEnd);
    const [enterpriseId, setEnterpriseId] = useState<string>(
        String(initialEnterprise || ""),
    );
    const [loading, setLoading] = useState(false);

    const enterpriseOptions = useMemo(
        () =>
            (enterprises || []).filter((e) => e.commercial_name !== "COAVPRO"),
        [enterprises],
    );

    const handleExport = () => {
        if (!startDate || !endDate || !enterpriseId) {
            alert("Seleccione empresa y rango de fechas.");
            return;
        }
        setLoading(true);
        window.location.href = `/reports/ny-manifest/export?start_date=${startDate}&end_date=${endDate}&enterprise_id=${enterpriseId}`;
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manifiesto Aduana NY" />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">Manifiesto Aduana NY</h1>
                    <p className="text-white text-sm">
                        Seleccione empresa y rango de fechas para exportar el
                        manifiesto de Nueva York.
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-6 rounded-b-lg shadow-md">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                        {/* Empresa */}
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
                                <option value="">Seleccione empresa</option>
                                <option value="all">
                                    🌟 TODAS LAS EMPRESAS
                                </option>
                                {enterpriseOptions.map((e) => (
                                    <option key={e.id} value={String(e.id)}>
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Desde */}
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

                        {/* Hasta */}
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

                        {/* Botón */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleExport}
                                disabled={
                                    !startDate ||
                                    !endDate ||
                                    !enterpriseId ||
                                    loading
                                }
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
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

                    {/* Info */}
                    <div className="bg-slate-800 border border-red-800 rounded-lg p-4 text-sm text-slate-300">
                        <p className="font-medium text-red-400 mb-2">
                            📋 Información del reporte
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Una fila por artículo por guía (HAWB)</li>
                            <li>
                                Incluye columnas FDA para artículos con
                                categoría{" "}
                                <span className="text-yellow-400">COMIDA</span>{" "}
                                y{" "}
                                <span className="text-yellow-400">
                                    COSMÉTICOS
                                </span>
                            </li>
                            <li>
                                Formato compatible con sistema de aduana de
                                Nueva York
                            </li>
                            <li>
                                Excluye recepciones anuladas y empresa COAVPRO
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
