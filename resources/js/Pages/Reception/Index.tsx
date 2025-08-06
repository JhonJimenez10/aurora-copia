import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import Pagination from "@/Components/Pagination";

export default function ReceptionIndex({
    receptions,
    filters,
    pagination,
}: any) {
    const { data, setData, get } = useForm({
        from: filters.from || "",
        to: filters.to || "",
        number: filters.number || "",
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get(route("receptions.index"), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Recepción de Paquetes" />

            <div className="container mx-auto px-4 py-8">
                {/* Encabezado visual */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">Recepciones</h1>
                    <p className="text-white text-sm">
                        Listado de recepciones registradas
                    </p>
                </div>

                {/* Contenido principal */}
                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    {/* Filtros */}
                    <form
                        onSubmit={handleFilter}
                        className="mb-6 flex flex-wrap gap-2 items-end"
                    >
                        <div>
                            <label className="text-white block mb-1 text-xs">
                                Desde
                            </label>
                            <input
                                type="date"
                                value={data.from}
                                onChange={(e) =>
                                    setData("from", e.target.value)
                                }
                                className="bg-white text-black rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-white block mb-1 text-xs">
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={data.to}
                                onChange={(e) => setData("to", e.target.value)}
                                className="bg-white text-black rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-white block mb-1 text-xs">
                                Número
                            </label>
                            <input
                                type="text"
                                placeholder="Número de guía"
                                value={data.number}
                                onChange={(e) =>
                                    setData("number", e.target.value)
                                }
                                className="bg-white text-black rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <Button className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 text-sm">
                            Buscar
                        </Button>
                    </form>
                    {/* Botón de nueva recepción */}
                    <div className="flex justify-end mb-4">
                        <Link href="/receptions/create">
                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                                + Nueva Recepción
                            </Button>
                        </Link>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800 text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Número
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Remitente
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Destinatario
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {receptions.data.map((rec: any) => (
                                    <tr
                                        key={rec.id}
                                        className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                    >
                                        <td className="px-4 py-2">
                                            {rec.number}
                                        </td>
                                        <td className="px-4 py-2">
                                            {rec.sender?.full_name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {rec.recipient?.full_name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {new Date(
                                                rec.date_time
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex gap-2">
                                                <Link
                                                    href={route(
                                                        "receptions.edit",
                                                        rec.id
                                                    )}
                                                >
                                                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white h-7 px-3 text-xs">
                                                        Editar
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!receptions.data.length && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-4 text-red-400"
                                        >
                                            No hay recepciones registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="mt-4">
                        <Pagination pagination={receptions} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
