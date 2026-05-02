import { useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import Pagination from "@/Components/Pagination";
import {
    Plane,
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Pencil,
    Ban,
    ChevronDown,
} from "lucide-react";

// ─── Badge de estado ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<
        string,
        { label: string; cls: string; icon: React.ReactNode }
    > = {
        OPEN: {
            label: "Abierto",
            cls: "bg-green-900/30 text-green-300 border-green-700",
            icon: <CheckCircle2 className="h-3 w-3" />,
        },
        CLOSED: {
            label: "Cerrado",
            cls: "bg-gray-800 text-gray-300 border-gray-600",
            icon: <XCircle className="h-3 w-3" />,
        },
        CANCELLED: {
            label: "Cancelado",
            cls: "bg-red-900/30 text-red-300 border-red-700",
            icon: <Ban className="h-3 w-3" />,
        },
    };
    const s = map[status] ?? map.OPEN;
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${s.cls}`}
        >
            {s.icon}
            {s.label}
        </span>
    );
}

// ─── Página ───────────────────────────────────────────────────
export default function ShipmentIndex({ shipments, filters }: any) {
    const { data, setData, get } = useForm({
        from: filters.from || "",
        to: filters.to || "",
        number: filters.number || "",
        status: filters.status || "",
    });

    const [cancelling, setCancelling] = useState<string | null>(null);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get(route("shipments.index"), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleCancel = (id: string) => {
        if (!confirm("¿Seguro que deseas cancelar este embarque?")) return;
        setCancelling(id);

        router.patch(
            route("shipments.cancel", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    // La página se recarga automáticamente con Inertia
                },
                onError: () => {
                    alert("Error al cancelar el embarque.");
                },
                onFinish: () => {
                    setCancelling(null);
                },
            },
        );
    };

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString("es-EC", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    return (
        <AuthenticatedLayout>
            <Head title="Embarques" />

            <div className="min-h-screen bg-[#0a0a0a] text-white">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-900 via-red-700 to-yellow-500 px-6 py-5">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Plane className="h-7 w-7 text-white" />
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Embarques
                                </h1>
                                <p className="text-xs text-white/70">
                                    Gestión de embarques de carga
                                </p>
                            </div>
                        </div>
                        <Link href={route("shipments.create")}>
                            <Button className="bg-white text-red-700 hover:bg-white/90 font-semibold flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Nuevo Embarque
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
                    {/* Filtros */}
                    <form
                        onSubmit={handleFilter}
                        className="flex flex-wrap gap-3 items-end bg-[#0e0e0e] border border-red-900/40 rounded-xl px-5 py-4"
                    >
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                Desde
                            </label>
                            <input
                                type="date"
                                value={data.from}
                                onChange={(e) =>
                                    setData("from", e.target.value)
                                }
                                className="bg-[#111] border border-red-900/50 text-white rounded px-2 py-1.5 text-sm focus:outline-none focus:border-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={data.to}
                                onChange={(e) => setData("to", e.target.value)}
                                className="bg-[#111] border border-red-900/50 text-white rounded px-2 py-1.5 text-sm focus:outline-none focus:border-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                Número
                            </label>
                            <input
                                type="text"
                                placeholder="EMB-000001"
                                value={data.number}
                                onChange={(e) =>
                                    setData("number", e.target.value)
                                }
                                className="bg-[#111] border border-red-900/50 text-white rounded px-2 py-1.5 text-sm focus:outline-none focus:border-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                Estado
                            </label>
                            <div className="relative">
                                <select
                                    value={data.status}
                                    onChange={(e) =>
                                        setData("status", e.target.value)
                                    }
                                    className="appearance-none bg-[#111] border border-red-900/50 text-white rounded px-2 py-1.5 pr-7 text-sm focus:outline-none focus:border-red-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="OPEN">Abierto</option>
                                    <option value="CLOSED">Cerrado</option>
                                    <option value="CANCELLED">Cancelado</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3 w-3 text-gray-400" />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 flex items-center gap-2 h-8"
                        >
                            <Search className="h-3.5 w-3.5" />
                            Buscar
                        </Button>
                    </form>

                    {/* Tabla */}
                    <div className="rounded-xl border border-red-900/40 overflow-hidden">
                        <table className="w-full text-sm text-white">
                            <thead className="bg-red-900/40 text-xs uppercase tracking-wider text-gray-300">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Número
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Ruta
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Aerolínea
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Aeropuertos
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-red-900/20 bg-[#0e0e0e]">
                                {shipments.data.map((s: any) => (
                                    <tr
                                        key={s.id}
                                        className="hover:bg-red-950/20 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-mono font-semibold text-yellow-400">
                                            {s.number}
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">
                                            {fmtDate(s.date)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">
                                            {s.route}
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">
                                            {s.airline}
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">
                                            <span className="text-xs">
                                                {s.airport_origin} →{" "}
                                                {s.airport_dest}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={s.status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    href={route(
                                                        "shipments.edit",
                                                        s.id,
                                                    )}
                                                >
                                                    <Button
                                                        size="sm"
                                                        className="h-7 px-2.5 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-semibold"
                                                    >
                                                        <Pencil className="h-3 w-3 mr-1" />
                                                        Editar
                                                    </Button>
                                                </Link>
                                                {s.status !== "CANCELLED" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleCancel(s.id)
                                                        }
                                                        disabled={
                                                            cancelling === s.id
                                                        }
                                                        className="h-7 px-2.5 bg-red-800 hover:bg-red-700 text-white text-xs"
                                                    >
                                                        <Ban className="h-3 w-3 mr-1" />
                                                        Cancelar
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!shipments.data.length && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-10 text-gray-500"
                                        >
                                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            No hay embarques registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <Pagination pagination={shipments} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
