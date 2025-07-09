import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { useState } from "react";
import { Button } from "@/Components/ui/button";
import Pagination from "@/Components/Pagination";

interface ArtPackg {
    id: string;
    name: string;
    unit_type: string;
    unit_price: string;
    canceled: boolean;
}

export default function ArtPackgIndex({
    artPackgs,
    pagination,
}: PageProps<{ artPackgs: ArtPackg[]; pagination: any }>) {
    const [loading, setLoading] = useState(false);

    return (
        <AuthenticatedLayout>
            <Head title="Artículos de Embalaje" />

            <div className="container mx-auto px-4 py-8">
                {/* Cabecera visual */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">
                        Artículos de Embalaje
                    </h1>
                    <p className="text-white text-sm">
                        Listado de artículos utilizados para embalar paquetes
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    {/* Botón crear */}
                    <div className="flex justify-end mb-4">
                        <Link href="/art_packgs/create">
                            <Button className="bg-green-600 hover:bg-green-700">
                                + Nuevo Artículo
                            </Button>
                        </Link>
                    </div>

                    {/* Paginación superior */}
                    <Pagination pagination={pagination} />

                    {/* Tabla */}
                    <div className="overflow-x-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800 text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Tipo de Unidad
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Precio
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Anulado
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {artPackgs.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                    >
                                        <td className="px-4 py-2">
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.unit_type}
                                        </td>
                                        <td className="px-4 py-2">
                                            ${item.unit_price}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.canceled ? "Sí" : "No"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/art_packgs/${item.id}/edit`}
                                                >
                                                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white h-7 px-3 text-xs">
                                                        Editar
                                                    </Button>
                                                </Link>
                                                <Button
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                "¿Estás seguro de que deseas eliminar este artículo?"
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/art_packgs/${item.id}`,
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
                                {!artPackgs.length && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-4 text-red-400"
                                        >
                                            No hay artículos registrados.
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
