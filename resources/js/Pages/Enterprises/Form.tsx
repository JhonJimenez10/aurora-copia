import React from "react";
import { useForm } from "@inertiajs/react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Switch } from "@/Components/ui/switch";

interface EnterpriseFormProps {
    enterprise?: {
        id: string;
        ruc: string;
        name: string;
        commercial_name: string;
        matrix_address: string;
        branch_address: string;
        province?: string;
        city?: string;
        accounting: boolean;
        phone: string;
        email: string;
        signature?: string;
        signature_password?: string;
    };
}

interface FormValues {
    [key: string]: any;
    ruc: string;
    name: string;
    commercial_name: string;
    matrix_address: string;
    branch_address: string;
    province: string;
    city: string;
    accounting: boolean;
    phone: string;
    email: string;
    signature: File | null;
    signature_password: string;
}

export default function EnterpriseForm({ enterprise }: EnterpriseFormProps) {
    const { data, setData, post, patch, processing, errors } =
        useForm<FormValues>({
            ruc: enterprise?.ruc || "",
            name: enterprise?.name || "",
            commercial_name: enterprise?.commercial_name || "",
            matrix_address: enterprise?.matrix_address || "",
            branch_address: enterprise?.branch_address || "",
            province: enterprise?.province || "",
            city: enterprise?.city || "",
            accounting: enterprise?.accounting || false,
            phone: enterprise?.phone || "",
            email: enterprise?.email || "",
            signature: null,
            signature_password: enterprise?.signature_password || "",
        });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (enterprise) {
            patch(`/enterprises/${enterprise.id}`);
        } else {
            post("/enterprises");
        }
    };

    return (
        <Card className="bg-black border border-red-700 shadow-xl">
            <CardContent className="p-6 space-y-5 text-sm text-white">
                <form
                    onSubmit={submit}
                    encType="multipart/form-data"
                    className="space-y-4"
                >
                    {/* — Campos básicos — */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: "RUC", name: "ruc" },
                            { label: "Nombre Legal", name: "name" },
                            {
                                label: "Nombre Comercial",
                                name: "commercial_name",
                            },
                            {
                                label: "Dirección Matriz",
                                name: "matrix_address",
                            },
                            {
                                label: "Dirección Sucursal",
                                name: "branch_address",
                            },
                            { label: "Provincia", name: "province" },
                            { label: "Ciudad", name: "city" },
                            { label: "Correo", name: "email" },
                            { label: "Teléfono", name: "phone" },
                        ].map(({ label, name }) => (
                            <div key={name}>
                                <Label className="text-white">{label}</Label>
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
                    </div>

                    {/* — Contabilidad — */}
                    <div className="pt-4 border-t border-red-700">
                        <Label className="text-white">
                            ¿Lleva contabilidad?
                        </Label>
                        <Switch
                            checked={data.accounting}
                            onCheckedChange={(val) =>
                                setData("accounting", val)
                            }
                        />
                        {errors.accounting && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.accounting}
                            </p>
                        )}
                    </div>

                    {/* — Certificado & Contraseña — */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-white">
                                Certificado (.p12)
                            </Label>
                            <Input
                                type="file"
                                onChange={(e) =>
                                    setData(
                                        "signature",
                                        e.target.files?.[0] || null
                                    )
                                }
                                className="bg-[#1b1b1b] text-white border border-red-700"
                            />
                            {enterprise?.signature && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Actual:{" "}
                                    <code>
                                        {enterprise.signature.split("/").pop()}
                                    </code>
                                </p>
                            )}
                            {errors.signature && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.signature}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label className="text-white">
                                Clave del Certificado
                            </Label>
                            <Input
                                type="password"
                                value={data.signature_password}
                                onChange={(e) =>
                                    setData(
                                        "signature_password",
                                        e.target.value
                                    )
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {errors.signature_password && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.signature_password}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* — Botón — */}
                    <div className="pt-4 text-end">
                        <Button
                            type="submit"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6"
                            disabled={processing}
                        >
                            {enterprise
                                ? "Actualizar Empresa"
                                : "Guardar Empresa"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
