import { Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";

interface Enterprise {
    id: string;
    name: string;
    ruc: string;
    email: string;
    commercial_name: string;
    matrix_address: string;
}

export default function EnterprisesIndex({
    enterprises,
}: PageProps<{ enterprises: Enterprise[] }>) {
    return (
        <AuthenticatedLayout>
            <Head title="Empresas" />

            <div className="container mx-auto px-4 py-8">
                {/* Cabecera visual */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">Empresas Registradas</h1>
                    <p className="text-white text-sm">
                        Gestión de empresas activas en el sistema
                    </p>
                </div>

                {/* Contenedor tabla */}
                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex justify-end mb-4">
                        <Link href="/enterprises/create">
                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                                + Nueva Empresa
                            </Button>
                        </Link>
                    </div>

                    <div className="overflow-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800 text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Nombre Comercial
                                    </th>
                                    <th className="px-4 py-2 text-left">RUC</th>
                                    <th className="px-4 py-2 text-left">
                                        Correo
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Dirección
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {enterprises.map((enterprise) => (
                                    <tr
                                        key={enterprise.id}
                                        className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                    >
                                        <td
                                            className="px-4 py-2 max-w-[200px] truncate"
                                            title={enterprise.commercial_name}
                                        >
                                            {enterprise.commercial_name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {enterprise.ruc}
                                        </td>
                                        <td className="px-4 py-2">
                                            {enterprise.email}
                                        </td>
                                        <td
                                            className="px-4 py-2 max-w-[200px] truncate"
                                            title={enterprise.matrix_address}
                                        >
                                            {enterprise.matrix_address}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/enterprises/${enterprise.id}/edit`}
                                                >
                                                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white h-7 px-3 text-xs">
                                                        Editar
                                                    </Button>
                                                </Link>
                                                <Button
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                "¿Estás seguro de que deseas eliminar esta empresa?"
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/enterprises/${enterprise.id}`,
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
                                {!enterprises.length && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-4 text-red-400"
                                        >
                                            No hay empresas registradas.
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
