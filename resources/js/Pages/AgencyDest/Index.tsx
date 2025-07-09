import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Button } from "@/Components/ui/button";
import { useState } from "react";
import Pagination from "@/Components/Pagination";

interface AgencyDest {
    id: string;
    name: string;
    code_letters: string;
    trade_name: string;
    city: string;
    state: string;
    phone: string;
    available_us: boolean;
}

export default function AgencyDestIndex({
    agencies,
    pagination,
}: PageProps<{ agencies: AgencyDest[]; pagination: any }>) {
    const [loading, setLoading] = useState(false);

    return (
        <AuthenticatedLayout>
            <Head title="Agencias Destino" />

            <div className="container mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">Agencias Destino</h1>
                    <p className="text-white text-sm">
                        Listado de agencias destino registradas
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex justify-end mb-4">
                        <Link href="/agencies_dest/create">
                            <Button className="bg-green-600 hover:bg-green-700">
                                + Nueva Agencia
                            </Button>
                        </Link>
                    </div>

                    {/* Paginación superior */}
                    <Pagination pagination={pagination} />

                    <div className="overflow-x-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800 text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Código
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Nombre Comercial
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Ciudad
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Provincia
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Teléfono
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Disponible US
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {agencies.map((agency) => (
                                    <tr
                                        key={agency.id}
                                        className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                    >
                                        <td className="px-4 py-2">
                                            {agency.name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {agency.code_letters}
                                        </td>
                                        <td className="px-4 py-2">
                                            {agency.trade_name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {agency.city}
                                        </td>
                                        <td className="px-4 py-2">
                                            {agency.state}
                                        </td>
                                        <td className="px-4 py-2">
                                            {agency.phone}
                                        </td>
                                        <td className="px-4 py-2">
                                            {agency.available_us ? "Sí" : "No"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/agencies_dest/${agency.id}/edit`}
                                                >
                                                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white h-7 px-3 text-xs">
                                                        Editar
                                                    </Button>
                                                </Link>
                                                <Button
                                                    className="bg-red-600 hover:bg-red-800 text-white h-7 px-3 text-xs"
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                "¿Deseas eliminar esta agencia?"
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/agencies_dest/${agency.id}`,
                                                                {
                                                                    preserveScroll:
                                                                        true,
                                                                }
                                                            );
                                                        }
                                                    }}
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!agencies.length && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="text-center py-4 text-red-400"
                                        >
                                            No hay agencias registradas.
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
