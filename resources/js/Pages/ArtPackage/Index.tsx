import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { useState } from "react";
import { Button } from "@/Components/ui/button";
import Pagination from "@/Components/Pagination";

interface ArtPackage {
    id: string;
    name: string;
    translation: string;
    unit_type: string;
    unit_price: string;
    agent_val: string;
    canceled: boolean;
}

export default function ArtPackagesIndex({
    art_packages,
    pagination,
}: PageProps<{ art_packages: ArtPackage[]; pagination: any }>) {
    const [loading, setLoading] = useState(false);

    return (
        <AuthenticatedLayout>
            <Head title="Artículos por Agencia" />

            <div className="container mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-500 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">
                        Artículos por Agencia
                    </h1>
                    <p className="text-red-100 text-sm">
                        Catálogo de artículos utilizados por cada agencia
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex justify-end mb-4">
                        <Link href="/art_packages/create">
                            <Button className="bg-green-600 hover:bg-green-700">
                                + Nuevo Artículo
                            </Button>
                        </Link>
                    </div>

                    <Pagination pagination={pagination} />

                    <div className="overflow-x-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Traducción
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Unidad
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Precio Unidad
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Valor Agencia
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
                                {art_packages.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                    >
                                        <td className="px-4 py-2">
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.translation}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.unit_type}
                                        </td>
                                        <td className="px-4 py-2">
                                            ${item.unit_price}
                                        </td>
                                        <td className="px-4 py-2">
                                            ${item.agent_val}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.canceled ? "Sí" : "No"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/art_packages/${item.id}/edit`}
                                                >
                                                    <Button className="bg-red-600 hover:bg-red-700 text-white h-7 px-3 text-xs">
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
                                                                `/art_packages/${item.id}`,
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
                                {!art_packages.length && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-4 text-slate-400"
                                        >
                                            No hay artículos registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4">
                        <Pagination pagination={pagination} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
