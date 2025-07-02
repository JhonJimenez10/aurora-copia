import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { useState } from "react";
import { Button } from "@/Components/ui/button";
import Pagination from "@/Components/Pagination";

interface Recipient {
    id: string;
    full_name: string;
    identification: string;
    email: string;
    phone: string;
    city: string;
    canton: string;
}

export default function RecipientsIndex({
    recipients,
    pagination,
}: PageProps<{ recipients: Recipient[]; pagination: any }>) {
    const [loading, setLoading] = useState(false);

    return (
        <AuthenticatedLayout>
            <Head title="Destinatarios" />

            <div className="container mx-auto px-4 py-8">
                {/* Encabezado visual */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">
                        Clientes Destinatario
                    </h1>
                    <p className="text-purple-100 text-sm">
                        Gestión de destinatarios registrados
                    </p>
                </div>

                {/* Contenido principal */}
                <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex justify-end mb-4">
                        <Link href="/recipients/create">
                            <Button className="bg-green-600 hover:bg-green-700">
                                + Nuevo Destinatario
                            </Button>
                        </Link>
                    </div>

                    {/* Paginación superior */}
                    <Pagination pagination={pagination} />

                    <div className="overflow-x-auto rounded-lg border border-slate-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-purpleDark text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Nombre Completo
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Identificación
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Correo
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Teléfono
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Ciudad
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipients.map((recipient) => (
                                    <tr
                                        key={recipient.id}
                                        className="border-t border-slate-700 hover:bg-slate-800"
                                    >
                                        <td className="px-4 py-2">
                                            {recipient.full_name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {recipient.identification}
                                        </td>
                                        <td className="px-4 py-2">
                                            {recipient.email}
                                        </td>
                                        <td className="px-4 py-2">
                                            {recipient.phone}
                                        </td>
                                        <td className="px-4 py-2">
                                            {recipient.city}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/recipients/${recipient.id}/edit`}
                                                >
                                                    <Button className="bg-purpleLight hover:bg-purpleDark text-white h-7 px-3 text-xs">
                                                        Editar
                                                    </Button>
                                                </Link>
                                                <Button
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                "¿Estás seguro de que deseas eliminar este destinatario?"
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/recipients/${recipient.id}`,
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
                                {!recipients.length && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-4 text-slate-400"
                                        >
                                            No hay destinatarios registrados.
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
