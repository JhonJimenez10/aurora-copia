import { useForm } from "@inertiajs/react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/Components/ui/select";
import { Card, CardContent } from "@/Components/ui/card";

export default function RecipientForm({
    recipient = null,
}: {
    recipient?: any;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        country: recipient?.country || "",
        id_type: recipient?.id_type || "",
        identification: recipient?.identification || "",
        full_name: recipient?.full_name || "",
        address: recipient?.address || "",
        phone: recipient?.phone || "",
        whatsapp: recipient?.whatsapp ?? false,
        email: recipient?.email || "",
        postal_code: recipient?.postal_code || "",
        city: recipient?.city || "",
        canton: recipient?.canton || "",
        state: recipient?.state || "",
        blocked: recipient?.blocked ?? false,
        alert: recipient?.alert ?? false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (recipient) {
            put(`/recipients/${recipient.id}`, { preserveScroll: true });
        } else {
            post("/recipients", { preserveScroll: true });
        }
    };

    return (
        <Card className="bg-black border border-red-700 shadow-xl">
            <CardContent className="p-6 text-white text-sm">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>País</Label>
                            <Input
                                value={data.country}
                                onChange={(e) =>
                                    setData("country", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.country && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.country}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Tipo de Identificación</Label>
                            <Input
                                value={data.id_type}
                                onChange={(e) =>
                                    setData("id_type", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.id_type && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.id_type}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Identificación</Label>
                            <Input
                                value={data.identification}
                                onChange={(e) =>
                                    setData("identification", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.identification && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.identification}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Nombre Completo</Label>
                            <Input
                                value={data.full_name}
                                onChange={(e) =>
                                    setData("full_name", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.full_name && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.full_name}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <Label>Dirección</Label>
                            <Textarea
                                value={data.address}
                                onChange={(e) =>
                                    setData("address", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.address && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Teléfono</Label>
                            <Input
                                value={data.phone}
                                onChange={(e) =>
                                    setData("phone", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.phone && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>¿Tiene WhatsApp?</Label>
                            <Select
                                value={data.whatsapp ? "true" : "false"}
                                onValueChange={(val) =>
                                    setData("whatsapp", val === "true")
                                }
                            >
                                <SelectTrigger className="bg-[#1b1b1b] border border-red-700 text-white">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    <SelectItem value="true">Sí</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Correo</Label>
                            <Input
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Código Postal</Label>
                            <Input
                                value={data.postal_code}
                                onChange={(e) =>
                                    setData("postal_code", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                        </div>

                        <div>
                            <Label>Ciudad</Label>
                            <Input
                                value={data.city}
                                onChange={(e) =>
                                    setData("city", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                        </div>

                        <div>
                            <Label>Cantón</Label>
                            <Input
                                value={data.canton}
                                onChange={(e) =>
                                    setData("canton", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                        </div>

                        <div>
                            <Label>Provincia</Label>
                            <Input
                                value={data.state}
                                onChange={(e) =>
                                    setData("state", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                        </div>

                        <div>
                            <Label>¿Bloqueado?</Label>
                            <Select
                                value={data.blocked ? "true" : "false"}
                                onValueChange={(val) =>
                                    setData("blocked", val === "true")
                                }
                            >
                                <SelectTrigger className="bg-[#1b1b1b] border border-red-700 text-white">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    <SelectItem value="false">
                                        Sin Bloqueo
                                    </SelectItem>
                                    <SelectItem value="true">
                                        Con Bloqueo
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>¿Alerta?</Label>
                            <Select
                                value={data.alert ? "true" : "false"}
                                onValueChange={(val) =>
                                    setData("alert", val === "true")
                                }
                            >
                                <SelectTrigger className="bg-[#1b1b1b] border border-red-700 text-white">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    <SelectItem value="false">
                                        Sin Alerta
                                    </SelectItem>
                                    <SelectItem value="true">
                                        Con Alerta
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="text-right pt-4 border-t border-red-700">
                        <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6"
                            disabled={processing}
                        >
                            {recipient ? "Actualizar" : "Guardar"} Destinatario
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
