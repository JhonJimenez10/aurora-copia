import { useState, useEffect, useCallback } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import {
    Plane,
    Building2,
    MapPin,
    Calendar,
    Hash,
    Globe,
    Layers,
    Route,
    Package,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    X,
    Plus,
    Trash2,
} from "lucide-react";

// ─── Constantes ───────────────────────────────────────────────
const SACK_PREFIX_OPTIONS = ["B", "C", "D", "E", "F", "G", "H"];

// ─── Tipos ────────────────────────────────────────────────────
interface Props {
    nextNumber: string;
    enterprise?: { agency_origin: string } | null;
}

interface FormData {
    date: string;
    country_origin: string;
    agency_origin: string;
    sack_prefix: string;
    route: string;
    airline: string;
    number: string;
    airport_origin: string;
    airport_dest: string;
    cargo_agency: string;
    palletizer: string;
    open: boolean;
}

interface SackPackage {
    id: string;
    barcode: string;
    content: string;
    service_type: string;
    pounds: number;
    kilograms: number;
}

interface AvailableSack {
    id: string;
    sack_number: number;
    seal: string | null;
    refrigerated: boolean;
    transfer_number: string;
    from_city: string;
    to_city: string;
    packages_count: number;
    pounds_total: number;
    kilograms_total: number;
    packages: SackPackage[];
}

interface AssignedSack extends AvailableSack {
    shipment_sack_id: string;
}

// ─── Field helper ─────────────────────────────────────────────
function Field({
    label,
    icon,
    error,
    required,
    children,
}: {
    label: string;
    icon: React.ReactNode;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <span className="text-red-500">{icon}</span>
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && (
                <p className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </p>
            )}
        </div>
    );
}

const inputCls =
    "w-full bg-[#111] border border-red-900/50 text-white rounded-md px-3 py-2 text-sm " +
    "focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 " +
    "placeholder:text-gray-600 transition-colors";

const selectCls =
    "w-full bg-[#111] border border-red-900/50 text-white rounded-md px-3 py-2 text-sm " +
    "focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 " +
    "transition-colors cursor-pointer appearance-none " +
    "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23f87171%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')] " +
    "bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px] pr-9";

