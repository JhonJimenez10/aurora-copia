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

type SenderFields =
    | "country"
    | "id_type"
    | "identification"
    | "full_name"
    | "address"
    | "phone"
    | "whatsapp"
    | "email"
    | "postal_code"
    | "city"
    | "canton"
    | "state"
    | "blocked"
    | "alert";

export default function SenderForm({ sender = null }: { sender?: any }) {
    const { data, setData, post, put, processing, errors } = useForm<
        Record<SenderFields, any>
    >({
        country: sender?.country || "",
        id_type: sender?.id_type || "",
        identification: sender?.identification || "",
        full_name: sender?.full_name || "",
        address: sender?.address || "",
        phone: sender?.phone || "",
        whatsapp: sender?.whatsapp ?? false,
        email: sender?.email || "",
        postal_code: sender?.postal_code || "",
        city: sender?.city || "",
        canton: sender?.canton || "",
        state: sender?.state || "",
        blocked: sender?.blocked ?? false,
        alert: sender?.alert ?? false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (sender) {
            put(`/senders/${sender.id}`, { preserveScroll: true });
        } else {
            post("/senders", { preserveScroll: true });
        }
    };

    return (
        <Card className="bg-black border border-red-700 shadow-xl">
            <CardContent className="p-6 text-white text-sm">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(
                            [
                                { label: "País", name: "country" },
                                {
                                    label: "Tipo de Identificación",
                                    name: "id_type",
                                },
                                {
                                    label: "Identificación",
                                    name: "identification",
                                },
                                { label: "Nombre Completo", name: "full_name" },
                                { label: "Teléfono", name: "phone" },
                                { label: "Correo", name: "email" },
                                { label: "Código Postal", name: "postal_code" },
                                { label: "Ciudad", name: "city" },
                                { label: "Cantón", name: "canton" },
                                { label: "Provincia", name: "state" },
                            ] as { label: string; name: SenderFields }[]
                        ).map(({ label, name }) => (
                            <div key={name}>
                                <Label>{label}</Label>
                                <Input
                                    value={data[name]}
                                    onChange={(e) =>
                                        setData(name, e.target.value)
                                    }
                                    className="bg-[#1b1b1b] border border-red-700 text-white"
                                />
                                {errors[name] && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors[name]}
                                    </p>
                                )}
                            </div>
                        ))}

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

                        {(
                            [
                                { label: "¿Tiene WhatsApp?", name: "whatsapp" },
                                { label: "¿Bloqueado?", name: "blocked" },
                                { label: "¿Alerta?", name: "alert" },
                            ] as { label: string; name: SenderFields }[]
                        ).map(({ label, name }) => (
                            <div key={name}>
                                <Label>{label}</Label>
                                <Select
                                    value={String(data[name])}
                                    onValueChange={(val) =>
                                        setData(name, val === "true")
                                    }
                                >
                                    <SelectTrigger className="bg-[#1b1b1b] border border-red-700 text-white">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                        <SelectItem value="true">Sí</SelectItem>
                                        <SelectItem value="false">
                                            No
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>

                    <div className="text-right pt-4 border-t border-red-700">
                        <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6"
                            disabled={processing}
                        >
                            {sender
                                ? "Actualizar Remitente"
                                : "Guardar Remitente"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
