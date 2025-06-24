import { useForm } from "@inertiajs/react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Switch } from "@/Components/ui/switch";

export default function AgencyDestForm({ agency = null }: { agency?: any }) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: agency?.name || "",
        code_letters: agency?.code_letters || "",
        trade_name: agency?.trade_name || "",
        address: agency?.address || "",
        phone: agency?.phone || "",
        postal_code: agency?.postal_code || "",
        city: agency?.city || "",
        state: agency?.state || "",
        available_us: agency?.available_us || false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (agency) {
            put(`/agencies_dest/${agency.id}`, { preserveScroll: true });
        } else {
            post("/agencies_dest", { preserveScroll: true });
        }
    };

    return (
        <Card className="bg-[#1e1e2f] border border-purple-700 shadow-xl">
            <CardContent className="p-6 space-y-5 text-sm text-white">
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Nombre</Label>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="bg-[#2a2a3d] border-gray-600 text-white"
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Código de Letras</Label>
                            <Input
                                value={data.code_letters}
                                onChange={(e) =>
                                    setData("code_letters", e.target.value)
                                }
                                className="bg-[#2a2a3d] border-gray-600 text-white"
                            />
                            {errors.code_letters && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.code_letters}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Nombre Comercial</Label>
                            <Input
                                value={data.trade_name}
                                onChange={(e) =>
                                    setData("trade_name", e.target.value)
                                }
                                className="bg-[#2a2a3d] border-gray-600 text-white"
                            />
                        </div>

                        <div>
                            <Label>Dirección</Label>
                            <Input
                                value={data.address}
                                onChange={(e) =>
                                    setData("address", e.target.value)
                                }
                                className="bg-[#2a2a3d] border-gray-600 text-white"
                            />
                        </div>

                        <div>
                            <Label>Teléfono</Label>
                            <Input
                                value={data.phone}
                                onChange={(e) =>
                                    setData("phone", e.target.value)
                                }
                                className="bg-[#2a2a3d] border-gray-600 text-white"
                            />
                        </div>

                        <div>
                            <Label>Código Postal</Label>
                            <Input
                                value={data.postal_code}
                                onChange={(e) =>
                                    setData("postal_code", e.target.value)
                                }
                                className="bg-[#2a2a3d] border-gray-600 text-white"
                            />
                        </div>

                        <div>
                            <Label>Ciudad</Label>
                            <Input
                                value={data.city}
                                onChange={(e) =>
                                    setData("city", e.target.value)
                                }
                                className="bg-[#2a2a3d] border-gray-600 text-white"
                            />
                        </div>

                        <div>
                            <Label>Provincia</Label>
                            <Input
                                value={data.state}
                                onChange={(e) =>
                                    setData("state", e.target.value)
                                }
                                className="bg-[#2a2a3d] border-gray-600 text-white"
                            />
                        </div>

                        <div className="pt-4">
                            <Label>Disponible US</Label>
                            <div className="mt-1">
                                <Switch
                                    checked={data.available_us}
                                    onCheckedChange={(val) =>
                                        setData("available_us", val)
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 text-end">
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                            disabled={processing}
                        >
                            {agency ? "Actualizar" : "Guardar"} Agencia
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
