import { useState, useEffect, useCallback, useMemo } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import Pagination from "@/Components/Pagination";
import { cn } from "@/lib/utils";
import {
    Plane,
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    Ban,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    ChevronLeft,
    X,
    Layers,
    AlertCircle,
    Package,
    Calendar,
    Hash,
    Globe,
    Building2,
    MapPin,
    Route,
    Lock,
} from "lucide-react";

// ─── Constantes ───────────────────────────────────────────────
const SACK_PREFIX_OPTIONS = ["B", "C", "D", "E", "F", "G", "H"];

const AIRLINE_OPTIONS = [
    "AEROMEXICO",
    "AVIANCA",
    "COPA",
    "LATAM",
    "DELTA",
    "DHL",
];

// Prefijo numérico fijo que corresponde al número de embarque según la aerolínea
const AIRLINE_NUMBER_PREFIX: Record<string, string> = {
    AEROMEXICO: "139",
    AVIANCA: "729",
    COPA: "230",
    LATAM: "145",
    DELTA: "006",
    DHL: "155",
};

// País y agencia de origen: siempre fijos, no editables por el usuario
const FIXED_COUNTRY_ORIGIN = "ECUADOR";
const FIXED_AGENCY_ORIGIN = "CUENCA";

// Ruta: por ahora un único destino disponible, pre-seleccionado
const ROUTE_OPTIONS = ["ECUADOR - ESTADOS UNIDOS"];
const DEFAULT_ROUTE = ROUTE_OPTIONS[0];

const AIRPORT_ORIGIN_OPTIONS = [
    "GUAYAQUIL - JOSE JOAQUIN DE OLMEDO",
    "QUITO - MARISCAL SUCRE",
];

const AIRPORT_DEST_OPTIONS = ["CHICAGO-O'HARE", "JOHN F.KENNEDY"];

const CARGO_AGENCY_OPTIONS = [
    "CARGO FLEX",
    "DOLY CARGO",
    "ECUADOR CARGO GYE",
    "ECUADOR CARGO QUITO",
    "FERVA CARGO",
    "MULTIMODAL",
    "NAAS LOGISTICS",
    "TRANSOCEANICA",
];

const PALLETIZER_OPTIONS = ["EXP AIR", "GENERAL AIR", "NOVACARGO", "PETRALI"];

// ─── Tipos ────────────────────────────────────────────────────
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
interface ShipmentRow {
    id: string;
    number: string;
    date: string;
    route: string;
    airline: string;
    airport_origin: string;
    airport_dest: string;
    status: string;
}