// ─── Modal de Sacas ───────────────────────────────────────────
function SacksModal({
    shipmentId,
    shipmentNumber,
    onClose,
}: {
    shipmentId: string;
    shipmentNumber: string;
    onClose: () => void;
}) {
    const [available, setAvailable] = useState<AvailableSack[]>([]);
    const [assigned, setAssigned] = useState<AssignedSack[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAvailId, setSelectedAvailId] = useState<string | null>(null);
    const [selectedAssignId, setSelectedAssignId] = useState<string | null>(
        null,
    );
    const [expandedSack, setExpandedSack] = useState<string | null>(null);

    const csrfToken = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
            ?.content ?? "";

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [availRes, assignedRes] = await Promise.all([
                fetch("/api/shipments/available-sacks"),
                fetch(`/api/shipments/${shipmentId}/sacks`),
            ]);
            if (!availRes.ok || !assignedRes.ok)
                throw new Error("Error cargando datos");
            const availData: AvailableSack[] = await availRes.json();
            const assignedData = await assignedRes.json();

            // Filtrar disponibles: quitar las ya asignadas
            const assignedIds = (assignedData.sacks as AssignedSack[]).map(
                (s) => s.id,
            );
            setAvailable(availData.filter((s) => !assignedIds.includes(s.id)));
            setAssigned(assignedData.sacks ?? []);
        } catch {
            setError("No se pudieron cargar las sacas. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    }, [shipmentId]);

    useEffect(() => {
        load();
    }, [load]);

    // Mover saca disponible → asignada (sin llamar API aún)
    const moveToAssigned = () => {
        if (!selectedAvailId) return;
        const sack = available.find((s) => s.id === selectedAvailId);
        if (!sack) return;
        setAvailable((prev) => prev.filter((s) => s.id !== selectedAvailId));
        setAssigned((prev) => [...prev, { ...sack, shipment_sack_id: "" }]);
        setSelectedAvailId(null);
    };

    // Mover saca asignada → disponible
    const moveToAvailable = () => {
        if (!selectedAssignId) return;
        const sack = assigned.find((s) => s.id === selectedAssignId);
        if (!sack) return;
        setAssigned((prev) => prev.filter((s) => s.id !== selectedAssignId));
        setAvailable((prev) => [...prev, sack]);
        setSelectedAssignId(null);
    };

    // Guardar cambios
    const handleSave = async () => {
        if (!assigned.length) {
            alert("Agrega al menos una saca al embarque.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            // Las nuevas son las que tienen shipment_sack_id vacío
            const newSackIds = assigned
                .filter((s) => !s.shipment_sack_id)
                .map((s) => s.id);

            if (newSackIds.length > 0) {
                const res = await fetch(`/api/shipments/${shipmentId}/sacks`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken(),
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ sack_ids: newSackIds }),
                });
                if (!res.ok) {
                    const d = await res.json();
                    throw new Error(d.error ?? "Error al guardar");
                }
            }

            // Recargar para sincronizar shipment_sack_ids
            await load();
        } catch (e: any) {
            setError(e.message ?? "Error al guardar las sacas.");
        } finally {
            setSaving(false);
        }
    };

    // Totales
    const totalAssigned = assigned.reduce(
        (acc, s) => ({
            pkgs: acc.pkgs + s.packages_count,
            lbs: acc.lbs + s.pounds_total,
            kgs: acc.kgs + s.kilograms_total,
        }),
        { pkgs: 0, lbs: 0, kgs: 0 },
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#0e0e0e] border border-red-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-red-900/40">
                    <div className="flex items-center gap-3">
                        <Layers className="h-5 w-5 text-red-400" />
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                Sacas del Embarque
                            </h2>
                            <p className="text-xs text-gray-400">
                                Embarque:{" "}
                                <span className="text-yellow-400 font-mono">
                                    {shipmentNumber}
                                </span>
                                {" — "}Asigna las sacas confirmadas de traslados
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-gray-400">
                            <svg
                                className="animate-spin h-6 w-6 mr-3"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8z"
                                />
                            </svg>
                            Cargando sacas disponibles...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4">
                            {/* IZQUIERDA: Sacas disponibles */}
                            <div className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                                    Sacas Disponibles
                                    <span className="ml-2 text-xs text-gray-500 normal-case font-normal">
                                        (confirmadas en traslados)
                                    </span>
                                </h3>
                                <div className="rounded-lg border border-red-900/30 overflow-hidden">
                                    <table className="w-full text-xs text-white">
                                        <thead className="bg-red-900/30 text-gray-300 uppercase">
                                            <tr>
                                                <th className="px-3 py-2 text-left">
                                                    No. Saca
                                                </th>
                                                <th className="px-3 py-2 text-left">
                                                    Traslado
                                                </th>
                                                <th className="px-3 py-2 text-left">
                                                    De → A
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Pzas
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Lbs
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-red-900/20">
                                            {available.length ? (
                                                available.map((sack) => (
                                                    <>
                                                        <tr
                                                            key={sack.id}
                                                            onClick={() =>
                                                                setSelectedAvailId(
                                                                    selectedAvailId ===
                                                                        sack.id
                                                                        ? null
                                                                        : sack.id,
                                                                )
                                                            }
                                                            className={`cursor-pointer transition-colors ${
                                                                selectedAvailId ===
                                                                sack.id
                                                                    ? "bg-red-900/40"
                                                                    : "hover:bg-white/5"
                                                            }`}
                                                        >
                                                            <td className="px-3 py-2 font-semibold text-yellow-400">
                                                                #
                                                                {
                                                                    sack.sack_number
                                                                }
                                                            </td>
                                                            <td className="px-3 py-2 font-mono text-gray-300">
                                                                {
                                                                    sack.transfer_number
                                                                }
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-400">
                                                                {sack.from_city}{" "}
                                                                → {sack.to_city}
                                                            </td>
                                                            <td className="px-3 py-2 text-right">
                                                                {
                                                                    sack.packages_count
                                                                }
                                                            </td>
                                                            <td className="px-3 py-2 text-right">
                                                                {sack.pounds_total.toFixed(
                                                                    2,
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {/* Detalle de paquetes expandible */}
                                                        {selectedAvailId ===
                                                            sack.id &&
                                                            sack.packages
                                                                .length > 0 && (
                                                                <tr
                                                                    key={`${sack.id}-detail`}
                                                                >
                                                                    <td
                                                                        colSpan={
                                                                            5
                                                                        }
                                                                        className="px-3 pb-2 bg-black/40"
                                                                    >
                                                                        <div className="text-xs text-gray-400 space-y-0.5 mt-1">
                                                                            {sack.packages.map(
                                                                                (
                                                                                    pkg,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            pkg.id
                                                                                        }
                                                                                        className="flex gap-2"
                                                                                    >
                                                                                        <span className="text-yellow-500 font-mono">
                                                                                            {
                                                                                                pkg.barcode
                                                                                            }
                                                                                        </span>
                                                                                        <span>
                                                                                            {
                                                                                                pkg.content
                                                                                            }
                                                                                        </span>
                                                                                        <span className="text-gray-500">
                                                                                            {
                                                                                                pkg.pounds
                                                                                            }{" "}
                                                                                            lbs
                                                                                        </span>
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                    </>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="text-center py-8 text-gray-500"
                                                    >
                                                        No hay sacas confirmadas
                                                        disponibles.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* CENTRO: Flechas */}
                            <div className="flex lg:flex-col items-center justify-center gap-3 py-4">
                                <button
                                    onClick={moveToAssigned}
                                    disabled={!selectedAvailId}
                                    className="p-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Agregar al embarque"
                                >
                                    <ChevronRight className="h-5 w-5 text-white" />
                                </button>
                                <button
                                    onClick={moveToAvailable}
                                    disabled={!selectedAssignId}
                                    className="p-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Quitar del embarque"
                                >
                                    <ChevronLeft className="h-5 w-5 text-white" />
                                </button>
                            </div>

                            {/* DERECHA: Sacas asignadas */}
                            <div className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                                    Sacas en este Embarque
                                </h3>
                                <div className="rounded-lg border border-green-900/30 overflow-hidden">
                                    <table className="w-full text-xs text-white">
                                        <thead className="bg-green-900/20 text-gray-300 uppercase">
                                            <tr>
                                                <th className="px-3 py-2 text-left">
                                                    No. Saca
                                                </th>
                                                <th className="px-3 py-2 text-left">
                                                    Traslado
                                                </th>
                                                <th className="px-3 py-2 text-left">
                                                    De → A
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Pzas
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Lbs
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-green-900/20">
                                            {assigned.length ? (
                                                assigned.map((sack) => (
                                                    <>
                                                        <tr
                                                            key={sack.id}
                                                            onClick={() =>
                                                                setSelectedAssignId(
                                                                    selectedAssignId ===
                                                                        sack.id
                                                                        ? null
                                                                        : sack.id,
                                                                )
                                                            }
                                                            className={`cursor-pointer transition-colors ${
                                                                selectedAssignId ===
                                                                sack.id
                                                                    ? "bg-green-900/30"
                                                                    : "hover:bg-white/5"
                                                            }`}
                                                        >
                                                            <td className="px-3 py-2 font-semibold text-green-400">
                                                                #
                                                                {
                                                                    sack.sack_number
                                                                }
                                                            </td>
                                                            <td className="px-3 py-2 font-mono text-gray-300">
                                                                {
                                                                    sack.transfer_number
                                                                }
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-400">
                                                                {sack.from_city}{" "}
                                                                → {sack.to_city}
                                                            </td>
                                                            <td className="px-3 py-2 text-right">
                                                                {
                                                                    sack.packages_count
                                                                }
                                                            </td>
                                                            <td className="px-3 py-2 text-right">
                                                                {sack.pounds_total.toFixed(
                                                                    2,
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {selectedAssignId ===
                                                            sack.id &&
                                                            sack.packages
                                                                .length > 0 && (
                                                                <tr
                                                                    key={`${sack.id}-detail`}
                                                                >
                                                                    <td
                                                                        colSpan={
                                                                            5
                                                                        }
                                                                        className="px-3 pb-2 bg-black/40"
                                                                    >
                                                                        <div className="text-xs text-gray-400 space-y-0.5 mt-1">
                                                                            {sack.packages.map(
                                                                                (
                                                                                    pkg,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            pkg.id
                                                                                        }
                                                                                        className="flex gap-2"
                                                                                    >
                                                                                        <span className="text-green-500 font-mono">
                                                                                            {
                                                                                                pkg.barcode
                                                                                            }
                                                                                        </span>
                                                                                        <span>
                                                                                            {
                                                                                                pkg.content
                                                                                            }
                                                                                        </span>
                                                                                        <span className="text-gray-500">
                                                                                            {
                                                                                                pkg.pounds
                                                                                            }{" "}
                                                                                            lbs
                                                                                        </span>
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                    </>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="text-center py-8 text-gray-500"
                                                    >
                                                        Sin sacas asignadas aún.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totales */}
                                {assigned.length > 0 && (
                                    <div className="flex gap-4 text-xs text-gray-400 px-1">
                                        <span>
                                            Sacas:{" "}
                                            <span className="text-white font-semibold">
                                                {assigned.length}
                                            </span>
                                        </span>
                                        <span>
                                            Piezas:{" "}
                                            <span className="text-white font-semibold">
                                                {totalAssigned.pkgs}
                                            </span>
                                        </span>
                                        <span>
                                            Lbs:{" "}
                                            <span className="text-white font-semibold">
                                                {totalAssigned.lbs.toFixed(2)}
                                            </span>
                                        </span>
                                        <span>
                                            Kgs:{" "}
                                            <span className="text-white font-semibold">
                                                {totalAssigned.kgs.toFixed(2)}
                                            </span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-700 bg-red-950/30 px-4 py-3 text-red-300 text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-red-900/40">
                    <span className="text-xs text-gray-500">
                        Haz clic en una saca para ver sus paquetes. Usa las
                        flechas para mover.
                    </span>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white border border-white/10"
                        >
                            Cerrar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="bg-green-600 hover:bg-green-700 font-semibold min-w-[140px]"
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8z"
                                        />
                                    </svg>
                                    Guardando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Guardar Sacas
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Página principal ──────────────────────────────────────────
export default function ShipmentCreate({ nextNumber, enterprise }: Props) {
    const today = new Date().toISOString().slice(0, 10);

    const [form, setForm] = useState<FormData>({
        date: today,
        country_origin: "ECUADOR",
        agency_origin: enterprise?.agency_origin ?? "",
        sack_prefix: "",
        route: "",
        airline: "",
        number: nextNumber,
        airport_origin: "",
        airport_dest: "",
        cargo_agency: "",
        palletizer: "",
        open: true,
    });

    const [errors, setErrors] = useState<
        Partial<Record<keyof FormData, string>>
    >({});
    const [saving, setSaving] = useState(false);

    // Estado del modal de sacas
    const [createdShipment, setCreatedShipment] = useState<{
        id: string;
        number: string;
    } | null>(null);
    const [showSacksModal, setShowSacksModal] = useState(false);

    const set = (key: keyof FormData, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = (): boolean => {
        const errs: Partial<Record<keyof FormData, string>> = {};
        const req: (keyof FormData)[] = [
            "date",
            "country_origin",
            "agency_origin",
            "sack_prefix",
            "route",
            "airline",
            "number",
            "airport_origin",
            "airport_dest",
        ];
        req.forEach((k) => {
            if (!String(form[k]).trim()) errs[k] = "Este campo es obligatorio.";
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        setSaving(true);

        router.post(route("shipments.store"), form as any, {
            preserveScroll: true,
            onSuccess: (page) => {
                // Obtener el embarque recién creado para abrir el modal de sacas
                // El controlador debe devolver el ID en el flash o en props
                const flash = (page.props as any)?.flash;
                const shipmentId = flash?.shipment_id;
                const shipmentNumber = flash?.shipment_number ?? form.number;

                if (shipmentId) {
                    setCreatedShipment({
                        id: shipmentId,
                        number: shipmentNumber,
                    });
                    setShowSacksModal(true);
                } else {
                    // Si no hay flash, redirigir al índice
                    router.visit(route("shipments.index"));
                }
            },
            onError: (errs) => {
                const mapped: Partial<Record<keyof FormData, string>> = {};
                Object.entries(errs).forEach(([k, msg]) => {
                    mapped[k as keyof FormData] = msg;
                });
                setErrors(mapped);
            },
            onFinish: () => setSaving(false),
        });
    };

    const handleSacksModalClose = () => {
        setShowSacksModal(false);
        router.visit(route("shipments.index"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nuevo Embarque" />

            <div className="min-h-screen bg-[#0a0a0a] text-white">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-900 via-red-700 to-yellow-500 px-6 py-5">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        <Plane className="h-7 w-7 text-white" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Nuevo Embarque
                            </h1>
                            <nav className="flex items-center gap-1 text-xs text-white/70 mt-0.5">
                                <span
                                    className="hover:text-white cursor-pointer"
                                    onClick={() =>
                                        router.visit(route("shipments.index"))
                                    }
                                >
                                    Embarques
                                </span>
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-white">Crear</span>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                    {/* Datos generales */}
                    <section className="rounded-xl border border-red-900/40 bg-[#0e0e0e] overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-red-900/30 bg-red-950/20">
                            <Calendar className="h-4 w-4 text-red-400" />
                            <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wider">
                                Datos Generales
                            </h2>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <Field
                                label="Fecha"
                                icon={<Calendar className="h-3.5 w-3.5" />}
                                error={errors.date}
                                required
                            >
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) =>
                                        set("date", e.target.value)
                                    }
                                    className={inputCls}
                                />
                            </Field>
                            <Field
                                label="Número Embarque"
                                icon={<Hash className="h-3.5 w-3.5" />}
                                error={errors.number}
                                required
                            >
                                <input
                                    type="text"
                                    value={form.number}
                                    onChange={(e) =>
                                        set("number", e.target.value)
                                    }
                                    placeholder="EMB-000001"
                                    className={inputCls}
                                />
                            </Field>
                            <Field
                                label="País de Origen"
                                icon={<Globe className="h-3.5 w-3.5" />}
                                error={errors.country_origin}
                                required
                            >
                                <input
                                    type="text"
                                    value={form.country_origin}
                                    onChange={(e) =>
                                        set("country_origin", e.target.value)
                                    }
                                    placeholder="ECUADOR"
                                    className={inputCls}
                                />
                            </Field>
                            <Field
                                label="Agencia Origen"
                                icon={<Building2 className="h-3.5 w-3.5" />}
                                error={errors.agency_origin}
                                required
                            >
                                <input
                                    type="text"
                                    value={form.agency_origin}
                                    onChange={(e) =>
                                        set("agency_origin", e.target.value)
                                    }
                                    placeholder="Nombre de la agencia"
                                    className={inputCls}
                                />
                            </Field>

                            {/* ── Prefijo de Sacas: ahora es un combo box ── */}
                            <Field
                                label="Prefijo de Sacas"
                                icon={<Layers className="h-3.5 w-3.5" />}
                                error={errors.sack_prefix}
                                required
                            >
                                <select
                                    value={form.sack_prefix}
                                    onChange={(e) =>
                                        set("sack_prefix", e.target.value)
                                    }
                                    className={selectCls}
                                >
                                    <option value="" disabled>
                                        Selecciona un prefijo
                                    </option>
                                    {SACK_PREFIX_OPTIONS.map((prefix) => (
                                        <option key={prefix} value={prefix}>
                                            {prefix}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Ruta"
                                icon={<Route className="h-3.5 w-3.5" />}
                                error={errors.route}
                                required
                            >
                                <input
                                    type="text"
                                    value={form.route}
                                    onChange={(e) =>
                                        set("route", e.target.value)
                                    }
                                    placeholder="Ej: GYE-MIA"
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Aerolínea */}
                    <section className="rounded-xl border border-red-900/40 bg-[#0e0e0e] overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-red-900/30 bg-red-950/20">
                            <Plane className="h-4 w-4 text-red-400" />
                            <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wider">
                                Aerolínea y Aeropuertos
                            </h2>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <Field
                                label="Aerolínea"
                                icon={<Plane className="h-3.5 w-3.5" />}
                                error={errors.airline}
                                required
                            >
                                <input
                                    type="text"
                                    value={form.airline}
                                    onChange={(e) =>
                                        set("airline", e.target.value)
                                    }
                                    placeholder="Ej: AVIANCA, LATAM"
                                    className={inputCls}
                                />
                            </Field>
                            <Field
                                label="Aeropuerto Origen"
                                icon={<MapPin className="h-3.5 w-3.5" />}
                                error={errors.airport_origin}
                                required
                            >
                                <input
                                    type="text"
                                    value={form.airport_origin}
                                    onChange={(e) =>
                                        set("airport_origin", e.target.value)
                                    }
                                    placeholder="Ej: GYE - Guayaquil"
                                    className={inputCls}
                                />
                            </Field>
                            <Field
                                label="Aeropuerto Destino"
                                icon={<MapPin className="h-3.5 w-3.5" />}
                                error={errors.airport_dest}
                                required
                            >
                                <input
                                    type="text"
                                    value={form.airport_dest}
                                    onChange={(e) =>
                                        set("airport_dest", e.target.value)
                                    }
                                    placeholder="Ej: MIA - Miami"
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Logística */}
                    <section className="rounded-xl border border-red-900/40 bg-[#0e0e0e] overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-red-900/30 bg-red-950/20">
                            <Package className="h-4 w-4 text-red-400" />
                            <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wider">
                                Logística
                            </h2>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Field
                                label="Agencia de Carga"
                                icon={<Building2 className="h-3.5 w-3.5" />}
                                error={errors.cargo_agency}
                            >
                                <input
                                    type="text"
                                    value={form.cargo_agency}
                                    onChange={(e) =>
                                        set("cargo_agency", e.target.value)
                                    }
                                    placeholder="Nombre de la agencia de carga"
                                    className={inputCls}
                                />
                            </Field>
                            <Field
                                label="Paletizadora"
                                icon={<Layers className="h-3.5 w-3.5" />}
                                error={errors.palletizer}
                            >
                                <input
                                    type="text"
                                    value={form.palletizer}
                                    onChange={(e) =>
                                        set("palletizer", e.target.value)
                                    }
                                    placeholder="Nombre de la paletizadora"
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                        <div className="px-5 pb-5">
                            <button
                                type="button"
                                onClick={() => set("open", !form.open)}
                                className={`flex items-center gap-3 rounded-lg border px-4 py-3 w-full sm:w-auto transition-all ${
                                    form.open
                                        ? "border-green-600 bg-green-900/20 text-green-300 hover:bg-green-900/30"
                                        : "border-red-700 bg-red-900/20 text-red-300 hover:bg-red-900/30"
                                }`}
                            >
                                {form.open ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-400" />
                                )}
                                <div className="text-left">
                                    <p className="text-sm font-semibold">
                                        Embarque{" "}
                                        {form.open ? "ABIERTO" : "CERRADO"}
                                    </p>
                                    <p className="text-xs opacity-60">
                                        {form.open
                                            ? "Se pueden agregar sacas"
                                            : "No se pueden agregar sacas"}
                                    </p>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Acciones */}
                    <div className="flex items-center justify-end gap-3 pb-6">
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
                            onClick={() =>
                                router.visit(route("shipments.index"))
                            }
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="min-w-[180px] font-semibold bg-red-600 hover:bg-red-700"
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8z"
                                        />
                                    </svg>
                                    Creando embarque...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Plane className="h-4 w-4" />
                                    Crear Embarque y Agregar Sacas
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal de sacas — se abre automáticamente tras crear el embarque */}
            {showSacksModal && createdShipment && (
                <SacksModal
                    shipmentId={createdShipment.id}
                    shipmentNumber={createdShipment.number}
                    onClose={handleSacksModalClose}
                />
            )}
        </AuthenticatedLayout>
    );
}
