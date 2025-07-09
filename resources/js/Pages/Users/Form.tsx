import { useForm } from "@inertiajs/react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/Components/ui/select";
import { useState } from "react";

interface UserFormData {
    id?: string;
    enterprise_id: string;
    role_id?: string;
    name: string;
    email: string;
    password?: string;
    [key: string]: any;
}

export default function UserForm({
    user,
    enterprises,
    roles,
}: {
    user?: UserFormData;
    enterprises: { id: string; name: string }[];
    roles: { id: string; name: string }[];
}) {
    const {
        data,
        setData,
        post,
        put,
        processing,
        errors: serverErrors,
    } = useForm<UserFormData>({
        enterprise_id: user?.enterprise_id || "",
        role_id: user?.role_id || "",
        name: user?.name || "",
        email: user?.email || "",
        password: "",
    });

    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!data.enterprise_id)
            newErrors.enterprise_id = "La empresa es obligatoria.";
        if (!data.role_id) newErrors.role_id = "El rol es obligatorio.";
        if (!data.name.trim()) newErrors.name = "El nombre es obligatorio.";
        if (!data.email.trim()) {
            newErrors.email = "El correo es obligatorio.";
        } else if (!/\S+@\S+\.\S+/.test(data.email)) {
            newErrors.email = "El correo no es válido.";
        }

        if (!user && !data.password?.trim()) {
            newErrors.password = "La contraseña es obligatoria.";
        }

        setLocalErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        if (user) {
            put(`/users/${user.id}`, { preserveScroll: true });
        } else {
            post("/users", { preserveScroll: true });
        }
    };

    const allErrors = { ...localErrors, ...serverErrors };

    return (
        <Card className="bg-black border border-red-700 shadow-xl">
            <CardContent className="p-6 space-y-5 text-sm text-white">
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Empresa */}
                        <div>
                            <Label>Empresa</Label>
                            <Select
                                value={data.enterprise_id}
                                onValueChange={(val) =>
                                    setData("enterprise_id", val)
                                }
                            >
                                <SelectTrigger className="w-full bg-[#1b1b1b] border border-red-700 text-white">
                                    <SelectValue placeholder="Seleccionar empresa" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    {enterprises.map((ent) => (
                                        <SelectItem key={ent.id} value={ent.id}>
                                            {ent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {allErrors.enterprise_id && (
                                <p className="text-red-500 text-xs mt-1">
                                    {allErrors.enterprise_id}
                                </p>
                            )}
                        </div>

                        {/* Rol */}
                        <div>
                            <Label>Rol</Label>
                            <Select
                                value={data.role_id || ""}
                                onValueChange={(val) => setData("role_id", val)}
                            >
                                <SelectTrigger className="w-full bg-[#1b1b1b] border border-red-700 text-white">
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={role.id}
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {allErrors.role_id && (
                                <p className="text-red-500 text-xs mt-1">
                                    {allErrors.role_id}
                                </p>
                            )}
                        </div>

                        {/* Nombre */}
                        <div>
                            <Label>Nombre</Label>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {allErrors.name && (
                                <p className="text-red-500 text-xs mt-1">
                                    {allErrors.name}
                                </p>
                            )}
                        </div>

                        {/* Correo */}
                        <div>
                            <Label>Correo</Label>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {allErrors.email && (
                                <p className="text-red-500 text-xs mt-1">
                                    {allErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div className="md:col-span-2">
                            <Label>
                                Contraseña{" "}
                                {user && (
                                    <span className="text-sm text-gray-400">
                                        (Dejar en blanco si no se cambia)
                                    </span>
                                )}
                            </Label>
                            <Input
                                type="password"
                                value={data.password || ""}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className="bg-[#1b1b1b] border border-red-700 text-white"
                            />
                            {allErrors.password && (
                                <p className="text-red-500 text-xs mt-1">
                                    {allErrors.password}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Botón */}
                    <div className="pt-4 text-end">
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white px-6"
                            disabled={processing}
                        >
                            {user ? "Actualizar" : "Guardar"} Usuario
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
