import { Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/Components/ui/select";
import { useEffect, useState } from "react";
import Pagination from "@/Components/Pagination";
import { useDebouncedValue } from "@/Hooks/useDebouncedValue";

interface User {
    id: string;
    name: string;
    email: string;
    enterprise: { name: string };
    role?: { name: string };
}

interface FilterOption {
    id: string;
    name: string;
}

interface Filters {
    search: string;
    enterprise_id: string;
    role_id: string;
}

export default function UsersIndex({
    users,
    pagination,
    filters,
    enterprises,
    roles,
}: PageProps<{
    users: User[];
    pagination: any;
    filters: Filters;
    enterprises: FilterOption[];
    roles: FilterOption[];
}>) {
    const [search, setSearch] = useState(filters?.search ?? "");
    const [enterpriseId, setEnterpriseId] = useState(
        filters?.enterprise_id ?? "",
    );
    const [roleId, setRoleId] = useState(filters?.role_id ?? "");
    const [loading, setLoading] = useState(false);

    const debouncedSearch = useDebouncedValue(search, 400);

    useEffect(() => {
        setLoading(true);
        router.get(
            "/users",
            {
                search: debouncedSearch || undefined,
                enterprise_id: enterpriseId || undefined,
                role_id: roleId || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, enterpriseId, roleId]);

    const clearFilters = () => {
        setSearch("");
        setEnterpriseId("");
        setRoleId("");
    };

    const hasActiveFilters =
        search !== "" || enterpriseId !== "" || roleId !== "";

    return (
        <AuthenticatedLayout>
            <Head title="Usuarios del Sistema" />

            <div className="container mx-auto px-4 py-8">
                {/* Cabecera visual */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">Usuarios del Sistema</h1>
                    <p className="text-white text-sm">
                        Gestión de usuarios registrados en la plataforma
                    </p>
                </div>

                {/* Contenedor */}
                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex justify-end mb-4">
                        <Link href="/users/create">
                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                                + Nuevo Usuario
                            </Button>
                        </Link>
                    </div>

                    {/* Barra de filtros */}
                    <div className="bg-[#1b1b1b] border border-red-700 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[220px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Buscar (nombre, correo)
                            </label>
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Ej: Juan Pérez o juan@correo.com"
                                className="bg-black border border-red-700 text-white"
                            />
                        </div>

                        <div className="min-w-[200px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Empresa
                            </label>
                            <Select
                                value={enterpriseId || "all"}
                                onValueChange={(val) =>
                                    setEnterpriseId(val === "all" ? "" : val)
                                }
                            >
                                <SelectTrigger className="bg-black border border-red-700 text-white">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    <SelectItem value="all">Todas</SelectItem>
                                    {enterprises.map((ent) => (
                                        <SelectItem key={ent.id} value={ent.id}>
                                            {ent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[180px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Rol
                            </label>
                            <Select
                                value={roleId || "all"}
                                onValueChange={(val) =>
                                    setRoleId(val === "all" ? "" : val)
                                }
                            >
                                <SelectTrigger className="bg-black border border-red-700 text-white">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    <SelectItem value="all">Todos</SelectItem>
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
                        </div>

                        {hasActiveFilters && (
                            <Button
                                type="button"
                                onClick={clearFilters}
                                className="bg-gray-700 hover:bg-gray-600 text-white"
                            >
                                Limpiar filtros
                            </Button>
                        )}

                        {loading && (
                            <span className="text-xs text-gray-400">
                                Buscando...
                            </span>
                        )}
                    </div>

                    {/* Paginación superior */}
                    <Pagination pagination={pagination} />

                    {/* Tabla */}
                    <div className="overflow-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800 text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Email
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Empresa
                                    </th>
                                    <th className="px-4 py-2 text-left">Rol</th>
                                    <th className="px-4 py-2 text-left">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                    >
                                        <td className="px-4 py-2">
                                            {user.name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {user.email}
                                        </td>
                                        <td className="px-4 py-2">
                                            {user.enterprise?.name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {user.role?.name ?? "—"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/users/${user.id}/edit`}
                                                >
                                                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white h-7 px-3 text-xs">
                                                        Editar
                                                    </Button>
                                                </Link>
                                                <Button
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                "¿Estás seguro de que deseas eliminar este usuario?",
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/users/${user.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className="bg-red-600 hover:bg-red-800 text-white h-7 px-3 text-xs"
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!users.length && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-4 text-red-400"
                                        >
                                            {hasActiveFilters
                                                ? "No se encontraron usuarios con esos filtros."
                                                : "No hay usuarios registrados."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación inferior */}
                    <div className="mt-4">
                        <Pagination pagination={pagination} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
