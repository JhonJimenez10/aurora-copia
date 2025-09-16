// resources/js/Pages/Reception/Reports/IBCManifestReport.tsx
import { useState } from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function IBCManifestReport({
    startDate: initialStart,
    endDate: initialEnd,
    enterpriseId: initialEnterpriseId,
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
        window.location.href = `/reports/ibc-manifest/export?start_date=${startDate}&end_date=${endDate}&enterprise_id=${
            initialEnterpriseId || ""
        }`;
        setTimeout(() => setLoading(false), 1000);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manifiesto Aduana IBC" />
            <div className="container mx-auto px-4 py-8">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">
                        Manifiesto Aduana IBC
                    </h1>
                    <p className="text-white text-sm">
                        Seleccione un rango de fechas y exporte a Excel.
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-start gap-4 mb-4">
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

                        {/* Exportar */}
                        <div>
                            <Button
                                onClick={handleExport}
                                disabled={!startDate || !endDate || loading}
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
                        {/* Exportar CSV */}
                        <div>
                            <Button
                                onClick={() => {
                                    if (!startDate || !endDate) {
                                        alert(
                                            "Seleccione fecha de inicio y fecha de fin."
                                        );
                                        return;
                                    }
                                    setLoading(true);
                                    window.location.href = `/reports/ibc-manifest/export-csv?start_date=${startDate}&end_date=${endDate}&enterprise_id=${
                                        initialEnterpriseId || ""
                                    }`;
                                    setTimeout(() => setLoading(false), 1000);
                                }}
                                disabled={!startDate || !endDate || loading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Exportando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        Exportar a CSV
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Rango seleccionado */}
                    <div className="text-red-400 text-sm italic">
                        {startDate && endDate
                            ? `Mostrando resultados desde ${format(
                                  new Date(startDate),
                                  "PPP",
                                  { locale: es }
                              )} hasta ${format(new Date(endDate), "PPP", {
                                  locale: es,
                              })}`
                            : "Seleccione un rango de fechas para habilitar exportación."}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
