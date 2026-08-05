import { useState, useEffect, useMemo } from "react";
import { Button } from "@/Components/ui/button";
import { Hash, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal, n, csrfToken } from "./helpers";
import type { AvailablePackage, AssignedSack } from "./types";

export default function SackPackagesModal({
    shipmentId,
    mode,
    existingSack,
    onClose,
    onSaved,
}: {
    shipmentId: string;
    mode: "create" | "edit";
    existingSack?: AssignedSack | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [available, setAvailable] = useState<AvailablePackage[]>([]);
    const [toAdd, setToAdd] = useState<AvailablePackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
    const [searchLeft, setSearchLeft] = useState("");
    const [searchRight, setSearchRight] = useState("");
    const [sackNumber, setSackNumber] = useState(
        existingSack?.sack_number ?? "",
    );
    const [sackNumberError, setSackNumberError] = useState("");

    useEffect(() => {
        setLoading(true);
        fetch("/api/shipments/available-sacks")
            .then((r) => r.json())
            .then((data: AvailablePackage[]) => {
                setAvailable(data);

                // ✅ Modo edición: precarga en el panel derecho los paquetes
                // que YA tiene esta saca (el backend no los devuelve como
                // "disponibles" porque ya están asignados a esta misma saca).
                // Todos los campos de AvailablePackage son obligatorios, por
                // eso aquí siempre se resuelven con un valor de respaldo.
                if (mode === "edit" && existingSack) {
                    const preloaded: AvailablePackage[] =
                        existingSack.packages.map((p) => ({
                            id: p.id,
                            barcode: p.barcode,
                            content: p.content,
                            service_type: p.service_type,
                            pounds: p.pounds,
                            kilograms: p.kilograms,
                            destination_agency: p.destination_agency ?? null,
                            destination_agency_id:
                                p.destination_agency_id ?? null,
                            transfer_sack_id: p.transfer_sack_id ?? "",
                            transfer_number:
                                p.transfer_number ??
                                existingSack.transfer_number ??
                                "—",
                            enterprise_id: p.enterprise_id ?? null,
                            enterprise_name: p.enterprise_name ?? null,
                            sack_number: null,
                            from_city: existingSack.from_city,
                            to_city: existingSack.to_city,
                        }));
                    setToAdd(preloaded);
                }
            })
            .catch(() => setError("No se pudieron cargar los paquetes."))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredLeft = useMemo(() => {
        if (!searchLeft.trim()) return available;
        const t = searchLeft.toLowerCase();
        return available.filter(
            (p) =>
                p.barcode.toLowerCase().includes(t) ||
                p.content.toLowerCase().includes(t) ||
                p.transfer_number.toLowerCase().includes(t) ||
                p.from_city.toLowerCase().includes(t) ||
                p.to_city.toLowerCase().includes(t),
        );
    }, [available, searchLeft]);

    const filteredRight = useMemo(() => {
        if (!searchRight.trim()) return toAdd;
        const t = searchRight.toLowerCase();
        return toAdd.filter(
            (p) =>
                p.barcode.toLowerCase().includes(t) ||
                p.content.toLowerCase().includes(t) ||
                p.transfer_number.toLowerCase().includes(t),
        );
    }, [toAdd, searchRight]);

    const moveRight = () => {
        if (!selectedLeftId) return;
        const pkg = available.find((p) => p.id === selectedLeftId);
        if (!pkg) return;
        setAvailable((prev) => prev.filter((p) => p.id !== selectedLeftId));
        setToAdd((prev) => [...prev, pkg]);
        setSelectedLeftId(null);
    };

    const moveLeft = () => {
        if (!selectedRightId) return;
        const pkg = toAdd.find((p) => p.id === selectedRightId);
        if (!pkg) return;
        setToAdd((prev) => prev.filter((p) => p.id !== selectedRightId));
        setAvailable((prev) => [...prev, pkg]);
        setSelectedRightId(null);
    };

    const handleSave = async () => {
        if (!sackNumber.trim()) {
            setSackNumberError("Debes ingresar el número de saca.");
            return;
        }
        if (!toAdd.length) {
            setError("Agrega al menos un paquete a la saca.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const url =
                mode === "create"
                    ? `/api/shipments/${shipmentId}/sacks`
                    : `/api/shipments/${shipmentId}/sacks/${existingSack!.shipment_sack_id}`;
            const method = mode === "create" ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    // ✅ CORREGIDO: X-XSRF-TOKEN (cookie), no X-CSRF-TOKEN (meta tag)
                    "X-XSRF-TOKEN": csrfToken(),
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    sack_number: sackNumber.trim(),
                    package_ids: toAdd.map((p) => p.id),
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error ?? "Error al guardar.");
            }
            onSaved();
        } catch (e: any) {
            setError(e.message ?? "Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    const totalsLeft = {
        pieces: filteredLeft.length,
        lbs: filteredLeft.reduce((s, a) => s + n(a.pounds), 0),
    };
    const totalsRight = {
        pieces: filteredRight.length,
        lbs: filteredRight.reduce((s, a) => s + n(a.pounds), 0),
    };

    return (
        <Modal
            title={
                mode === "create"
                    ? "Nueva Saca — Elegir Paquetes"
                    : `Editar Saca ${existingSack?.sack_number ?? ""}`
            }
            isOpen
            onClose={onClose}
        >
            {loading ? (
                <div className="text-sm text-gray-300 italic py-4">
                    Cargando paquetes disponibles...
                </div>
            ) : (
                <>
                    <div className="mb-4 max-w-[220px]">
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            <Hash className="h-3.5 w-3.5 text-red-500" />
                            Nro. Saca <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={sackNumber}
                            onChange={(e) => {
                                setSackNumber(e.target.value);
                                setSackNumberError("");
                            }}
                            placeholder="Ej: 1"
                            className={`w-full bg-[#111] border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 transition-colors ${
                                sackNumberError
                                    ? "border-red-500 focus:ring-red-500/40"
                                    : "border-red-900/50 focus:border-red-500 focus:ring-red-500/30"
                            }`}
                        />
                        {sackNumberError && (
                            <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                                <AlertCircle className="h-3 w-3" />
                                {sackNumberError}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1.5fr_auto_1.5fr] gap-4">
                        {/* Izquierda: paquetes disponibles (desglosados) */}
                        <div>
                            <h3 className="text-sm text-gray-300 mb-2">
                                Paquetes confirmados disponibles
                            </h3>
                            <div className="mb-2">
                                <input
                                    type="text"
                                    value={searchLeft}
                                    onChange={(e) =>
                                        setSearchLeft(e.target.value)
                                    }
                                    placeholder="Buscar por código, contenido, traslado, ciudad..."
                                    className="w-full bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                                />
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-red-700 max-h-80 overflow-y-auto">
                                <table className="min-w-full text-sm text-white table-auto">
                                    <thead className="bg-red-800 text-white sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left">
                                                Código
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                                Contenido
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                                Traslado
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                                De → A
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                Lbs
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeft.length ? (
                                            filteredLeft.map((pkg) => (
                                                <tr
                                                    key={pkg.id}
                                                    onClick={() =>
                                                        setSelectedLeftId(
                                                            selectedLeftId ===
                                                                pkg.id
                                                                ? null
                                                                : pkg.id,
                                                        )
                                                    }
                                                    className={cn(
                                                        "border-t border-red-700 cursor-pointer hover:bg-[#1b1b1b]",
                                                        selectedLeftId ===
                                                            pkg.id &&
                                                            "bg-red-900/60",
                                                    )}
                                                >
                                                    <td className="px-3 py-1 font-mono text-xs text-yellow-400">
                                                        {pkg.barcode}
                                                    </td>
                                                    <td className="px-3 py-1 text-xs">
                                                        {pkg.content}
                                                    </td>
                                                    <td className="px-3 py-1 font-mono text-xs">
                                                        {pkg.transfer_number}
                                                    </td>
                                                    <td className="px-3 py-1 text-xs text-gray-400">
                                                        {pkg.from_city} →{" "}
                                                        {pkg.to_city}
                                                    </td>
                                                    <td className="px-3 py-1 text-right">
                                                        {n(pkg.pounds).toFixed(
                                                            2,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="text-center py-4 text-gray-400 italic text-sm"
                                                >
                                                    {searchLeft.trim()
                                                        ? "No se encontraron paquetes."
                                                        : "No hay paquetes confirmados disponibles."}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-2 text-xs text-gray-300 flex justify-between">
                                <span>
                                    PAQUETES:{" "}
                                    <span className="text-white font-semibold">
                                        {totalsLeft.pieces}
                                    </span>
                                </span>
                                <span>
                                    LBS:{" "}
                                    <span className="text-white font-semibold">
                                        {totalsLeft.lbs.toFixed(2)}
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* Flechas */}
                        <div className="flex flex-col items-center justify-center gap-3">
                            <Button
                                type="button"
                                size="icon"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={moveRight}
                                disabled={!selectedLeftId}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={moveLeft}
                                disabled={!selectedRightId}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Derecha: paquetes que quedarán en esta saca */}
                        <div>
                            <h3 className="text-sm text-gray-300 mb-2">
                                Paquetes en esta saca
                            </h3>
                            <div className="mb-2">
                                <input
                                    type="text"
                                    value={searchRight}
                                    onChange={(e) =>
                                        setSearchRight(e.target.value)
                                    }
                                    placeholder="Buscar..."
                                    className="w-full bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                                />
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-red-700 max-h-80 overflow-y-auto">
                                <table className="min-w-full text-sm text-white table-auto">
                                    <thead className="bg-red-800 text-white sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left">
                                                Código
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                                Contenido
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                                Traslado
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                Lbs
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRight.length ? (
                                            filteredRight.map((pkg) => (
                                                <tr
                                                    key={pkg.id}
                                                    onClick={() =>
                                                        setSelectedRightId(
                                                            selectedRightId ===
                                                                pkg.id
                                                                ? null
                                                                : pkg.id,
                                                        )
                                                    }
                                                    className={cn(
                                                        "border-t border-red-700 cursor-pointer hover:bg-[#1b1b1b]",
                                                        selectedRightId ===
                                                            pkg.id &&
                                                            "bg-red-900/60",
                                                    )}
                                                >
                                                    <td className="px-3 py-1 font-mono text-xs text-green-400">
                                                        {pkg.barcode}
                                                    </td>
                                                    <td className="px-3 py-1 text-xs">
                                                        {pkg.content}
                                                    </td>
                                                    <td className="px-3 py-1 font-mono text-xs">
                                                        {pkg.transfer_number}
                                                    </td>
                                                    <td className="px-3 py-1 text-right">
                                                        {n(pkg.pounds).toFixed(
                                                            2,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="text-center py-4 text-gray-400 italic text-sm"
                                                >
                                                    {searchRight.trim()
                                                        ? "No se encontraron paquetes."
                                                        : "Aún no hay paquetes en esta saca."}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-2 text-xs text-gray-300 flex justify-between">
                                <span>
                                    PAQUETES:{" "}
                                    <span className="text-white font-semibold">
                                        {totalsRight.pieces}
                                    </span>
                                </span>
                                <span>
                                    LBS:{" "}
                                    <span className="text-white font-semibold">
                                        {totalsRight.lbs.toFixed(2)}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-3 text-sm text-red-400">{error}</div>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-red-700 text-gray-200 hover:bg-red-700"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleSave}
                            disabled={
                                saving || !toAdd.length || !sackNumber.trim()
                            }
                        >
                            {saving
                                ? "Guardando..."
                                : mode === "create"
                                  ? "Crear Saca"
                                  : "Guardar Cambios"}
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
}
