import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { useEffect, useState } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/Components/ui/select";
import Pagination from "@/Components/Pagination";
import { useDebouncedValue } from "@/Hooks/useDebouncedValue";

interface Recipient {
    id: string;
    full_name: string;
    identification: string;
    email: string;
    phone: string;
    city: string;
    canton: string;
}

interface Filters {
    search: string;
    city: string;
    status: string; // '', 'blocked', 'alert'
}

export default function RecipientsIndex({
    recipients,
    pagination,
    filters,
}: PageProps<{
    recipients: Recipient[];
    pagination: any;
    filters: Filters;
}>) {
    const [search, setSearch] = useState(filters?.search ?? "");
    const [city, setCity] = useState(filters?.city ?? "");
    const [status, setStatus] = useState(filters?.status ?? "");
    const [loading, setLoading] = useState(false);

    const debouncedSearch = useDebouncedValue(search, 400);
    const debouncedCity = useDebouncedValue(city, 400);

    // Evita disparar la primera petición con los mismos valores iniciales
    const isFirstRun = useState(true);

    useEffect(() => {
        setLoading(true);
        router.get(
            "/recipients",
            {
                search: debouncedSearch || undefined,
                city: debouncedCity || undefined,
                status: status || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, debouncedCity, status]);

    const clearFilters = () => {
        setSearch("");
        setCity("");
        setStatus("");
    };

    const hasActiveFilters = search !== "" || city !== "" || status !== "";

    return (
        <AuthenticatedLayout>
            <Head title="Destinatarios" />

            <div className="container mx-auto px-4 py-8">
                {/* Encabezado visual */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">
                        Clientes Destinatario
                    </h1>
                    <p className="text-white text-sm">
                        Gestión de destinatarios registrados
                    </p>
                </div>

                {/* Contenido principal */}
                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex justify-end mb-4">
                        <Link href="/recipients/create">
                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                                + Nuevo Destinatario
                            </Button>
                        </Link>
                    </div>

                    {/* Barra de filtros */}
                    <div className="bg-[#1b1b1b] border border-red-700 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[220px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Buscar (nombre, cédula, correo, teléfono)
                            </label>
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Ej: Juan Pérez o 0102030405"
                                className="bg-black border border-red-700 text-white"
                            />
                        </div>

                        <div className="min-w-[180px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Ciudad
                            </label>
                            <Input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ej: Cuenca"
                                className="bg-black border border-red-700 text-white"
                            />
                        </div>

                        <div className="min-w-[180px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Estado
                            </label>
                            <Select
                                value={status || "all"}
                                onValueChange={(val) =>
                                    setStatus(val === "all" ? "" : val)
                                }
                            >
                                <SelectTrigger className="bg-black border border-red-700 text-white">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="blocked">
                                        Bloqueados
                                    </SelectItem>
                                    <SelectItem value="alert">
                                        Con alerta
                                    </SelectItem>
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

                    <div className="overflow-x-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800 text-white">
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
                                        className="border-t border-red-700 hover:bg-[#1b1b1b]"
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
                                                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white h-7 px-3 text-xs">
                                                        Editar
                                                    </Button>
                                                </Link>
                                                <Button
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                "¿Estás seguro de que deseas eliminar este destinatario?",
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/recipients/${recipient.id}`,
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
                                {!recipients.length && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-4 text-red-400"
                                        >
                                            {hasActiveFilters
                                                ? "No se encontraron destinatarios con esos filtros."
                                                : "No hay destinatarios registrados."}
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
