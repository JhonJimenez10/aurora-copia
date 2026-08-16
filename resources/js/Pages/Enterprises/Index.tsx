import { Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { useEffect, useState } from "react";
import Pagination from "@/Components/Pagination";
import { useDebouncedValue } from "@/Hooks/useDebouncedValue";

interface Enterprise {
    id: string;
    name: string;
    ruc: string;
    email: string;
    commercial_name: string;
    matrix_address: string;
    province?: string;
    city?: string;
}

interface Filters {
    search: string;
    province: string;
    city: string;
}

export default function EnterprisesIndex({
    enterprises,
    pagination,
    filters,
}: PageProps<{
    enterprises: Enterprise[];
    pagination: any;
    filters: Filters;
}>) {
    const [search, setSearch] = useState(filters?.search ?? "");
    const [province, setProvince] = useState(filters?.province ?? "");
    const [city, setCity] = useState(filters?.city ?? "");
    const [loading, setLoading] = useState(false);

    const debouncedSearch = useDebouncedValue(search, 400);
    const debouncedProvince = useDebouncedValue(province, 400);
    const debouncedCity = useDebouncedValue(city, 400);

    useEffect(() => {
        setLoading(true);
        router.get(
            "/enterprises",
            {
                search: debouncedSearch || undefined,
                province: debouncedProvince || undefined,
                city: debouncedCity || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, debouncedProvince, debouncedCity]);

    const clearFilters = () => {
        setSearch("");
        setProvince("");
        setCity("");
    };

    const hasActiveFilters = search !== "" || province !== "" || city !== "";

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

                    {/* Barra de filtros */}
                    <div className="bg-[#1b1b1b] border border-red-700 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[220px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Buscar (RUC, nombre, nombre comercial, correo)
                            </label>
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Ej: 0190123456001 o Cuencanito Express"
                                className="bg-black border border-red-700 text-white"
                            />
                        </div>

                        <div className="min-w-[180px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Provincia
                            </label>
                            <Input
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                placeholder="Ej: Azuay"
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
                                        Provincia
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Ciudad
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
                                        <td className="px-4 py-2">
                                            {enterprise.province || "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                            {enterprise.city || "-"}
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
                                                                "¿Estás seguro de que deseas eliminar esta empresa?",
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/enterprises/${enterprise.id}`,
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
                                {!enterprises.length && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-4 text-red-400"
                                        >
                                            {hasActiveFilters
                                                ? "No se encontraron empresas con esos filtros."
                                                : "No hay empresas registradas."}
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
