// resources/js/Pages/Reports/WeightReport.tsx
import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { CalendarIcon, Download, Loader2, Scale } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Enterprise = { id: string | number; name: string };

export default function WeightReport({
    rows = [],
    startDate: initialStart,
    endDate: initialEnd,
    enterprises = [],
    enterpriseId: initialEnterpriseId,
}: any) {
    const [startDate, setStartDate] = useState(initialStart || "");
    const [endDate, setEndDate] = useState(initialEnd || "");
    const [enterpriseId, setEnterpriseId] = useState<string>(
        initialEnterpriseId ? String(initialEnterpriseId) : "all"
    );
    const [loading, setLoading] = useState(false);

    const actionsEnabled = useMemo(
        () => !!startDate && !!endDate && !!enterpriseId,
        [startDate, endDate, enterpriseId]
    );

    const handleFilter = () => {
        if (!actionsEnabled) return;
        router.get(
            "/reports/weights",
            {
                start_date: startDate,
                end_date: endDate,
                enterprise_id: enterpriseId,
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleExport = () => {
        if (!actionsEnabled) return;
        setLoading(true);
        window.location.href = `/reports/weights/export?start_date=${startDate}&end_date=${endDate}&enterprise_id=${enterpriseId}`;
        setTimeout(() => setLoading(false), 1000);
    };

    const fmt = (n: number | string) =>
        new Intl.NumberFormat("es-EC", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(n ?? 0));

    const totalLbs = rows.reduce(
        (sum: number, r: any) => sum + parseFloat(r.total_libras || 0),
        0
    );
    const totalKg = rows.reduce(
        (sum: number, r: any) => sum + parseFloat(r.total_kilos || 0),
        0
    );

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
                            Peso total (en libras y kilos) por agencia de
                            origen.
                        </p>
                    </div>
                </div>

                {/* Contenido */}
                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    {/* Filtros */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                        {/* Empresa */}
                        <div className="w-full md:max-w-sm">
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
                                {/* 👇 Mostrar igual que los demás: "Todos" */}
                                <option value="all">Todos</option>
                                {enterprises.map((e: Enterprise) => (
                                    <option key={e.id} value={String(e.id)}>
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        </div>

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
                                disabled={!actionsEnabled}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50"
                            >
                                Filtrar Resultados
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={!actionsEnabled || loading}
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

                    {/* Rango */}
                    <div className="text-red-400 text-sm italic mb-4">
                        {actionsEnabled
                            ? `Mostrando resultados desde ${format(
                                  new Date(startDate),
                                  "PPP",
                                  { locale: es }
                              )} hasta ${format(new Date(endDate), "PPP", {
                                  locale: es,
                              })}`
                            : "Seleccione empresa y rango de fechas para ver los resultados."}
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
                                                <td className="px-4 py-2">
                                                    {r.agencia_origen}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {r.rutas || "-"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {fmt(r.total_libras)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {fmt(r.total_kilos)}
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Totales */}
                                        <tr className="font-bold text-white text-center bg-gradient-to-r from-red-700 via-yellow-500 to-red-700 border-t-2 border-red-600">
                                            <td className="px-4 py-2 text-left">
                                                TOTAL GENERAL: {rows.length}{" "}
                                                registros
                                            </td>
                                            <td className="px-4 py-2">-</td>
                                            <td className="px-4 py-2">
                                                {fmt(totalLbs)}
                                            </td>
                                            <td className="px-4 py-2">
                                                {fmt(totalKg)}
                                            </td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center text-red-400 px-4 py-6"
                                        >
                                            {actionsEnabled
                                                ? "Sin resultados."
                                                : "Seleccione filtros para ver resultados."}
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
