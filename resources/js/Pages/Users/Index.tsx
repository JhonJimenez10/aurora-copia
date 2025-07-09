import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";

interface User {
    id: string;
    name: string;
    email: string;
    enterprise: { name: string };
    role?: { name: string };
}

export default function UsersIndex({ users }: { users: User[] }) {
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
                                                                "¿Estás seguro de que deseas eliminar este usuario?"
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/users/${user.id}`,
                                                                {
                                                                    preserveScroll:
                                                                        true,
                                                                }
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
                                            No hay usuarios registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
