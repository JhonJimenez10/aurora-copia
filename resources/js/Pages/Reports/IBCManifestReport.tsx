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
    enterprises = [], // <-- recibir listado de empresas desde backend
}: any) {
    const [startDate, setStartDate] = useState(initialStart || "");
    const [endDate, setEndDate] = useState(initialEnd || "");
    const [enterpriseId, setEnterpriseId] = useState(initialEnterpriseId || "");
    const [loading, setLoading] = useState(false);

    const handleExport = (csv: boolean = false) => {
        if (!startDate || !endDate) {
            alert("Seleccione fecha de inicio y fecha de fin.");
            return;
        }
        setLoading(true);
        const url = `/reports/ibc-manifest/export${
            csv ? "-csv" : ""
        }?start_date=${startDate}&end_date=${endDate}&enterprise_id=${enterpriseId}`;
        window.location.href = url;
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
                        Seleccione un rango de fechas y empresa para exportar.
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-start gap-4 mb-4">
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
                                {enterprises.map((ent: any) => (
                                    <option key={ent.id} value={ent.id}>
                                        {ent.name}
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

                        {/* Botones */}
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleExport(false)}
                                disabled={
                                    !startDate ||
                                    !endDate ||
                                    !enterpriseId ||
                                    loading
                                }
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
                            <Button
                                onClick={() => handleExport(true)}
                                disabled={
                                    !startDate ||
                                    !endDate ||
                                    !enterpriseId ||
                                    loading
                                }
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
                            : "Seleccione un rango de fechas y empresa para habilitar exportación."}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