// ─── Helpers ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        OPEN: {
            label: "Abierto",
            cls: "bg-green-900/30 text-green-300 border-green-700",
        },
        CLOSED: {
            label: "Cerrado",
            cls: "bg-gray-800 text-gray-300 border-gray-600",
        },
        CANCELLED: {
            label: "Cancelado",
            cls: "bg-red-900/30 text-red-300 border-red-700",
        },
    };
    const s = map[status] ?? map.OPEN;
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${s.cls}`}
        >
            {s.label}
        </span>
    );
}

function n(v: any) {
    return parseFloat(String(v)) || 0;
}

function calculateTotals(pkgs: SackPackage[]) {
    return {
        pieces: pkgs.length,
        pounds: pkgs.reduce((s, p) => s + n(p.pounds), 0),
        kilograms: pkgs.reduce((s, p) => s + n(p.kilograms), 0),
    };
}

const inputCls =
    "w-full bg-[#111] border border-red-900/50 text-white rounded-md px-3 py-2 text-sm " +
    "focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 " +
    "placeholder:text-gray-600 transition-colors";

const inputLockedCls =
    "w-full bg-[#0a0a0a] border border-red-900/20 text-gray-400 rounded-md px-3 py-2 text-sm " +
    "cursor-not-allowed select-none";

const selectCls =
    "w-full bg-[#111] border border-red-900/50 text-white rounded-md px-3 py-2 text-sm " +
    "focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 " +
    "transition-colors cursor-pointer appearance-none " +
    "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23f87171%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')] " +
    "bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px] pr-9";

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

// ─── Modal genérico ───────────────────────────────────────────
function Modal({
    title,
    isOpen,
    onClose,
    children,
}: {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-black border border-red-700 rounded-lg w-full max-w-6xl shadow-lg">
                <div className="flex items-center justify-between px-6 py-3 border-b border-red-700">
                    <h2 className="text-lg font-semibold text-white">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-red-700 text-gray-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ─── Modal: Crear Embarque ────────────────────────────────────
function CreateShipmentModal({
    nextNumber,
    enterprise,
    onClose,
    onCreated,
}: {
    nextNumber: string;
    enterprise?: { agency_origin: string } | null;
    onClose: () => void;
    onCreated: (id: string, number: string) => void;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const [form, setForm] = useState({
        date: today,
        country_origin: FIXED_COUNTRY_ORIGIN,
        agency_origin: FIXED_AGENCY_ORIGIN,
        sack_prefix: "",
        route: DEFAULT_ROUTE,
        airline: "",
        number: "",
        airport_origin: "",
        airport_dest: "",
        cargo_agency: "",
        palletizer: "",
        open: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    // ── Número de embarque: prefijo bloqueado según aerolínea + resto editable ──
    const [numberSuffix, setNumberSuffix] = useState("");
    const numberPrefix = AIRLINE_NUMBER_PREFIX[form.airline] ?? "";

    // Mantiene form.number sincronizado con "prefijo + resto"
    useEffect(() => {
        setForm((p) => ({
            ...p,
            number: numberPrefix ? `${numberPrefix}${numberSuffix}` : "",
        }));
    }, [numberPrefix, numberSuffix]);

    const set = (k: string, v: string | boolean) => {
        setForm((p) => ({ ...p, [k]: v }));
        setErrors((p) => ({ ...p, [k]: "" }));
    };

    // Al cambiar de aerolínea se reinicia el resto del número
    // (el prefijo nunca es editable manualmente por el usuario)
    const handleAirlineChange = (value: string) => {
        setForm((p) => ({ ...p, airline: value }));
        setNumberSuffix("");
        setErrors((p) => ({ ...p, airline: "", number: "" }));
    };

    const handleNumberSuffixChange = (value: string) => {
        // Solo dígitos para la parte editable del número
        const digitsOnly = value.replace(/[^0-9]/g, "");
        setNumberSuffix(digitsOnly);
        setErrors((p) => ({ ...p, number: "" }));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        [
            "date",
            "country_origin",
            "agency_origin",
            "sack_prefix",
            "route",
            "airline",
            "airport_origin",
            "airport_dest",
        ].forEach((k) => {
            if (!String((form as any)[k]).trim()) errs[k] = "Obligatorio.";
        });

        // El número de embarque depende de la aerolínea seleccionada
        if (!form.airline) {
            errs.number = "Selecciona primero una aerolínea.";
        } else if (!numberSuffix.trim()) {
            errs.number = "Completa el número después del prefijo.";
        }

        setErrors(errs);
        return !Object.keys(errs).length;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const fullNumber = `${numberPrefix}${numberSuffix}`;
            const res = await fetch(route("shipments.store"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content ?? "",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    ...form,
                    // Se fuerzan siempre, sin importar lo que haya en el estado
                    country_origin: FIXED_COUNTRY_ORIGIN,
                    agency_origin: FIXED_AGENCY_ORIGIN,
                    number: fullNumber,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.details) {
                    const mapped: Record<string, string> = {};
                    Object.entries(data.details).forEach(([k, msgs]) => {
                        mapped[k] = (msgs as string[])[0];
                    });
                    setErrors(mapped);
                } else {
                    setErrors({ number: data.error ?? "Error al guardar." });
                }
                return;
            }
            onCreated(data.id, data.number);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Nuevo Embarque" isOpen onClose={onClose}>
            <div className="space-y-5">
                <div>
                    <p className="text-xs font-semibold text-red-300 uppercase tracking-wider mb-3 border-b border-red-900/30 pb-1">
                        Datos del Embarque
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 1. FECHA */}
                        <Field
                            label="Fecha"
                            icon={<Calendar className="h-3.5 w-3.5" />}
                            error={errors.date}
                            required
                        >
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => set("date", e.target.value)}
                                className={inputCls}
                            />
                        </Field>

                        {/* 2. PAIS ORIGEN DEL EMBARQUE — fijo, no editable */}
                        <Field
                            label="País Origen del Embarque"
                            icon={<Globe className="h-3.5 w-3.5" />}
                            error={errors.country_origin}
                            required
                        >
                            <div
                                className={`${inputLockedCls} flex items-center justify-between`}
                            >
                                <span>{FIXED_COUNTRY_ORIGIN}</span>
                                <Lock className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                        </Field>

                        {/* 3. AGENCIA CREADORA DEL EMBARQUE — fijo, no editable */}
                        <Field
                            label="Agencia Creadora del Embarque"
                            icon={<Building2 className="h-3.5 w-3.5" />}
                            error={errors.agency_origin}
                            required
                        >
                            <div
                                className={`${inputLockedCls} flex items-center justify-between`}
                            >
                                <span>{FIXED_AGENCY_ORIGIN}</span>
                                <Lock className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                        </Field>

                        {/* 4. PREFIJO PARA SACAS */}
                        <Field
                            label="Prefijo para Sacas"
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

                        {/* 5. RUTA — combo box, viene preseleccionada */}
                        <Field
                            label="Ruta"
                            icon={<Route className="h-3.5 w-3.5" />}
                            error={errors.route}
                            required
                        >
                            <select
                                value={form.route}
                                onChange={(e) => set("route", e.target.value)}
                                className={selectCls}
                            >
                                {ROUTE_OPTIONS.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* 6. AEROLINEA — dispara el prefijo del número */}
                        <Field
                            label="Aerolínea"
                            icon={<Plane className="h-3.5 w-3.5" />}
                            error={errors.airline}
                            required
                        >
                            <select
                                value={form.airline}
                                onChange={(e) =>
                                    handleAirlineChange(e.target.value)
                                }
                                className={selectCls}
                            >
                                <option value="" disabled>
                                    Selecciona una aerolínea
                                </option>
                                {AIRLINE_OPTIONS.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* 7. NO.EMBARQUE — prefijo automático + resto editable */}
                        <Field
                            label="No. Embarque"
                            icon={<Hash className="h-3.5 w-3.5" />}
                            error={errors.number}
                            required
                        >
                            <div
                                className={`flex items-stretch rounded-md border overflow-hidden transition-colors ${
                                    errors.number
                                        ? "border-red-500"
                                        : "border-red-900/50 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30"
                                }`}
                            >
                                <span
                                    className={`flex items-center px-3 text-sm font-mono font-semibold whitespace-nowrap select-none ${
                                        numberPrefix
                                            ? "bg-red-900/40 text-yellow-400"
                                            : "bg-[#0a0a0a] text-gray-600"
                                    }`}
                                    title="Prefijo asignado automáticamente según la aerolínea"
                                >
                                    {numberPrefix || "---"}
                                </span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={numberSuffix}
                                    onChange={(e) =>
                                        handleNumberSuffixChange(e.target.value)
                                    }
                                    disabled={!numberPrefix}
                                    placeholder={
                                        numberPrefix
                                            ? "Ej: 00001"
                                            : "Selecciona una aerolínea primero"
                                    }
                                    className={`flex-1 min-w-0 bg-[#111] text-white text-sm px-3 py-2 focus:outline-none placeholder:text-gray-600 ${
                                        !numberPrefix
                                            ? "cursor-not-allowed opacity-60"
                                            : ""
                                    }`}
                                />
                            </div>
                            {numberPrefix && (
                                <p className="text-[11px] text-gray-500">
                                    Prefijo{" "}
                                    <span className="text-yellow-400 font-mono">
                                        {numberPrefix}
                                    </span>{" "}
                                    bloqueado según la aerolínea seleccionada.
                                </p>
                            )}
                        </Field>

                        {/* 8. AEROPUERTO ORIGEN — combo box */}
                        <Field
                            label="Aeropuerto Origen"
                            icon={<MapPin className="h-3.5 w-3.5" />}
                            error={errors.airport_origin}
                            required
                        >
                            <select
                                value={form.airport_origin}
                                onChange={(e) =>
                                    set("airport_origin", e.target.value)
                                }
                                className={selectCls}
                            >
                                <option value="" disabled>
                                    Selecciona un aeropuerto
                                </option>
                                {AIRPORT_ORIGIN_OPTIONS.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* 9. AEROPUERTO DESTINO — combo box */}
                        <Field
                            label="Aeropuerto Destino"
                            icon={<MapPin className="h-3.5 w-3.5" />}
                            error={errors.airport_dest}
                            required
                        >
                            <select
                                value={form.airport_dest}
                                onChange={(e) =>
                                    set("airport_dest", e.target.value)
                                }
                                className={selectCls}
                            >
                                <option value="" disabled>
                                    Selecciona un aeropuerto
                                </option>
                                {AIRPORT_DEST_OPTIONS.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* 10. AGENCIA DE CARGA — combo box */}
                        <Field
                            label="Agencia de Carga"
                            icon={<Building2 className="h-3.5 w-3.5" />}
                        >
                            <select
                                value={form.cargo_agency}
                                onChange={(e) =>
                                    set("cargo_agency", e.target.value)
                                }
                                className={selectCls}
                            >
                                <option value="">
                                    Selecciona una agencia de carga
                                </option>
                                {CARGO_AGENCY_OPTIONS.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* 11. PALETIZADORA — combo box */}
                        <Field
                            label="Paletizadora"
                            icon={<Layers className="h-3.5 w-3.5" />}
                        >
                            <select
                                value={form.palletizer}
                                onChange={(e) =>
                                    set("palletizer", e.target.value)
                                }
                                className={selectCls}
                            >
                                <option value="">
                                    Selecciona una paletizadora
                                </option>
                                {PALLETIZER_OPTIONS.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={() => set("open", !form.open)}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-all text-sm ${
                            form.open
                                ? "border-green-600 bg-green-900/20 text-green-300 hover:bg-green-900/30"
                                : "border-red-700 bg-red-900/20 text-red-300 hover:bg-red-900/30"
                        }`}
                    >
                        {form.open ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <span className="font-semibold">
                            Embarque {form.open ? "ABIERTO" : "CERRADO"}
                        </span>
                    </button>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-red-900/30">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                        className="border-red-700 text-gray-200 hover:bg-red-700"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {saving ? (
                            "Creando..."
                        ) : (
                            <span className="flex items-center gap-2">
                                <Plane className="h-4 w-4" />
                                Crear Embarque
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// ─── Modal: Agregar Sacas (dos paneles, igual que ConfirmTransferModal) ──
function AddSacksModal({
    shipmentId,
    assignedIds,
    onClose,
    onSaved,
}: {
    shipmentId: string;
    assignedIds: string[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [available, setAvailable] = useState<AvailableSack[]>([]);
    const [toAdd, setToAdd] = useState<AvailableSack[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
    const [searchLeft, setSearchLeft] = useState("");
    const [searchRight, setSearchRight] = useState("");
    const [sackNumber, setSackNumber] = useState("");
    const [sackNumberError, setSackNumberError] = useState("");

    const csrf = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
            ?.content ?? "";

    useEffect(() => {
        fetch("/api/shipments/available-sacks")
            .then((r) => r.json())
            .then((data: AvailableSack[]) =>
                setAvailable(data.filter((s) => !assignedIds.includes(s.id))),
            )
            .catch(() => setError("No se pudieron cargar las sacas."))
            .finally(() => setLoading(false));
    }, []);

    const filteredLeft = useMemo(() => {
        if (!searchLeft.trim()) return available;
        const t = searchLeft.toLowerCase();
        return available.filter(
            (s) =>
                s.sack_number.toString().includes(t) ||
                s.transfer_number.toLowerCase().includes(t) ||
                s.from_city.toLowerCase().includes(t) ||
                s.to_city.toLowerCase().includes(t),
        );
    }, [available, searchLeft]);

    const filteredRight = useMemo(() => {
        if (!searchRight.trim()) return toAdd;
        const t = searchRight.toLowerCase();
        return toAdd.filter(
            (s) =>
                s.sack_number.toString().includes(t) ||
                s.transfer_number.toLowerCase().includes(t),
        );
    }, [toAdd, searchRight]);

    const moveRight = () => {
        if (!selectedLeftId) return;
        const sack = available.find((s) => s.id === selectedLeftId);
        if (!sack) return;
        setAvailable((p) => p.filter((s) => s.id !== selectedLeftId));
        setToAdd((p) => [...p, sack]);
        setSelectedLeftId(null);
    };

    const moveLeft = () => {
        if (!selectedRightId) return;
        const sack = toAdd.find((s) => s.id === selectedRightId);
        if (!sack) return;
        setToAdd((p) => p.filter((s) => s.id !== selectedRightId));
        setAvailable((p) => [...p, sack]);
        setSelectedRightId(null);
    };

    const handleSave = async () => {
        if (!sackNumber.trim()) {
            setSackNumberError("Debes ingresar el número de saca.");
            return;
        }
        if (!toAdd.length) {
            onClose();
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/shipments/${shipmentId}/sacks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrf(),
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    sack_ids: toAdd.map((s) => s.id),
                    sack_number: sackNumber.trim(),
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error ?? "Error");
            }
            onSaved();
        } catch (e: any) {
            setError(e.message ?? "Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    const totalsLeft = {
        lbs: filteredLeft.reduce((s, a) => s + n(a.pounds_total), 0),
    };
    const totalsRight = {
        lbs: filteredRight.reduce((s, a) => s + n(a.pounds_total), 0),
    };

    return (
        <Modal title="Agregar Sacas al Embarque" isOpen onClose={onClose}>
            {loading ? (
                <div className="text-sm text-gray-300 italic py-4">
                    Cargando sacas disponibles...
                </div>
            ) : (
                <>
                    {/* Campo requerido: Nro. Saca */}
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
                        {/* Izquierda */}
                        <div>
                            <h3 className="text-sm text-gray-300 mb-2">
                                Sacas confirmadas disponibles
                            </h3>
                            <div className="mb-2">
                                <input
                                    type="text"
                                    value={searchLeft}
                                    onChange={(e) =>
                                        setSearchLeft(e.target.value)
                                    }
                                    placeholder="Buscar por No. saca, traslado, ciudad..."
                                    className="w-full bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                                />
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-red-700">
                                <table className="min-w-full text-sm text-white table-auto">
                                    <thead className="bg-red-800 text-white">
                                        <tr>
                                            <th className="px-3 py-2 text-left">
                                                No. saca
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
                                    <tbody>
                                        {filteredLeft.length ? (
                                            filteredLeft.map((sack) => (
                                                <tr
                                                    key={sack.id}
                                                    onClick={() =>
                                                        setSelectedLeftId(
                                                            selectedLeftId ===
                                                                sack.id
                                                                ? null
                                                                : sack.id,
                                                        )
                                                    }
                                                    className={cn(
                                                        "border-t border-red-700 cursor-pointer hover:bg-[#1b1b1b]",
                                                        selectedLeftId ===
                                                            sack.id &&
                                                            "bg-red-900/60",
                                                    )}
                                                >
                                                    <td className="px-3 py-1 font-semibold text-yellow-400">
                                                        #{sack.sack_number}
                                                    </td>
                                                    <td className="px-3 py-1 font-mono text-xs">
                                                        {sack.transfer_number}
                                                    </td>
                                                    <td className="px-3 py-1 text-xs text-gray-400">
                                                        {sack.from_city} →{" "}
                                                        {sack.to_city}
                                                    </td>
                                                    <td className="px-3 py-1 text-right">
                                                        {sack.packages_count}
                                                    </td>
                                                    <td className="px-3 py-1 text-right">
                                                        {n(
                                                            sack.pounds_total,
                                                        ).toFixed(2)}
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
                                                        ? "No se encontraron sacas."
                                                        : "No hay sacas confirmadas disponibles."}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-2 text-xs text-gray-300 flex justify-between">
                                <span>
                                    SACAS:{" "}
                                    <span className="text-white font-semibold">
                                        {filteredLeft.length}
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

                        {/* Derecha */}
                        <div>
                            <h3 className="text-sm text-gray-300 mb-2">
                                Sacas a agregar al embarque
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
                            <div className="overflow-x-auto rounded-lg border border-red-700">
                                <table className="min-w-full text-sm text-white table-auto">
                                    <thead className="bg-red-800 text-white">
                                        <tr>
                                            <th className="px-3 py-2 text-left">
                                                No. saca
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
                                    <tbody>
                                        {filteredRight.length ? (
                                            filteredRight.map((sack) => (
                                                <tr
                                                    key={sack.id}
                                                    onClick={() =>
                                                        setSelectedRightId(
                                                            selectedRightId ===
                                                                sack.id
                                                                ? null
                                                                : sack.id,
                                                        )
                                                    }
                                                    className={cn(
                                                        "border-t border-red-700 cursor-pointer hover:bg-[#1b1b1b]",
                                                        selectedRightId ===
                                                            sack.id &&
                                                            "bg-red-900/60",
                                                    )}
                                                >
                                                    <td className="px-3 py-1 font-semibold text-green-400">
                                                        #{sack.sack_number}
                                                    </td>
                                                    <td className="px-3 py-1 font-mono text-xs">
                                                        {sack.transfer_number}
                                                    </td>
                                                    <td className="px-3 py-1 text-xs text-gray-400">
                                                        {sack.from_city} →{" "}
                                                        {sack.to_city}
                                                    </td>
                                                    <td className="px-3 py-1 text-right">
                                                        {sack.packages_count}
                                                    </td>
                                                    <td className="px-3 py-1 text-right">
                                                        {n(
                                                            sack.pounds_total,
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="text-center py-4 text-gray-400 italic text-sm"
                                                >
                                                    {searchRight.trim()
                                                        ? "No se encontraron sacas."
                                                        : "No hay sacas seleccionadas."}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-2 text-xs text-gray-300 flex justify-between">
                                <span>
                                    SACAS:{" "}
                                    <span className="text-white font-semibold">
                                        {filteredRight.length}
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
                            {saving ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
}

// ─── Modal: LISTADO de Sacas del Embarque (nivel 1) ───────────
function SacksListModal({
    shipmentId,
    shipmentNumber,
    shipmentStatus,
    onClose,
}: {
    shipmentId: string;
    shipmentNumber: string;
    shipmentStatus: string;
    onClose: () => void;
}) {
    const isReadOnly = shipmentStatus === "CANCELLED";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [assigned, setAssigned] = useState<AssignedSack[]>([]);
    const [showAddSacks, setShowAddSacks] = useState(false);
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
                                    title="Agregar sacas"
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
                                            No. saca
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            Traslado
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            De → A
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
                                                    #{sack.sack_number}
                                                </td>
                                                <td className="px-4 py-2 font-mono text-xs">
                                                    {sack.transfer_number}
                                                </td>
                                                <td className="px-4 py-2 text-xs text-gray-400">
                                                    {sack.from_city} →{" "}
                                                    {sack.to_city}
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
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            setViewingSack(sack)
                                                        }
                                                        className="h-7 px-3 bg-blue-700 hover:bg-blue-600 text-white text-xs"
                                                    >
                                                        Ver saca
                                                    </Button>
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

            {/* Modal: Ver detalle de UNA saca con sus paquetes */}
            {viewingSack && (
                <SackDetailModal
                    sack={viewingSack}
                    onClose={() => setViewingSack(null)}
                />
            )}

            {/* Modal: Agregar sacas confirmadas */}
            {showAddSacks && (
                <AddSacksModal
                    shipmentId={shipmentId}
                    assignedIds={assigned.map((s) => s.id)}
                    onClose={() => setShowAddSacks(false)}
                    onSaved={() => {
                        setShowAddSacks(false);
                        load();
                    }}
                />
            )}
        </>
    );
}

// ─── Modal: Detalle de UNA saca — muestra sus paquetes (nivel 2) ──
function SackDetailModal({
    sack,
    onClose,
}: {
    sack: AssignedSack;
    onClose: () => void;
}) {
    const [search, setSearch] = useState("");

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

    return (
        <Modal
            title={`Saca #${sack.sack_number} — Traslado ${sack.transfer_number}`}
            isOpen
            onClose={onClose}
        >
            <div className="mb-3 flex flex-wrap gap-4 text-sm text-gray-300">
                <span>
                    Ruta:{" "}
                    <span className="text-white font-semibold">
                        {sack.from_city} → {sack.to_city}
                    </span>
                </span>
                {sack.seal && (
                    <span>
                        Precinto:{" "}
                        <span className="text-white font-semibold">
                            {sack.seal}
                        </span>
                    </span>
                )}
                <span>
                    Refrigerada:{" "}
                    <span className="text-white font-semibold">
                        {sack.refrigerated ? "Sí" : "No"}
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
                                    colSpan={5}
                                    className="text-center py-8 text-gray-400 italic text-sm"
                                >
                                    {search.trim()
                                        ? "No se encontraron paquetes."
                                        : "Esta saca no tiene paquetes confirmados."}
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

// ─── Página principal ──────────────────────────────────────────
export default function ShipmentsPage({
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
    } | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get(route("shipments.index"), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleCreated = (id: string, number: string) => {
        setShowCreate(false);
        setSacksModal({ id, number, status: "OPEN" });
        router.reload({ only: ["shipments", "nextNumber"] });
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
                                            {s.number}
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
                                                        })
                                                    }
                                                    className="h-7 px-2.5 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-semibold"
                                                >
                                                    <Layers className="h-3 w-3 mr-1" />
                                                    Sacas
                                                </Button>
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
                    onClose={() => setSacksModal(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
