import { useState, useMemo } from "react";
import { Button } from "@/Components/ui/button";
import { Printer } from "lucide-react";
import { Modal, n, calculateTotals } from "./helpers";
import type { AssignedSack } from "./types";

export default function SackDetailModal({
    sack,
    shipmentId,
    onClose,
}: {
    sack: AssignedSack;
    shipmentId: string;
    onClose: () => void;
}) {
    const [search, setSearch] = useState("");
    const [showAgencyPicker, setShowAgencyPicker] = useState(false);

    const filtered = useMemo(() => {
        if (!search.trim()) return sack.packages;
        const t = search.toLowerCase();
        return sack.packages.filter(
            (p) =>
                p.barcode.toLowerCase().includes(t) ||
                p.content.toLowerCase().includes(t),
        );
    }, [sack.packages, search]);

    const totals = calculateTotals(filtered);

    const destinationAgencyOptions = useMemo(() => {
        const map = new Map<string, string>();
        (sack.packages ?? []).forEach((p) => {
            if (p.destination_agency_id && p.destination_agency) {
                map.set(p.destination_agency_id, p.destination_agency);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [sack.packages]);

    const buildReportUrl = (kind: "pdf" | "excel", agencyId: string) =>
        `/shipments/${shipmentId}/sacks/${sack.shipment_sack_id}/report/${kind}?agency_dest_id=${agencyId}`;

    const handlePrint = (agencyId: string, kind: "pdf" | "excel") => {
        window.open(buildReportUrl(kind, agencyId), "_blank");
        setShowAgencyPicker(false);
    };

    return (
        <Modal
            title={`Saca ${sack.sack_number}`}
            isOpen
            onClose={onClose}
            actions={
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowAgencyPicker((v) => !v)}
                        title="Imprimir reporte por agencia destino"
                        className="p-1.5 rounded-lg hover:bg-red-900/40 text-gray-300 hover:text-white transition-colors"
                    >
                        <Printer className="h-5 w-5" />
                    </button>

                    {showAgencyPicker && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowAgencyPicker(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-80 bg-[#111] border border-red-700 rounded-lg shadow-xl z-50 p-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-red-300 px-2 pb-2 mb-2 border-b border-red-900/40">
                                    Selecciona la agencia destino
                                </p>
                                {destinationAgencyOptions.length ? (
                                    <div className="max-h-64 overflow-y-auto space-y-1">
                                        {destinationAgencyOptions.map((a) => (
                                            <div
                                                key={a.id}
                                                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-red-900/20"
                                            >
                                                <span className="text-sm text-white truncate">
                                                    {a.name}
                                                </span>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handlePrint(
                                                                a.id,
                                                                "pdf",
                                                            )
                                                        }
                                                        title="Ver PDF"
                                                        className="text-[11px] px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
                                                    >
                                                        PDF
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handlePrint(
                                                                a.id,
                                                                "excel",
                                                            )
                                                        }
                                                        title="Descargar Excel"
                                                        className="text-[11px] px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
                                                    >
                                                        Excel
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 px-2 py-3 text-center">
                                        Ningún paquete de esta saca tiene
                                        agencia destino registrada.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            }
        >
            <div className="mb-3 flex flex-wrap gap-4 text-sm text-gray-300">
                <span>
                    Ruta:{" "}
                    <span className="text-white font-semibold">
                        {sack.from_city} → {sack.to_city}
                    </span>
                </span>
                <span>
                    Traslado(s) de origen:{" "}
                    <span className="text-white font-semibold">
                        {Array.from(
                            new Set(
                                sack.packages.map(
                                    (p) => p.transfer_number ?? "—",
                                ),
                            ),
                        ).join(", ")}
                    </span>
                </span>
            </div>

            <div className="mb-2">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por código o contenido..."
                    className="w-full bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                />
            </div>

            <div className="overflow-x-auto rounded-lg border border-red-700">
                <table className="min-w-full text-sm text-white table-auto">
                    <thead className="bg-red-800 text-white">
                        <tr>
                            <th className="px-4 py-2 text-left">Código</th>
                            <th className="px-4 py-2 text-left">Contenido</th>
                            <th className="px-4 py-2 text-left">Tipo</th>
                            <th className="px-4 py-2 text-left">Traslado</th>
                            <th className="px-4 py-2 text-left">
                                Agencia Destino
                            </th>
                            <th className="px-4 py-2 text-right">Lbs</th>
                            <th className="px-4 py-2 text-right">Kgs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length ? (
                            filtered.map((pkg) => (
                                <tr
                                    key={pkg.id}
                                    className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                >
                                    <td className="px-4 py-2 font-mono text-xs text-yellow-400">
                                        {pkg.barcode}
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                        {pkg.content}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-gray-400">
                                        {pkg.service_type}
                                    </td>
                                    <td className="px-4 py-2 font-mono text-xs text-gray-400">
                                        {pkg.transfer_number ?? "—"}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-gray-400">
                                        {pkg.destination_agency ?? "—"}
                                    </td>
                                    <td className="px-4 py-2 text-right text-xs">
                                        {n(pkg.pounds).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-xs">
                                        {n(pkg.kilograms).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center py-8 text-gray-400 italic text-sm"
                                >
                                    {search.trim()
                                        ? "No se encontraron paquetes."
                                        : "Esta saca no tiene paquetes."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 flex gap-6 text-sm text-gray-300">
                <span>
                    PAQUETES:{" "}
                    <span className="text-white font-semibold">
                        {totals.pieces}
                    </span>
                </span>
                <span>
                    LBS:{" "}
                    <span className="text-white font-semibold">
                        {totals.pounds.toFixed(2)}
                    </span>
                </span>
                <span>
                    KGS:{" "}
                    <span className="text-white font-semibold">
                        {totals.kilograms.toFixed(2)}
                    </span>
                </span>
            </div>

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
        </Modal>
    );
}
