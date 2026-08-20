import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/Components/ui/select";
import { useState } from "react";
import { Download, Search, Scale } from "lucide-react";

interface EnterpriseOption {
    id: string;
    name: string;
    commercial_name: string;
}

interface DestinationAgencyOption {
    id: string;
    name: string;
    enterprise_id: string;
}

interface WeightRow {
    enterprise_id: string;
    enterprise_name: string;
    agency_dest_id: string | null;
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
    destinationAgencies: DestinationAgencyOption[];
    enterpriseId: string;
    agencyDestId: string;
}

export default function WeightReportByDestination({
    rows,
    startDate: initialStartDate,
    endDate: initialEndDate,
    enterprises,
    destinationAgencies,
    enterpriseId: initialEnterpriseId,
    agencyDestId: initialAgencyDestId,
}: Props) {
    const [startDate, setStartDate] = useState(initialStartDate ?? "");
    const [endDate, setEndDate] = useState(initialEndDate ?? "");
    const [enterpriseId, setEnterpriseId] = useState(
        initialEnterpriseId ?? "all",
    );
    const [agencyDestId, setAgencyDestId] = useState(
        initialAgencyDestId ?? "all",
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
                agency_dest_id: agencyDestId,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
    };

    // Al cambiar de empresa, reinicia la agencia destino elegida (porque
    // la lista de agencias visibles depende de la empresa seleccionada) y
    // vuelve a pedir la página para refrescar esa lista.
    const handleEnterpriseChange = (val: string) => {
        setEnterpriseId(val);
        setAgencyDestId("all");
        router.get(
            route("reports.weights.destination"),
            {
                start_date: startDate,
                end_date: endDate,
                enterprise_id: val,
                agency_dest_id: "all",
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
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
            agency_dest_id: agencyDestId,
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
                        <div>
                            <label className="text-white block mb-1 text-xs">
                                Fecha inicio
                            </label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-white text-black"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-white block mb-1 text-xs">
                                Fecha fin
                            </label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-white text-black"
                                required
                            />
                        </div>

                        <div className="min-w-[200px]">
                            <label className="text-white block mb-1 text-xs">
                                Empresa
                            </label>
                            <Select
                                value={enterpriseId}
                                onValueChange={handleEnterpriseChange}
                            >
                                <SelectTrigger className="bg-white text-black">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Todas las empresas
                                    </SelectItem>
                                    {enterprises.map((ent) => (
                                        <SelectItem key={ent.id} value={ent.id}>
                                            {ent.commercial_name || ent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[220px]">
                            <label className="text-white block mb-1 text-xs">
                                Agencia Destino
                            </label>
                            <Select
                                value={agencyDestId}
                                onValueChange={setAgencyDestId}
                            >
                                <SelectTrigger className="bg-white text-black">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Todas las agencias destino
                                    </SelectItem>
                                    {destinationAgencies.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                            key={`${r.enterprise_id}-${r.agency_dest_id ?? "none"}-${idx}`}
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
