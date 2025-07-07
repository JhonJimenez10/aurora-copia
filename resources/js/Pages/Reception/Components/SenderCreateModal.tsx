"use client";

import React from "react";
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

interface SenderCreateModalProps {
    open: boolean;
    onClose: (open: boolean) => void;
    onSenderCreated: (senderData: any) => void;
}

interface SenderFormData {
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

export default function SenderCreateModal({
    open,
    onClose,
    onSenderCreated,
}: SenderCreateModalProps) {
    const { data, setData, post, processing, errors, reset, setError } =
        useForm<SenderFormData>({
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
        });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Validación previa de formato
        if (data.id_type === "CEDULA") {
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
            const response = await axios.post("/senders-json", data);
            onSenderCreated(response.data.sender);
            reset();
            onClose(false);
        } catch (error: any) {
            if (error.response && error.response.status === 422) {
                const responseData = error.response.data;

                // ✅ Error personalizado desde el backend
                if (responseData.message) {
                    setError("identification", responseData.message);
                }

                // ✅ Errores de validación Laravel
                if (responseData.errors) {
                    for (const field in responseData.errors) {
                        setError(field, responseData.errors[field][0]);
                    }
                }
            } else {
                setError(
                    "identification",
                    "Error inesperado al guardar el remitente ❌"
                );
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#1e1e2f] text-white border border-purple-700 shadow-xl max-w-2xl p-4 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">
                        CREAR NUEVO REMITENTE
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-400">
                        Complete los campos a continuación para crear un nuevo
                        remitente.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        {/* ID Type */}
                        <div>
                            <Label className="text-sm">
                                Tipo de identificación
                            </Label>
                            <Select
                                value={data.id_type}
                                onValueChange={(val) => setData("id_type", val)}
                            >
                                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                                    <SelectValue placeholder="Select ID Type" />
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

                        {/* Identification */}
                        <div>
                            <Label className="text-sm">Identificación</Label>
                            <Input
                                className={`text-sm bg-[#2a2a3d] text-white border ${
                                    errors.identification
                                        ? "border-red-500"
                                        : "border-gray-600"
                                } placeholder:text-gray-400`}
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

                        {/* Full Name */}
                        <div>
                            <Label className="text-sm">
                                Apellidos y nombres
                            </Label>
                            <Input
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

                        {/* Country */}
                        <div>
                            <Label className="text-sm">País</Label>
                            <Select
                                value={data.country}
                                onValueChange={(val) => setData("country", val)}
                            >
                                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                                    <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2a2a3d] text-white">
                                    <SelectItem value="ECUADOR">
                                        ECUADOR
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.country && (
                                <p className="text-red-500 text-xs">
                                    {errors.country}
                                </p>
                            )}
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <Label className="text-sm">Dirección</Label>
                            <Input
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

                        {/* Phone and WhatsApp */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Label className="text-sm">Celular</Label>
                                <Input
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

                        {/* Email */}
                        <div>
                            <Label className="text-sm">
                                Correo electrónico
                            </Label>
                            <Input
                                type="email"
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Postal Code */}
                        <div>
                            <Label className="text-sm">Código postal</Label>
                            <Input
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.postal_code}
                                onChange={(e) =>
                                    setData("postal_code", e.target.value)
                                }
                            />
                            {errors.postal_code && (
                                <p className="text-red-500 text-xs">
                                    {errors.postal_code}
                                </p>
                            )}
                        </div>

                        {/* City */}
                        <div>
                            <Label className="text-sm">Parroquia / City</Label>
                            <Input
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.city}
                                onChange={(e) =>
                                    setData("city", e.target.value)
                                }
                            />
                            {errors.city && (
                                <p className="text-red-500 text-xs">
                                    {errors.city}
                                </p>
                            )}
                        </div>

                        {/* Canton */}
                        <div>
                            <Label className="text-sm">Cantón / Country</Label>
                            <Input
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.canton}
                                onChange={(e) =>
                                    setData("canton", e.target.value)
                                }
                            />
                            {errors.canton && (
                                <p className="text-red-500 text-xs">
                                    {errors.canton}
                                </p>
                            )}
                        </div>

                        {/* State */}
                        <div>
                            <Label className="text-sm">Provincia / State</Label>
                            <Input
                                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                                value={data.state}
                                onChange={(e) =>
                                    setData("state", e.target.value)
                                }
                            />
                            {errors.state && (
                                <p className="text-red-500 text-xs">
                                    {errors.state}
                                </p>
                            )}
                        </div>

                        {/* Blocked */}
                        <div>
                            <Label className="text-sm">Bloqueo</Label>
                            <Select
                                value={data.blocked ? "1" : "0"}
                                onValueChange={(val) =>
                                    setData("blocked", val === "1")
                                }
                            >
                                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2a2a3d] text-white">
                                    <SelectItem value="0">
                                        SIN BLOQUEO
                                    </SelectItem>
                                    <SelectItem value="1">BLOQUEADO</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Alert */}
                        <div>
                            <Label className="text-sm">Alerta</Label>
                            <Select
                                value={data.alert ? "1" : "0"}
                                onValueChange={(val) =>
                                    setData("alert", val === "1")
                                }
                            >
                                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                                    <SelectValue placeholder="Select alert" />
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
