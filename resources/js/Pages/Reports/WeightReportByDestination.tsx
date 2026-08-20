import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { useState } from "react";
import { Download, Search, Scale } from "lucide-react";

interface EnterpriseOption {
    id: string;
    name: string;
    commercial_name: string;
}

interface WeightRow {
    enterprise_id: string;
    enterprise_name: string;
    agencia_destino: string | null;
    total_libras: number | string;
    total_kilos: number | string;
    rutas: string | null;
}

interface Props {
    rows: WeightRow[];
    startDate: string;
    endDate: string;
    enterprises: EnterpriseOption[];
    destinationAgencyNames: string[];
    enterpriseId: string;
    agencyDestName: string;
}

// Mismo estilo de <select> nativo oscuro usado en el resto de la app
// (Embarques, Traslados, etc.) — nada de overlays transparentes.
const selectCls =
    "bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white " +
    "focus:outline-none focus:border-red-500";

export default function WeightReportByDestination({
    rows,
    startDate: initialStartDate,
    endDate: initialEndDate,
    enterprises,
    destinationAgencyNames,
    enterpriseId: initialEnterpriseId,
    agencyDestName: initialAgencyDestName,
}: Props) {
    const [startDate, setStartDate] = useState(initialStartDate ?? "");
    const [endDate, setEndDate] = useState(initialEndDate ?? "");
    const [enterpriseId, setEnterpriseId] = useState(
        initialEnterpriseId ?? "all",
    );
    const [agencyDestName, setAgencyDestName] = useState(
        initialAgencyDestName ?? "all",
    );
    const [loading, setLoading] = useState(false);

    const n = (v: number | string) => parseFloat(String(v)) || 0;

    const totals = rows.reduce(
        (acc, r) => {
            acc.libras += n(r.total_libras);
            acc.kilos += n(r.total_kilos);
            return acc;
        },
        { libras: 0, kilos: 0 },
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) return;

        setLoading(true);
        router.get(
            route("reports.weights.destination"),
            {
                start_date: startDate,
                end_date: endDate,
                enterprise_id: enterpriseId,
                agency_dest_name: agencyDestName,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
    };

    // Al cambiar de empresa, la lista de agencias destino visibles cambia
    // (son por-empresa), así que reiniciamos la agencia elegida y volvemos
    // a pedir la página para refrescar esa lista.
    const handleEnterpriseChange = (val: string) => {
        setEnterpriseId(val);
        setAgencyDestName("all");

        setLoading(true);
        router.get(
            route("reports.weights.destination"),
            {
                start_date: startDate,
                end_date: endDate,
                enterprise_id: val,
                agency_dest_name: "all",
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleExport = () => {
        if (!startDate || !endDate) {
            alert("Selecciona la fecha inicio y fecha fin antes de exportar.");
            return;
        }
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            enterprise_id: enterpriseId,
            agency_dest_name: agencyDestName,
        });
        window.open(
            `${route("reports.weights.destination.export")}?${params.toString()}`,
            "_blank",
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Reporte de Pesos por Agencia Destino" />

            <div className="container mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Scale className="h-6 w-6" />
                        Reporte de Pesos por Agencia Destino
                    </h1>
                    <p className="text-white text-sm">
                        Resumen de pesos (libras/kilos) agrupado por agencia
                        destino
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md space-y-4">
                    {/* Filtros */}
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-wrap gap-3 items-end bg-[#1b1b1b] border border-red-700 rounded-lg p-4"
                    >
                        <div className="flex flex-col">
                            <label className="text-white block mb-1 text-xs">
                                Fecha inicio
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={selectCls}
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-white block mb-1 text-xs">
                                Fecha fin
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={selectCls}
                                required
                            />
                        </div>

                        <div className="flex flex-col min-w-[220px]">
                            <label className="text-white block mb-1 text-xs">
                                Empresa
                            </label>
                            <select
                                value={enterpriseId}
                                onChange={(e) =>
                                    handleEnterpriseChange(e.target.value)
                                }
                                className={selectCls}
                            >
                                <option value="all">Todas las empresas</option>
                                {enterprises.map((ent) => (
                                    <option key={ent.id} value={ent.id}>
                                        {ent.commercial_name || ent.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col min-w-[220px]">
                            <label className="text-white block mb-1 text-xs">
                                Agencia Destino
                            </label>
                            <select
                                value={agencyDestName}
                                onChange={(e) =>
                                    setAgencyDestName(e.target.value)
                                }
                                className={selectCls}
                            >
                                <option value="all">
                                    Todas las agencias destino
                                </option>
                                {destinationAgencyNames.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 h-9"
                            disabled={loading}
                        >
                            <Search className="h-4 w-4 mr-2" />
                            {loading ? "Buscando..." : "Buscar"}
                        </Button>

                        <Button
                            type="button"
                            onClick={handleExport}
                            className="bg-green-600 hover:bg-green-700 h-9"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Exportar Excel
                        </Button>
                    </form>

                    {/* Totales resumen */}
                    {rows.length > 0 && (
                        <div className="flex flex-wrap gap-6 bg-[#1b1b1b] border border-red-700 rounded-lg p-4 text-sm text-gray-300">
                            <span>
                                Registros:{" "}
                                <span className="text-white font-semibold">
                                    {rows.length}
                                </span>
                            </span>
                            <span>
                                Total Libras:{" "}
                                <span className="text-yellow-400 font-semibold">
                                    {totals.libras.toFixed(2)}
                                </span>
                            </span>
                            <span>
                                Total Kilos:{" "}
                                <span className="text-yellow-400 font-semibold">
                                    {totals.kilos.toFixed(2)}
                                </span>
                            </span>
                        </div>
                    )}

                    {/* Tabla */}
                    <div className="overflow-x-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800 text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Agencia Destino
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Empresa
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Ruta
                                    </th>
                                    <th className="px-4 py-2 text-right">
                                        Peso (Lbs)
                                    </th>
                                    <th className="px-4 py-2 text-right">
                                        Peso (Kg)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length ? (
                                    rows.map((r, idx) => (
                                        <tr
                                            key={`${r.enterprise_id}-${r.agencia_destino ?? "none"}-${idx}`}
                                            className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                        >
                                            <td className="px-4 py-2">
                                                {r.agencia_destino ??
                                                    "Sin agencia destino"}
                                            </td>
                                            <td className="px-4 py-2">
                                                {r.enterprise_name}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-gray-400">
                                                {r.rutas ?? "—"}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {n(r.total_libras).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {n(r.total_kilos).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-8 text-red-400"
                                        >
                                            {startDate && endDate
                                                ? "No se encontraron registros con esos filtros."
                                                : "Selecciona un rango de fechas y presiona Buscar."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {rows.length > 0 && (
                                <tfoot>
                                    <tr className="bg-gradient-to-r from-orange-600 to-yellow-500 text-black font-semibold">
                                        <td className="px-4 py-2" colSpan={3}>
                                            TOTAL GENERAL: {rows.length}{" "}
                                            registros
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {totals.libras.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {totals.kilos.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
