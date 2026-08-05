import { useState, useEffect } from "react";
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
    CheckCircle2,
    XCircle,
    Lock,
} from "lucide-react";
import { Modal, Field, csrfToken } from "./helpers";
import {
    SACK_PREFIX_OPTIONS,
    AIRLINE_OPTIONS,
    AIRLINE_NUMBER_PREFIX,
    FIXED_COUNTRY_ORIGIN,
    FIXED_AGENCY_ORIGIN,
    ROUTE_OPTIONS,
    DEFAULT_ROUTE,
    AIRPORT_ORIGIN_OPTIONS,
    AIRPORT_DEST_OPTIONS,
    CARGO_AGENCY_OPTIONS,
    PALLETIZER_OPTIONS,
    inputCls,
    inputLockedCls,
    selectCls,
} from "./constants";

export default function CreateShipmentModal({
    onClose,
    onCreated,
}: {
    nextNumber: string;
    enterprise?: { agency_origin: string } | null;
    onClose: () => void;
    onCreated: (
        id: string,
        number: string,
        sackPrefix: string,
        route: string,
    ) => void;
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

    const [numberSuffix, setNumberSuffix] = useState("");
    const numberPrefix = AIRLINE_NUMBER_PREFIX[form.airline] ?? "";

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

    const handleAirlineChange = (value: string) => {
        setForm((p) => ({ ...p, airline: value }));
        setNumberSuffix("");
        setErrors((p) => ({ ...p, airline: "", number: "" }));
    };

    const handleNumberSuffixChange = (value: string) => {
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
            "route",
            "airline",
            "airport_origin",
            "airport_dest",
        ].forEach((k) => {
            if (!String((form as any)[k]).trim()) errs[k] = "Obligatorio.";
        });

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
                    "X-CSRF-TOKEN": csrfToken(),
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    ...form,
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
            onCreated(data.id, data.number, form.sack_prefix, form.route);
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

                        <Field
                            label="Prefijo para Sacas"
                            icon={<Layers className="h-3.5 w-3.5" />}
                            error={errors.sack_prefix}
                        >
                            <select
                                value={form.sack_prefix}
                                onChange={(e) =>
                                    set("sack_prefix", e.target.value)
                                }
                                className={selectCls}
                            >
                                <option value="">Sin prefijo</option>
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
