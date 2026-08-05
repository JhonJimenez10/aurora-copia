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
    AlertCircle,
    Lock,
    Pencil,
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
import type { ShipmentRow } from "./types";

export default function EditShipmentModal({
    shipment,
    onClose,
    onUpdated,
}: {
    shipment: ShipmentRow;
    onClose: () => void;
    onUpdated: (id: string, number: string) => void;
}) {
    const isCancelled = shipment.status === "CANCELLED";

    const initialPrefix = AIRLINE_NUMBER_PREFIX[shipment.airline] ?? "";
    const initialSuffix =
        initialPrefix && shipment.number.startsWith(initialPrefix)
            ? shipment.number.slice(initialPrefix.length)
            : shipment.number;

    const [form, setForm] = useState({
        date: shipment.date?.slice(0, 10) ?? "",
        country_origin: FIXED_COUNTRY_ORIGIN,
        agency_origin: FIXED_AGENCY_ORIGIN,
        sack_prefix: shipment.sack_prefix ?? "",
        route: shipment.route || DEFAULT_ROUTE,
        airline: shipment.airline ?? "",
        number: shipment.number ?? "",
        airport_origin: shipment.airport_origin ?? "",
        airport_dest: shipment.airport_dest ?? "",
        cargo_agency: shipment.cargo_agency ?? "",
        palletizer: shipment.palletizer ?? "",
        open: shipment.open ?? true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [numberSuffix, setNumberSuffix] = useState(initialSuffix);
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
        setSaved(false);
    };

    const handleAirlineChange = (value: string) => {
        setForm((p) => ({ ...p, airline: value }));
        if (value !== shipment.airline) {
            setNumberSuffix("");
        }
        setErrors((p) => ({ ...p, airline: "", number: "" }));
        setSaved(false);
    };

    const handleNumberSuffixChange = (value: string) => {
        const digitsOnly = value.replace(/[^0-9]/g, "");
        setNumberSuffix(digitsOnly);
        setErrors((p) => ({ ...p, number: "" }));
        setSaved(false);
    };

    const withFallback = (options: string[], current: string) =>
        current && !options.includes(current) ? [...options, current] : options;

    const airportOriginOptions = withFallback(
        AIRPORT_ORIGIN_OPTIONS,
        form.airport_origin,
    );
    const airportDestOptions = withFallback(
        AIRPORT_DEST_OPTIONS,
        form.airport_dest,
    );
    const cargoAgencyOptions = withFallback(
        CARGO_AGENCY_OPTIONS,
        form.cargo_agency,
    );
    const palletizerOptions = withFallback(PALLETIZER_OPTIONS, form.palletizer);
    const sackPrefixOptions = withFallback(
        SACK_PREFIX_OPTIONS,
        form.sack_prefix,
    );
    const airlineOptions = withFallback(AIRLINE_OPTIONS, form.airline);

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
        if (isCancelled || !validate()) return;
        setSaving(true);
        try {
            const fullNumber = `${numberPrefix}${numberSuffix}`;
            const res = await fetch(route("shipments.update", shipment.id), {
                method: "PUT",
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
            setSaved(true);
            onUpdated(shipment.id, data.number ?? fullNumber);
        } finally {
            setSaving(false);
        }
    };

    const selCls = isCancelled
        ? `${selectCls} opacity-60 cursor-not-allowed`
        : selectCls;
    const txtCls = isCancelled
        ? `${inputCls} opacity-60 cursor-not-allowed`
        : inputCls;

    return (
        <Modal
            title={`Embarque ${shipment.number}${
                isCancelled ? " (CANCELADO)" : ""
            }`}
            isOpen
            onClose={onClose}
        >
            {isCancelled && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-700 bg-red-950/30 px-4 py-3 text-red-300 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    Este embarque está cancelado y solo puede visualizarse.
                </div>
            )}

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
                                disabled={isCancelled}
                                className={txtCls}
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
                                disabled={isCancelled}
                                className={selCls}
                            >
                                <option value="">Sin prefijo</option>
                                {sackPrefixOptions.map((prefix) => (
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
                                disabled={isCancelled}
                                className={selCls}
                            >
                                {withFallback(ROUTE_OPTIONS, form.route).map(
                                    (r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ),
                                )}
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
                                disabled={isCancelled}
                                className={selCls}
                            >
                                <option value="" disabled>
                                    Selecciona una aerolínea
                                </option>
                                {airlineOptions.map((a) => (
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
                                    disabled={!numberPrefix || isCancelled}
                                    placeholder={
                                        numberPrefix
                                            ? "Ej: 00001"
                                            : "Selecciona una aerolínea primero"
                                    }
                                    className={`flex-1 min-w-0 bg-[#111] text-white text-sm px-3 py-2 focus:outline-none placeholder:text-gray-600 ${
                                        !numberPrefix || isCancelled
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
                                disabled={isCancelled}
                                className={selCls}
                            >
                                <option value="" disabled>
                                    Selecciona un aeropuerto
                                </option>
                                {airportOriginOptions.map((a) => (
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
                                disabled={isCancelled}
                                className={selCls}
                            >
                                <option value="" disabled>
                                    Selecciona un aeropuerto
                                </option>
                                {airportDestOptions.map((a) => (
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
                                disabled={isCancelled}
                                className={selCls}
                            >
                                <option value="">
                                    Selecciona una agencia de carga
                                </option>
                                {cargoAgencyOptions.map((a) => (
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
                                disabled={isCancelled}
                                className={selCls}
                            >
                                <option value="">
                                    Selecciona una paletizadora
                                </option>
                                {palletizerOptions.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </div>

                {!isCancelled && (
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
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-red-900/30">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                        className="border-red-700 text-gray-200 hover:bg-red-700"
                    >
                        {isCancelled ? "Cerrar" : "Cancelar"}
                    </Button>
                    {!isCancelled && (
                        <Button
                            onClick={handleSubmit}
                            disabled={saving || saved}
                            className={`font-semibold ${
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
                                "Guardando..."
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Pencil className="h-4 w-4" />
                                    Guardar Cambios
                                </span>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
