import { useState } from "react";
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
} from "lucide-react";

// ─── Tipos ───────────────────────────────────────────────────
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

// ─── Componente Field ─────────────────────────────────────────
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

// ─── Página principal ─────────────────────────────────────────
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
    const [saved, setSaved] = useState(false);

    // Actualizar campo
    const set = (key: keyof FormData, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    // Validación local
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
            if (!String(form[k]).trim()) {
                errs[k] = "Este campo es obligatorio.";
            }
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        setSaving(true);

        router.post(route("shipments.store"), form as any, {
            preserveScroll: true,
            onSuccess: () => {
                setSaved(true);
            },
            onError: (errs) => {
                // errs es { field: "mensaje" } directo de Laravel
                const mapped: Partial<Record<keyof FormData, string>> = {};
                Object.entries(errs).forEach(([k, msg]) => {
                    mapped[k as keyof FormData] = msg;
                });
                setErrors(mapped);
            },
            onFinish: () => {
                setSaving(false);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nuevo Embarque" />

            <div className="min-h-screen bg-[#0a0a0a] text-white">
                {/* ── Header ── */}
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

                {/* ── Body ── */}
                <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                    {/* ── Sección: Datos generales ── */}
                    <section className="rounded-xl border border-red-900/40 bg-[#0e0e0e] overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-red-900/30 bg-red-950/20">
                            <Calendar className="h-4 w-4 text-red-400" />
                            <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wider">
                                Datos Generales
                            </h2>
                        </div>

                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {/* Fecha */}
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

                            {/* Número de embarque */}
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

                            {/* País de origen */}
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

                            {/* Agencia de origen */}
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

                            {/* Prefijo de sacas */}
                            <Field
                                label="Prefijo de Sacas"
                                icon={<Layers className="h-3.5 w-3.5" />}
                                error={errors.sack_prefix}
                                required
                            >
                                <input
                                    type="text"
                                    value={form.sack_prefix}
                                    onChange={(e) =>
                                        set("sack_prefix", e.target.value)
                                    }
                                    placeholder="Ej: CUE, GYE"
                                    className={`${inputCls} uppercase`}
                                    onInput={(e) => {
                                        const t = e.currentTarget;
                                        t.value = t.value.toUpperCase();
                                    }}
                                />
                            </Field>

                            {/* Ruta */}
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

                    {/* ── Sección: Aerolínea y aeropuertos ── */}
                    <section className="rounded-xl border border-red-900/40 bg-[#0e0e0e] overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-red-900/30 bg-red-950/20">
                            <Plane className="h-4 w-4 text-red-400" />
                            <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wider">
                                Aerolínea y Aeropuertos
                            </h2>
                        </div>

                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {/* Aerolínea */}
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

                            {/* Aeropuerto origen */}
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

                            {/* Aeropuerto destino */}
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

                    {/* ── Sección: Logística ── */}
                    <section className="rounded-xl border border-red-900/40 bg-[#0e0e0e] overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-red-900/30 bg-red-950/20">
                            <Package className="h-4 w-4 text-red-400" />
                            <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wider">
                                Logística
                            </h2>
                        </div>

                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Agencia de carga */}
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

                            {/* Paletizadora */}
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

                        {/* Embarque abierto */}
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

                    {/* ── Acciones ── */}
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
                            disabled={saving || saved}
                            className={`min-w-[160px] font-semibold transition-all ${
                                saved
                                    ? "bg-green-600 hover:bg-green-600"
                                    : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            {saved ? (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Guardado
                                </span>
                            ) : saving ? (
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
                                    <Plane className="h-4 w-4" />
                                    Crear Embarque
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
