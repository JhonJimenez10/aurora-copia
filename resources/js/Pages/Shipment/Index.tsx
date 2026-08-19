import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import Pagination from "@/Components/Pagination";
import {
    Plus,
    Search,
    Layers,
    Ban,
    Pencil,
    Printer,
    FileSpreadsheet,
    FileText,
} from "lucide-react";
import { StatusBadge } from "./helpers";
import type { ShipmentRow } from "./types";
import CreateShipmentModal from "./CreateShipmentModal";
import EditShipmentModal from "./EditShipmentModal";
import SacksListModal from "./SacksListModal";

type ExportKind =
    | "manifest-excel"
    | "manifest-csv"
    | "receptions-excel"
    | "acas-excel"
    | "airline-excel";

export default function ShipmentsIndex({
    shipments,
    filters,
    nextNumber,
    enterprise,
}: any) {
    const { data, setData, get } = useForm({
        from: filters?.from || "",
        to: filters?.to || "",
        number: filters?.number || "",
        status: filters?.status || "",
    });

    const [showCreate, setShowCreate] = useState(false);
    const [sacksModal, setSacksModal] = useState<{
        id: string;
        number: string;
        status: string;
        sackPrefix: string;
        route: string;
    } | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [editingShipment, setEditingShipment] = useState<ShipmentRow | null>(
        null,
    );
    // id del embarque cuyo menú de exportación está abierto (uno a la vez)
    const [exportMenuId, setExportMenuId] = useState<string | null>(null);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get(route("shipments.index"), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleCreated = (
        id: string,
        number: string,
        sackPrefix: string,
        route: string,
    ) => {
        setShowCreate(false);
        setSacksModal({ id, number, status: "OPEN", sackPrefix, route });
        router.reload({ only: ["shipments", "nextNumber"] });
    };

    const handleUpdated = (_id: string, _number: string) => {
        router.reload({ only: ["shipments"] });
    };

    const handleCancel = (id: string) => {
        if (!confirm("¿Cancelar este embarque?")) return;
        setCancelling(id);
        router.patch(
            route("shipments.cancel", id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setCancelling(null),
            },
        );
    };

    // Abre en pestaña nueva la descarga del reporte elegido (solo los
    // paquetes que están dentro de las sacas de ESE embarque).
    const handleExport = (shipmentId: string, kind: ExportKind) => {
        const routeNameByKind: Record<ExportKind, string> = {
            "manifest-excel": "shipments.manifest.export",
            "manifest-csv": "shipments.manifest.export.csv",
            "receptions-excel": "shipments.receptions.export",
            "acas-excel": "shipments.acas.export",
            "airline-excel": "shipments.airline.export",
        };
        window.open(route(routeNameByKind[kind], shipmentId), "_blank");
        setExportMenuId(null);
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

            <div className="container mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Embarques</h1>
                        <p className="text-white text-sm">
                            Gestión de embarques de carga
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="bg-white text-red-700 hover:bg-white/90 font-semibold flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Embarque
                    </Button>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md space-y-4">
                    {/* Filtros */}
                    <form
                        onSubmit={handleFilter}
                        className="flex flex-wrap gap-2 items-end"
                    >
                        <div>
                            <label className="text-white block mb-1 text-xs">
                                Desde
                            </label>
                            <input
                                type="date"
                                value={data.from}
                                onChange={(e) =>
                                    setData("from", e.target.value)
                                }
                                className="bg-white text-black rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-white block mb-1 text-xs">
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={data.to}
                                onChange={(e) => setData("to", e.target.value)}
                                className="bg-white text-black rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-white block mb-1 text-xs">
                                Número
                            </label>
                            <input
                                type="text"
                                placeholder="EMB-000001"
                                value={data.number}
                                onChange={(e) =>
                                    setData("number", e.target.value)
                                }
                                className="bg-white text-black rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-white block mb-1 text-xs">
                                Estado
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                                className="bg-white text-black rounded px-2 py-1 text-sm"
                            >
                                <option value="">Todos</option>
                                <option value="OPEN">Abierto</option>
                                <option value="CLOSED">Cerrado</option>
                                <option value="CANCELLED">Cancelado</option>
                            </select>
                        </div>
                        <Button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 h-8"
                        >
                            <Search className="h-3.5 w-3.5 mr-1" />
                            Buscar
                        </Button>
                    </form>

                    {/* Tabla */}
                    <div className="overflow-x-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800 text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Número
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Ruta
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Aerolínea
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Aeropuertos
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Estado
                                    </th>
                                    <th className="px-4 py-2 text-center">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {shipments.data.map((s: ShipmentRow) => (
                                    <tr
                                        key={s.id}
                                        className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                    >
                                        <td className="px-4 py-2 font-mono font-semibold text-yellow-400">
                                            <div className="flex items-center gap-2">
                                                <span>{s.number}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditingShipment(s)
                                                    }
                                                    title="Ver / Editar embarque"
                                                    className="p-1 rounded hover:bg-red-900/40 text-gray-400 hover:text-yellow-300 transition-colors"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            {fmtDate(s.date)}
                                        </td>
                                        <td className="px-4 py-2">{s.route}</td>
                                        <td className="px-4 py-2">
                                            {s.airline}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-400">
                                            {s.airport_origin} →{" "}
                                            {s.airport_dest}
                                        </td>
                                        <td className="px-4 py-2">
                                            <StatusBadge status={s.status} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        setSacksModal({
                                                            id: s.id,
                                                            number: s.number,
                                                            status: s.status,
                                                            sackPrefix:
                                                                s.sack_prefix ??
                                                                "",
                                                            route: s.route,
                                                        })
                                                    }
                                                    className="h-7 px-2.5 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-semibold"
                                                >
                                                    <Layers className="h-3 w-3 mr-1" />
                                                    Sacas
                                                </Button>

                                                {/* Botón de impresión con menú desplegable de 5 opciones */}
                                                <div className="relative">
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            setExportMenuId(
                                                                exportMenuId ===
                                                                    s.id
                                                                    ? null
                                                                    : s.id,
                                                            )
                                                        }
                                                        title="Imprimir / exportar reportes de este embarque"
                                                        className="h-7 px-2.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold"
                                                    >
                                                        <Printer className="h-3 w-3 mr-1" />
                                                        Imprimir
                                                    </Button>

                                                    {exportMenuId === s.id && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-40"
                                                                onClick={() =>
                                                                    setExportMenuId(
                                                                        null,
                                                                    )
                                                                }
                                                            />
                                                            <div className="absolute right-0 top-full mt-1 w-64 bg-[#111] border border-red-700 rounded-lg shadow-xl z-50 p-1">
                                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-red-300 px-2 pt-1.5 pb-2 mb-1 border-b border-red-900/40">
                                                                    Reportes de
                                                                    exportación
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleExport(
                                                                            s.id,
                                                                            "manifest-excel",
                                                                        )
                                                                    }
                                                                    className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-red-900/30 text-sm text-white text-left"
                                                                >
                                                                    <FileSpreadsheet className="h-4 w-4 text-green-400 flex-shrink-0" />
                                                                    Manifiesto
                                                                    (Excel)
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleExport(
                                                                            s.id,
                                                                            "manifest-csv",
                                                                        )
                                                                    }
                                                                    className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-red-900/30 text-sm text-white text-left"
                                                                >
                                                                    <FileText className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                                                                    Manifiesto
                                                                    (CSV)
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleExport(
                                                                            s.id,
                                                                            "receptions-excel",
                                                                        )
                                                                    }
                                                                    className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-red-900/30 text-sm text-white text-left"
                                                                >
                                                                    <FileSpreadsheet className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                                    Reporte de
                                                                    Recepciones
                                                                    (Excel)
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleExport(
                                                                            s.id,
                                                                            "acas-excel",
                                                                        )
                                                                    }
                                                                    className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-red-900/30 text-sm text-white text-left"
                                                                >
                                                                    <FileSpreadsheet className="h-4 w-4 text-purple-400 flex-shrink-0" />
                                                                    Manifiesto
                                                                    ACAS Avianca
                                                                    (Excel)
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleExport(
                                                                            s.id,
                                                                            "airline-excel",
                                                                        )
                                                                    }
                                                                    className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-red-900/30 text-sm text-white text-left"
                                                                >
                                                                    <FileSpreadsheet className="h-4 w-4 text-orange-400 flex-shrink-0" />
                                                                    Reporte de
                                                                    Sacas
                                                                    (Excel)
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

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
                                            className="text-center py-8 text-red-400"
                                        >
                                            No hay embarques registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination pagination={shipments} />
                </div>
            </div>

            {showCreate && (
                <CreateShipmentModal
                    nextNumber={nextNumber}
                    enterprise={enterprise}
                    onClose={() => setShowCreate(false)}
                    onCreated={handleCreated}
                />
            )}

            {sacksModal && (
                <SacksListModal
                    shipmentId={sacksModal.id}
                    shipmentNumber={sacksModal.number}
                    shipmentStatus={sacksModal.status}
                    sackPrefix={sacksModal.sackPrefix}
                    route={sacksModal.route}
                    onClose={() => setSacksModal(null)}
                />
            )}

            {editingShipment && (
                <EditShipmentModal
                    shipment={editingShipment}
                    onClose={() => setEditingShipment(null)}
                    onUpdated={handleUpdated}
                />
            )}
        </AuthenticatedLayout>
    );
}
