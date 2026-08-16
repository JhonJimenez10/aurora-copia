import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/Components/ui/select";
import { useEffect, useState } from "react";
import Pagination from "@/Components/Pagination";
import { useDebouncedValue } from "@/Hooks/useDebouncedValue";

interface AgencyDest {
    id: string;
    name: string;
    code_letters: string;
    trade_name: string;
    city: string;
    state: string;
    phone: string;
    available_us: boolean;
    active: boolean;
}

interface Filters {
    search: string;
    city: string;
    status: string;
    available_us: string;
}

export default function AgencyDestIndex({
    agencies,
    pagination,
    filters,
}: PageProps<{
    agencies: AgencyDest[];
    pagination: any;
    filters: Filters;
}>) {
    const [search, setSearch] = useState(filters?.search ?? "");
    const [city, setCity] = useState(filters?.city ?? "");
    const [status, setStatus] = useState(filters?.status ?? "");
    const [availableUs, setAvailableUs] = useState(filters?.available_us ?? "");
    const [loading, setLoading] = useState(false);

    const debouncedSearch = useDebouncedValue(search, 400);
    const debouncedCity = useDebouncedValue(city, 400);

    useEffect(() => {
        setLoading(true);
        router.get(
            "/agencies_dest",
            {
                search: debouncedSearch || undefined,
                city: debouncedCity || undefined,
                status: status || undefined,
                available_us: availableUs || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, debouncedCity, status, availableUs]);

    const clearFilters = () => {
        setSearch("");
        setCity("");
        setStatus("");
        setAvailableUs("");
    };

    const hasActiveFilters =
        search !== "" || city !== "" || status !== "" || availableUs !== "";

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

                    {/* Barra de filtros */}
                    <div className="bg-[#1b1b1b] border border-red-700 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[220px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Buscar (nombre, código, nombre comercial,
                                teléfono)
                            </label>
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Ej: Miami Cargo o MC"
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
                                placeholder="Ej: Miami"
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
                                    <SelectItem value="active">
                                        Activas
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactivas
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[180px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Disponible en EE.UU.
                            </label>
                            <Select
                                value={availableUs || "all"}
                                onValueChange={(val) =>
                                    setAvailableUs(val === "all" ? "" : val)
                                }
                            >
                                <SelectTrigger className="bg-black border border-red-700 text-white">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="yes">Sí</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
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
                                        Estado
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
                                            {agency.active ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-green-700 bg-green-900/30 text-green-300 text-xs font-medium">
                                                    Activa
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-600 bg-gray-800 text-gray-300 text-xs font-medium">
                                                    Inactiva
                                                </span>
                                            )}
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
                                                                "¿Deseas eliminar esta agencia?",
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/agencies_dest/${agency.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                },
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
                                            colSpan={9}
                                            className="text-center py-4 text-red-400"
                                        >
                                            {hasActiveFilters
                                                ? "No se encontraron agencias con esos filtros."
                                                : "No hay agencias registradas."}
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
