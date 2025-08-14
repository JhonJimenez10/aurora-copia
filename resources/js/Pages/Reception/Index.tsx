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

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString("es-EC", {
            day: "numeric",
            month: "numeric",
            year: "numeric",
        });

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

                    {/* Tabla (centrada) */}
                    <div className="overflow-x-auto rounded-lg border border-red-700">
                        <table className="w-full table-fixed text-sm text-white">
                            {/* Anchos fijos por columna para alineación perfecta */}
                            <colgroup>
                                <col className="w-[26%]" /> {/* Número */}
                                <col className="w-[26%]" /> {/* Remitente */}
                                <col className="w-[26%]" /> {/* Destinatario */}
                                <col className="w-[12%]" /> {/* Fecha */}
                                <col className="w-[10%]" /> {/* Acciones */}
                            </colgroup>

                            <thead className="bg-red-800 text-white">
                                <tr className="text-center">
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Número
                                    </th>
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Remitente
                                    </th>
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Destinatario
                                    </th>
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 font-semibold tracking-wide uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-red-700">
                                {receptions.data.map((rec: any) => (
                                    <tr
                                        key={rec.id}
                                        title={
                                            rec.annulled
                                                ? "Recepción anulada"
                                                : undefined
                                        }
                                        className={`text-center align-middle hover:bg-[#1b1b1b] ${
                                            rec.annulled
                                                ? "bg-red-900/20 border-l-4 border-l-red-600 text-red-100/90"
                                                : ""
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <span>{rec.number}</span>
                                                {rec.annulled && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-700/30 border border-red-600 text-red-200">
                                                        ANULADA
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {rec.sender?.full_name}
                                        </td>
                                        <td className="px-4 py-3">
                                            {rec.recipient?.full_name}
                                        </td>
                                        <td className="px-4 py-3">
                                            {fmtDate(rec.date_time)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center">
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
                                            className="text-center py-5 text-red-400"
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
