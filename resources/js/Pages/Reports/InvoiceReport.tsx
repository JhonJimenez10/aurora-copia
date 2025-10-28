import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

type Enterprise = { id: number | string; name: string };

export default function InvoiceReport({
    rows = [],
    enterprises = [],
    enterpriseId: initialEnterpriseId,
    startDate: initialStart,
    endDate: initialEnd,
}: any) {
    const [enterpriseId, setEnterpriseId] = useState<string>(
        initialEnterpriseId ? String(initialEnterpriseId) : ""
    );
    const [startDate, setStartDate] = useState(initialStart || "");
    const [endDate, setEndDate] = useState(initialEnd || "");
    const [loading, setLoading] = useState(false);

    const datesEnabled = useMemo(() => !!enterpriseId, [enterpriseId]);
    const actionsEnabled = useMemo(
        () => !!enterpriseId && !!startDate && !!endDate,
        [enterpriseId, startDate, endDate]
    );

    const handleFilter = () => {
        if (!enterpriseId) {
            alert("Seleccione una empresa.");
            return;
        }
        if (!startDate || !endDate) {
            alert("Seleccione fecha de inicio y fecha de fin.");
            return;
        }

        router.get(
            "/reports/invoices",
            {
                enterprise_id: enterpriseId,
                start_date: startDate,
                end_date: endDate,
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleExport = () => {
        if (!actionsEnabled) {
            alert("Seleccione empresa y rango de fechas.");
            return;
        }
        setLoading(true);
        const params = new URLSearchParams({
            enterprise_id: enterpriseId,
            start_date: startDate,
            end_date: endDate,
        });
        window.location.href = `/reports/invoices/export?${params.toString()}`;
        setTimeout(() => setLoading(false), 1000);
    };

    const fmt = (n: number | string) =>
        new Intl.NumberFormat("es-EC", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(n ?? 0));

    return (
        <AuthenticatedLayout>
            <Head title="Reporte de Facturación" />
            <div className="container mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">
                        Reporte de Facturación
                    </h1>
                    <p className="text-white text-sm">
                        Seleccione empresa y rango de fechas para consultar los
                        detalles de facturación.
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                        {/* Empresa */}
                        <div className="w-full md:max-w-sm">
                            <label className="block text-sm font-medium text-red-400 mb-1">
                                Empresa
                            </label>
                            <Select
                                value={enterpriseId}
                                onValueChange={(v) => setEnterpriseId(v)}
                            >
                                <SelectTrigger className="w-full bg-slate-800 text-white border border-red-700 rounded-md">
                                    <SelectValue placeholder="Seleccione empresa" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 text-white border border-red-700">
                                    {enterprises.map((e: Enterprise) => (
                                        <SelectItem
                                            key={e.id}
                                            value={String(e.id)}
                                        >
                                            {e.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    disabled={!datesEnabled}
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="pl-10 w-full px-3 py-2 bg-slate-800 text-white border border-red-700 rounded-md disabled:opacity-50"
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
                                    disabled={!datesEnabled}
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-10 w-full px-3 py-2 bg-slate-800 text-white border border-red-700 rounded-md disabled:opacity-50"
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
                                disabled={loading || !actionsEnabled}
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

                    {/* Rango seleccionado */}
                    <div className="text-red-400 text-sm italic mb-4">
                        {enterpriseId && startDate && endDate
                            ? `Empresa #${enterpriseId} | Desde ${format(
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
                                <col className="w-[25%]" />
                                <col className="w-[35%]" />
                                <col className="w-[20%]" />
                                <col className="w-[20%]" />
                            </colgroup>
                            <thead className="bg-red-800 text-white">
                                <tr className="text-center">
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        N° Recepción
                                    </th>
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Destinatario
                                    </th>
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Subtotal
                                    </th>
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-red-700">
                                {rows.length ? (
                                    rows.map((r: any, i: number) => (
                                        <tr
                                            key={i}
                                            className="hover:bg-[#1b1b1b] text-center"
                                        >
                                            <td className="px-4 py-3">
                                                {r.numero_recepcion}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.destinatario}
                                            </td>
                                            <td className="px-4 py-3">
                                                {fmt(r.subtotal)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {fmt(r.total)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center py-5 text-red-400"
                                        >
                                            {actionsEnabled
                                                ? "Sin resultados."
                                                : "Aún no has aplicado filtros."}
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
