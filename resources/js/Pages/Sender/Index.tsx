import { Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import Pagination from "@/Components/Pagination";

interface Sender {
    id: string;
    full_name: string;
    identification: string;
    email: string;
    phone: string;
    address: string;
    city: string;
}

export default function SendersIndex({
    senders,
    pagination,
}: PageProps<{ senders: Sender[]; pagination: any }>) {
    return (
        <AuthenticatedLayout>
            <Head title="Clientes Envío" />

            <div className="container mx-auto px-4 py-8">
                {/* Header con degradado */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">Clientes Envío</h1>
                    <p className="text-purple-100 text-sm">
                        Gestión de remitentes registrados
                    </p>
                </div>

                {/* Cuerpo principal */}
                <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex justify-end mb-4">
                        <Link href="/senders/create">
                            <Button className="bg-green-600 hover:bg-green-700">
                                + Nuevo Cliente
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
                                {senders.map((sender) => (
                                    <tr
                                        key={sender.id}
                                        className="border-t border-slate-700 hover:bg-slate-800"
                                    >
                                        <td className="px-4 py-2">
                                            {sender.full_name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {sender.identification}
                                        </td>
                                        <td className="px-4 py-2">
                                            {sender.email}
                                        </td>
                                        <td className="px-4 py-2">
                                            {sender.phone}
                                        </td>
                                        <td className="px-4 py-2">
                                            {sender.city}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/senders/${sender.id}/edit`}
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
                                                                `/senders/${sender.id}`,
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
                                {!senders.length && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-4 text-slate-400"
                                        >
                                            No hay remitentes registrados.
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
