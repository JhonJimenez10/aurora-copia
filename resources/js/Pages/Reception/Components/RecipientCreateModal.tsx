"use client";

import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/Components/ui/select";
import axios from "axios";

interface RecipientFormData {
    country: string;
    id_type: string;
    identification: string;
    full_name: string;
    address: string;
    phone: string;
    whatsapp: boolean;
    email: string;
    postal_code: string;
    city: string;
    canton: string;
    state: string;
    blocked: boolean;
    alert: boolean;
    [key: string]: any;
}

interface RecipientCreateModalProps {
    open: boolean;
    // permitimos que onClose sea tanto (open: boolean) => void como el setter de useState
    onClose:
        | ((open: boolean) => void)
        | React.Dispatch<React.SetStateAction<boolean>>;
    onRecipientCreated: (data: RecipientFormData) => void;
    defaultValues?: Partial<RecipientFormData>;
    // <-- nueva prop para recibir datos de la agencia destino
    agencyData?: Partial<{
        postal_code: string;
        city: string;
        canton: string;
        state: string;
        [key: string]: any;
    }>;
}

export default function RecipientCreateModal({
    open,
    onClose,
    onRecipientCreated,
    defaultValues = {},
    agencyData,
}: RecipientCreateModalProps) {
    const base: RecipientFormData = {
        country: "ECUADOR",
        id_type: "CEDULA",
        identification: "",
        full_name: "",
        address: "",
        phone: "",
        whatsapp: false,
        email: "",
        postal_code: "",
        city: "",
        canton: "",
        state: "",
        blocked: false,
        alert: false,
    };
    const { data, setData, post, processing, errors, reset, setError } =
        useForm<RecipientFormData>({ ...base, ...defaultValues });
    useEffect(() => {
        if (open) {
            Object.entries(defaultValues).forEach(([k, v]) =>
                setData(k as keyof RecipientFormData, v as any)
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultValues, open]);
    // Cuando agencyData cambia, setear los campos de dirección en el formulario
    useEffect(() => {
        if (agencyData) {
            // si tu tabla agencies_dest tiene 'canton' cambia la línea siguiente para usarlo
            setData("postal_code", (agencyData.postal_code as string) ?? "");
            setData("city", (agencyData.city as string) ?? "");
            setData(
                "canton",
                (agencyData.canton as string) ??
                    (agencyData.city as string) ??
                    ""
            );
            setData("state", (agencyData.state as string) ?? "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agencyData]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Validar solo si hay algo escrito y el tipo es CEDULA
        if (data.id_type === "CEDULA" && data.identification.trim() !== "") {
            const cedulaRegex = /^\d{10}$/;
            if (!cedulaRegex.test(data.identification)) {
                setError(
                    "identification",
                    "La cédula debe tener exactamente 10 dígitos numéricos."
                );
                return;
            }
        }

        try {
            const response = await axios.post("/recipients-json", data);
            onRecipientCreated(response.data.recipient);
            reset();
            onClose(false);
        } catch (error: any) {
            console.error("Error al guardar el destinatario:", error);

            if (error.response && error.response.status === 422) {
                const responseData = error.response.data;

                if (responseData.message) {
                    setError("identification", responseData.message);
                }

                if (responseData.errors) {
                    for (const field in responseData.errors) {
                        setError(field, responseData.errors[field][0]);
                    }
                }
            } else {
                setError(
                    "identification",
                    "Error inesperado al guardar el destinatario ❌"
                );
            }
        }
    };
    // si agencyData existe y tiene algún campo relevante, bloqueamos los inputs
    const addressDisabled = Boolean(
        agencyData &&
            (agencyData.postal_code ||
                agencyData.city ||
                agencyData.canton ||
                agencyData.state)
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#1e1e2f] text-white border border-purple-700 shadow-xl max-w-2xl p-4 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">
                        Crear Nuevo Destinatario
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-400">
                        Completa los campos para registrar al destinatario.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        {/* Tipo de ID */}
                        <div>
                            <Label className="text-sm">
                                Tipo de identificación
                            </Label>
                            <Select
                                value={data.id_type}
                                onValueChange={(val) => setData("id_type", val)}
                            >
                                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                                    <SelectValue placeholder="Seleccionar tipo de ID" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2a2a3d] text-white">
                                    <SelectItem value="RUC">RUC</SelectItem>
                                    <SelectItem value="CEDULA">
                                        CEDULA
                                    </SelectItem>
                                    <SelectItem value="PASAPORTE">
                                        PASAPORTE
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.id_type && (
                                <p className="text-red-500 text-xs">
                                    {errors.id_type}
                                </p>
                            )}
                        </div>

                        {/* Identificación */}
                        <div>
                            <Label className="text-sm">Identificación</Label>
                            <Input
                                className={`text-sm bg-[#2a2a3d] text-white border ${
                                    errors.identification
                                        ? "border-red-500"
                                        : "border-gray-600"
                                }`}
                                value={data.identification}
                                onChange={(e) =>
                                    setData("identification", e.target.value)
                                }
                            />
                            {errors.identification && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.identification}
                                </p>
                            )}
                        </div>

                        {/* Nombre completo */}
                        <div>
                            <Label className="text-sm">
                                Apellidos y nombres
                            </Label>
                            <Input
                                required
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.full_name}
                                onChange={(e) =>
                                    setData("full_name", e.target.value)
                                }
                            />
                            {errors.full_name && (
                                <p className="text-red-500 text-xs">
                                    {errors.full_name}
                                </p>
                            )}
                        </div>

                        {/* País */}
                        {/* País (nativo, requerido) */}
                        <div>
                            <Label className="text-sm">País</Label>
                            <select
                                required
                                className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600 rounded-md h-9 px-3"
                                value={data.country}
                                onChange={(e) =>
                                    setData("country", e.target.value)
                                }
                            >
                                <option value="">Seleccionar país</option>
                                <option value="ESTADOS UNIDOS">
                                    ESTADOS UNIDOS
                                </option>
                                {/* agrega más si quieres */}
                            </select>
                            {errors.country && (
                                <p className="text-red-500 text-xs">
                                    {errors.country}
                                </p>
                            )}
                        </div>

                        {/* Dirección */}
                        <div className="md:col-span-2">
                            <Label className="text-sm">Dirección</Label>
                            <Input
                                required
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.address}
                                onChange={(e) =>
                                    setData("address", e.target.value)
                                }
                            />
                            {errors.address && (
                                <p className="text-red-500 text-xs">
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        {/* Teléfono + WhatsApp */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Label className="text-sm">Celular</Label>
                                <Input
                                    required
                                    className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData("phone", e.target.value)
                                    }
                                />
                                {errors.phone && (
                                    <p className="text-red-500 text-xs">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 pb-1">
                                <input
                                    type="checkbox"
                                    checked={data.whatsapp}
                                    onChange={(e) =>
                                        setData("whatsapp", e.target.checked)
                                    }
                                    className="h-4 w-4"
                                />
                                <Label className="text-sm">WhatsApp</Label>
                            </div>
                        </div>

                        {/* Email + Check */}
                        <div className="md:col-span-2">
                            <Label className="text-sm">
                                Correo electrónico
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    required
                                    type="email"
                                    className="text-sm bg-[#2a2a3d] text-white border border-gray-600 flex-1"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    disabled={
                                        data.email ===
                                        "cliente@auroraexpresss.com"
                                    }
                                />
                                <div className="flex items-center gap-1">
                                    <input
                                        type="checkbox"
                                        checked={
                                            data.email ===
                                            "cliente@auroraexpresss.com"
                                        }
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setData(
                                                    "email",
                                                    "cliente@auroraexpresss.com"
                                                );
                                            } else {
                                                setData("email", "");
                                            }
                                        }}
                                        className="h-4 w-4"
                                    />
                                    <Label className="text-sm">
                                        Usar por defecto
                                    </Label>
                                </div>
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-xs">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Código Postal */}
                        <div>
                            <Label className="text-sm">Código Postal</Label>
                            <Input
                                required
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.postal_code}
                                onChange={(e) =>
                                    setData("postal_code", e.target.value)
                                }
                                disabled={addressDisabled}
                            />
                        </div>

                        {/* Ciudad */}
                        <div>
                            <Label className="text-sm">Parroquia / City</Label>
                            <Input
                                required
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.city}
                                onChange={(e) =>
                                    setData("city", e.target.value)
                                }
                                disabled={addressDisabled}
                            />
                        </div>

                        {/* Cantón */}
                        <div>
                            <Label className="text-sm">Cantón / Country</Label>
                            <Input
                                required
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.canton}
                                onChange={(e) =>
                                    setData("canton", e.target.value)
                                }
                                disabled={addressDisabled}
                            />
                        </div>

                        {/* Provincia */}
                        <div>
                            <Label className="text-sm">Provincia / State</Label>
                            <Input
                                required
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.state}
                                onChange={(e) =>
                                    setData("state", e.target.value)
                                }
                                disabled={addressDisabled}
                            />
                        </div>

                        {/* Bloqueo */}
                        <div>
                            <Label className="text-sm">Bloqueo</Label>
                            <Select
                                value={data.blocked ? "1" : "0"}
                                onValueChange={(val) =>
                                    setData("blocked", val === "1")
                                }
                            >
                                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2a2a3d] text-white">
                                    <SelectItem value="0">
                                        SIN BLOQUEO
                                    </SelectItem>
                                    <SelectItem value="1">BLOQUEADO</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Alerta */}
                        <div>
                            <Label className="text-sm">Alerta</Label>
                            <Select
                                value={data.alert ? "1" : "0"}
                                onValueChange={(val) =>
                                    setData("alert", val === "1")
                                }
                            >
                                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                                    <SelectValue placeholder="Seleccionar alerta" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2a2a3d] text-white">
                                    <SelectItem value="0">
                                        SIN ALERTA
                                    </SelectItem>
                                    <SelectItem value="1">ALERTA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onClose(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
