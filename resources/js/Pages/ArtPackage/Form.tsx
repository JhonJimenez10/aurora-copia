import { useForm } from "@inertiajs/react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Switch } from "@/Components/ui/switch";

export default function ArtPackageForm({
    art_package = null,
}: {
    art_package?: any;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: art_package?.name || "",
        translation: art_package?.translation || "",
        codigo_hs: art_package?.codigo_hs || "",
        unit_type: art_package?.unit_type || "",
        unit_price: art_package?.unit_price || "",
        agent_val: art_package?.agent_val || "",
        arancel: art_package?.arancel || "",
        canceled: art_package?.canceled || false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (art_package) {
            put(`/art_packages/${art_package.id}`, { preserveScroll: true });
        } else {
            post("/art_packages", { preserveScroll: true });
        }
    };

    return (
        <Card className="bg-black border border-red-700 shadow-xl">
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
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Traducción</Label>
                            <Input
                                value={data.translation}
                                onChange={(e) =>
                                    setData("translation", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                        </div>
                        <div>
                            <Label>Código HS</Label>
                            <Input
                                value={data.codigo_hs}
                                onChange={(e) =>
                                    setData("codigo_hs", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.codigo_hs && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.codigo_hs}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Tipo de Unidad</Label>
                            <Input
                                value={data.unit_type}
                                onChange={(e) =>
                                    setData("unit_type", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                        </div>

                        <div>
                            <Label>Precio por Unidad</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={data.unit_price}
                                onChange={(e) =>
                                    setData("unit_price", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                        </div>

                        <div>
                            <Label>Valor Agencia</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={data.agent_val}
                                onChange={(e) =>
                                    setData("agent_val", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                        </div>
                        <div>
                            <Label>Arancel</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={data.arancel}
                                onChange={(e) =>
                                    setData("arancel", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.arancel && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.arancel}
                                </p>
                            )}
                        </div>

                        <div className="pt-4">
                            <Label>Anulado por Agencia</Label>
                            <div className="mt-1">
                                <Switch
                                    checked={data.canceled}
                                    onCheckedChange={(val) =>
                                        setData("canceled", val)
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 text-end">
                        <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6"
                            disabled={processing}
                        >
                            {art_package ? "Actualizar" : "Guardar"} Artículo
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
