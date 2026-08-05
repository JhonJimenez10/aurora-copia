import { useState, useEffect, useCallback } from "react";
import { Button } from "@/Components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { Modal, n, getDestinationAgencies } from "./helpers";
import { FIXED_AGENCY_ORIGIN } from "./constants";
import type { AssignedSack } from "./types";
import SackPackagesModal from "./SackPackagesModal";
import SackDetailModal from "./SackDetailModal";

export default function SacksListModal({
    shipmentId,
    shipmentNumber,
    shipmentStatus,
    sackPrefix,
    route,
    onClose,
}: {
    shipmentId: string;
    shipmentNumber: string;
    shipmentStatus: string;
    sackPrefix: string;
    route: string;
    onClose: () => void;
}) {
    const isReadOnly = shipmentStatus === "CANCELLED";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [assigned, setAssigned] = useState<AssignedSack[]>([]);
    const [showAddSacks, setShowAddSacks] = useState(false);
    const [editingSack, setEditingSack] = useState<AssignedSack | null>(null);
    const [viewingSack, setViewingSack] = useState<AssignedSack | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/shipments/${shipmentId}/sacks`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setAssigned(data.sacks ?? []);
        } catch {
            setError("No se pudieron cargar las sacas.");
        } finally {
            setLoading(false);
        }
    }, [shipmentId]);

    useEffect(() => {
        load();
    }, [load]);

    const totals = {
        sacks: assigned.length,
        lbs: assigned.reduce((s, a) => s + n(a.pounds_total), 0),
        kgs: assigned.reduce((s, a) => s + n(a.kilograms_total), 0),
    };

    return (
        <>
            <Modal
                title={`Sacas del Embarque — ${shipmentNumber}${isReadOnly ? " (CANCELADO)" : ""}`}
                isOpen
                onClose={onClose}
            >
                {loading && (
                    <div className="text-sm text-gray-300 italic py-4">
                        Cargando sacas...
                    </div>
                )}
                {error && (
                    <div className="mb-3 text-sm text-red-400">{error}</div>
                )}

                {!loading && (
                    <>
                        <div className="mb-3 flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-red-300">
                                Ruta:
                            </span>
                            <span className="text-sm text-white font-semibold">
                                {route}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm text-gray-300">
                                Sacas en este embarque
                            </h3>
                            {!isReadOnly && (
                                <Button
                                    type="button"
                                    size="icon"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => setShowAddSacks(true)}
                                    title="Agregar nueva saca"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-red-700">
                            <table className="min-w-full text-sm text-white table-auto">
                                <thead className="bg-red-800 text-white">
                                    <tr>
                                        <th className="px-4 py-2 text-left">
                                            No. Saca
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            Clasificadora
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            Agencia Destino
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            Pzas
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            Lbs
                                        </th>
                                        <th className="px-4 py-2 text-center">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assigned.length ? (
                                        assigned.map((sack) => (
                                            <tr
                                                key={sack.id}
                                                className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                            >
                                                <td className="px-4 py-2 font-semibold text-yellow-400">
                                                    {sackPrefix}
                                                    {sack.sack_number}
                                                </td>
                                                <td className="px-4 py-2 text-xs text-gray-300">
                                                    {FIXED_AGENCY_ORIGIN}
                                                </td>
                                                <td className="px-4 py-2 text-xs text-gray-400">
                                                    {getDestinationAgencies(
                                                        sack,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {sack.packages_count}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {n(
                                                        sack.pounds_total,
                                                    ).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                setViewingSack(
                                                                    sack,
                                                                )
                                                            }
                                                            className="h-7 px-3 bg-blue-700 hover:bg-blue-600 text-white text-xs"
                                                        >
                                                            Ver saca
                                                        </Button>
                                                        {!isReadOnly && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    setEditingSack(
                                                                        sack,
                                                                    )
                                                                }
                                                                className="h-7 px-3 bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-semibold"
                                                                title="Agregar o quitar paquetes de esta saca"
                                                            >
                                                                <Pencil className="h-3 w-3 mr-1" />
                                                                Editar
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="text-center py-8 text-gray-400 italic text-sm"
                                            >
                                                No hay sacas asignadas.
                                                {!isReadOnly &&
                                                    " Usa el botón + para agregar."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {assigned.length > 0 && (
                            <div className="mt-3 flex gap-6 text-sm text-gray-300">
                                <span>
                                    SACAS:{" "}
                                    <span className="text-white font-semibold">
                                        {totals.sacks}
                                    </span>
                                </span>
                                <span>
                                    LBS:{" "}
                                    <span className="text-white font-semibold">
                                        {totals.lbs.toFixed(2)}
                                    </span>
                                </span>
                                <span>
                                    KGS:{" "}
                                    <span className="text-white font-semibold">
                                        {totals.kgs.toFixed(2)}
                                    </span>
                                </span>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-red-700 text-gray-200 hover:bg-red-700"
                                onClick={onClose}
                            >
                                Cerrar
                            </Button>
                        </div>
                    </>
                )}
            </Modal>

            {viewingSack && (
                <SackDetailModal
                    sack={viewingSack}
                    shipmentId={shipmentId}
                    onClose={() => setViewingSack(null)}
                />
            )}

            {showAddSacks && (
                <SackPackagesModal
                    shipmentId={shipmentId}
                    mode="create"
                    onClose={() => setShowAddSacks(false)}
                    onSaved={() => {
                        setShowAddSacks(false);
                        load();
                    }}
                />
            )}

            {editingSack && (
                <SackPackagesModal
                    shipmentId={shipmentId}
                    mode="edit"
                    existingSack={editingSack}
                    onClose={() => setEditingSack(null)}
                    onSaved={() => {
                        setEditingSack(null);
                        load();
                    }}
                />
            )}
        </>
    );
}
